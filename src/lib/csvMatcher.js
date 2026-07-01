import Papa from 'papaparse'

// Parses a LinkedIn "Connections" CSV export and fuzzy-matches it against the
// existing leads. NO LinkedIn API/scraping anywhere — this only reads a file
// the user downloaded themselves from Settings > Data Privacy > Get a copy of
// your data > Connections.

// LinkedIn's export sometimes prepends a few "Notes:" lines before the real
// header row. We sniff for the header line that contains First/Last name.
function stripPreamble(text) {
  const lines = text.split(/\r?\n/)
  const headerIdx = lines.findIndex(
    (l) => /first\s*name/i.test(l) && /last\s*name/i.test(l)
  )
  if (headerIdx > 0) return lines.slice(headerIdx).join('\n')
  return text
}

// Map a parsed row's keys (header variations) to our canonical fields.
function readRow(row) {
  const keys = Object.keys(row)
  const find = (re) => {
    const k = keys.find((key) => re.test(key.trim()))
    return k ? String(row[k] ?? '').trim() : ''
  }
  return {
    first: find(/^first\s*name$/i),
    last: find(/^last\s*name$/i),
    connectedOn: find(/^connected\s*on$/i),
  }
}

// "18 Mar 2024" / "Mar 18, 2024" -> ISO yyyy-mm-dd. LinkedIn uses "DD Mon YYYY".
// Returns '' if we can't confidently parse it.
const MONTHS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}
export function parseConnectedDate(raw) {
  if (!raw) return ''
  const s = raw.trim()
  // DD Mon YYYY
  let m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/)
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()]
    if (mon) return `${m[3]}-${mon}-${m[1].padStart(2, '0')}`
  }
  // Mon DD, YYYY
  m = s.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/)
  if (m) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()]
    if (mon) return `${m[3]}-${mon}-${m[2].padStart(2, '0')}`
  }
  // Already ISO-ish
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  return ''
}

// Normalize a name for comparison: lowercase, strip accents, collapse spaces,
// drop punctuation. Makes "José  García-López" == "jose garcia lopez".
export function normalizeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Levenshtein distance, capped — used to forgive a one-or-two-char OCR/typo gap.
function editDistance(a, b) {
  if (a === b) return 0
  const al = a.length
  const bl = b.length
  if (!al) return bl
  if (!bl) return al
  let prev = Array.from({ length: bl + 1 }, (_, i) => i)
  let curr = new Array(bl + 1)
  for (let i = 1; i <= al; i++) {
    curr[0] = i
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[bl]
}

// Is `connName` a confident match for `leadName`?
// Tiered: exact normalized match -> token-set equality -> small edit distance.
function namesMatch(leadNorm, connNorm) {
  if (!leadNorm || !connNorm) return false
  if (leadNorm === connNorm) return true

  // Token-set: same words in any order ("Garcia Lopez Jose" vs "Jose Garcia Lopez").
  const a = new Set(leadNorm.split(' '))
  const b = new Set(connNorm.split(' '))
  if (a.size === b.size && [...a].every((t) => b.has(t))) return true

  // Forgive a tiny typo only for reasonably long names (avoid false hits on
  // short names like "Li" vs "Lu").
  if (Math.min(leadNorm.length, connNorm.length) >= 6) {
    const d = editDistance(leadNorm, connNorm)
    if (d <= 2) return true
  }
  return false
}

/**
 * Parse CSV text into normalized connection records.
 * Returns { connections, headerFound, rowCount }.
 */
export function parseConnectionsCsv(text) {
  const cleaned = stripPreamble(text)
  const parsed = Papa.parse(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  const connections = []
  for (const row of parsed.data) {
    const { first, last, connectedOn } = readRow(row)
    const fullName = `${first} ${last}`.trim()
    if (!fullName) continue
    connections.push({
      fullName,
      norm: normalizeName(fullName),
      connectedOn: parseConnectedDate(connectedOn),
    })
  }

  const headerFound =
    parsed.meta?.fields?.some((f) => /first\s*name/i.test(f)) ?? false

  return { connections, headerFound, rowCount: connections.length }
}

/**
 * Match parsed connections against existing leads.
 * Returns an array of proposed updates plus a summary.
 *
 * A lead is proposed for update when a connection name matches AND either:
 *   - its date_connected is empty (we can fill it), or
 *   - its status is 'Sent'/blank (we can advance it to 'Connected').
 * Already-connected leads with a date are reported as "already" (no-op).
 */
export function matchConnectionsToLeads(connections, leads) {
  const updates = []
  let alreadyMatched = 0

  for (const lead of leads) {
    const leadNorm = normalizeName(lead.full_name)
    if (!leadNorm) continue

    const hit = connections.find((c) => namesMatch(leadNorm, c.norm))
    if (!hit) continue

    const patch = {}
    if (!lead.date_connected && hit.connectedOn) {
      patch.date_connected = hit.connectedOn
    }
    const status = (lead.status || '').trim()
    if (status === 'Sent' || status === '') {
      patch.status = 'Connected'
    }

    if (Object.keys(patch).length === 0) {
      alreadyMatched += 1
      continue
    }

    updates.push({
      id: lead.id,
      leadName: lead.full_name,
      matchedName: hit.fullName,
      patch,
      connectedOn: hit.connectedOn,
    })
  }

  return {
    updates,
    summary: {
      connectionsParsed: connections.length,
      newMatches: updates.length,
      alreadyMatched,
    },
  }
}
