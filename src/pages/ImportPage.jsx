import { useState, useRef, useCallback } from 'react'
import { parseConnectionsCsv, matchConnectionsToLeads } from '../lib/csvMatcher'
import { useToast } from '../components/Toast'
import { formatDate } from '../lib/format'
import { IconUpload, IconInfo, IconCheck } from '../components/icons'

export default function ImportPage({ state }) {
  const { leads, updateLead, configured } = state
  const notify = useToast()

  const [dragging, setDragging] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [preview, setPreview] = useState(null) // { updates, summary }
  const [applying, setApplying] = useState(false)
  const [done, setDone] = useState(null) // post-apply summary
  const fileRef = useRef(null)

  const analyze = useCallback(
    (text) => {
      setDone(null)
      const { connections, headerFound, rowCount } = parseConnectionsCsv(text)
      if (!rowCount) {
        notify(
          headerFound
            ? 'Found the header but no connection rows. Is the file empty?'
            : 'Couldn’t find the First Name / Last Name columns. Is this the Connections export?',
          { type: 'error' }
        )
        setPreview(null)
        return
      }
      const result = matchConnectionsToLeads(connections, leads)
      setPreview(result)
      if (!result.updates.length) {
        notify(
          `Parsed ${rowCount} connections — no new matches to update.`,
          { type: 'info' }
        )
      }
    },
    [leads, notify]
  )

  const onFile = useCallback(
    (file) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => analyze(String(e.target?.result || ''))
      reader.onerror = () => notify('Couldn’t read that file.', { type: 'error' })
      reader.readAsText(file)
    },
    [analyze, notify]
  )

  const applyUpdates = useCallback(async () => {
    if (!preview?.updates.length) return
    setApplying(true)
    let ok = 0
    let failed = 0
    for (const u of preview.updates) {
      try {
        await updateLead(u.id, u.patch)
        ok += 1
      } catch {
        failed += 1
      }
    }
    setApplying(false)
    setDone({
      newMatches: preview.summary.newMatches,
      updated: ok,
      failed,
      parsed: preview.summary.connectionsParsed,
    })
    setPreview(null)
    setPasteText('')
    notify(
      `${ok} lead${ok === 1 ? '' : 's'} updated${failed ? `, ${failed} failed` : ''}.`,
      { type: failed ? 'error' : 'info' }
    )
  }, [preview, updateLead, notify])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Import connections</h1>
          <p className="page-sub">
            The ToS-safe way to detect who accepted. Export your own Connections list from LinkedIn,
            drop it here, and we’ll match accepted requests to your leads. No scraping, no automation —
            just the CSV you download yourself.
          </p>
        </div>
      </div>

      {/* How-to */}
      <div className="banner banner-info">
        <IconInfo className="banner-icon" />
        <div>
          <strong>Get your Connections CSV:</strong> LinkedIn → Settings &amp; Privacy → Data Privacy →
          <em> Get a copy of your data</em> → pick <em>Connections</em> only → Request archive.
          LinkedIn emails you a file (<code>Connections.csv</code>) with{' '}
          <code>First Name</code>, <code>Last Name</code>, <code>Connected On</code>. Drop that here.
        </div>
      </div>

      {!configured && (
        <div className="banner banner-warn">
          <div>Connect Supabase first (see the Leads page) — there’s nothing to match against yet.</div>
        </div>
      )}

      {/* Dropzone */}
      <div
        className={`dropzone ${dragging ? 'drag' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          onFile(e.dataTransfer?.files?.[0])
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileRef.current?.click()
          }
        }}
        aria-label="Drop or click to upload your Connections CSV"
      >
        <IconUpload className="dropzone-icon" />
        <div>
          <strong>Drop your Connections.csv</strong> here, or click to choose it
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={(e) => {
            onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {/* Paste alternative */}
      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>
          Or paste CSV text directly
        </summary>
        <textarea
          className="textarea"
          style={{ marginTop: 10, minHeight: 120, fontFamily: 'var(--font-mono)', fontSize: 12 }}
          placeholder={'First Name,Last Name,URL,Email Address,Company,Position,Connected On\nAditya,Kulkarni,,,,,18 Mar 2024'}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 8 }}
          disabled={!pasteText.trim()}
          onClick={() => analyze(pasteText)}
        >
          Match pasted CSV
        </button>
      </details>

      {/* Preview of proposed matches */}
      {preview && preview.updates.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 15, marginBottom: 4 }}>
            {preview.summary.newMatches} new match
            {preview.summary.newMatches === 1 ? '' : 'es'} found
          </h2>
          <p className="hint" style={{ display: 'block', marginBottom: 12 }}>
            Parsed {preview.summary.connectionsParsed} connections.{' '}
            {preview.summary.alreadyMatched > 0 &&
              `${preview.summary.alreadyMatched} already up to date. `}
            Review, then apply to set Date Connected and advance “Sent” → “Connected”.
          </p>

          <div className="match-list">
            {preview.updates.map((u) => (
              <div className="match-row" key={u.id}>
                <strong style={{ minWidth: 160 }}>{u.leadName}</strong>
                <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                  matched “{u.matchedName}”
                </span>
                <span className="arrow">→</span>
                <span className="new-val">
                  {u.patch.status === 'Connected' && 'Connected'}
                  {u.patch.date_connected &&
                    `${u.patch.status === 'Connected' ? ' · ' : ''}${formatDate(u.patch.date_connected)}`}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={applyUpdates} disabled={applying}>
              {applying
                ? 'Applying…'
                : `Apply ${preview.updates.length} update${preview.updates.length === 1 ? '' : 's'}`}
            </button>
            <button className="btn btn-ghost" onClick={() => setPreview(null)} disabled={applying}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Post-apply summary */}
      {done && (
        <div className="card" style={{ marginTop: 26, borderColor: 'var(--accent-border)' }}>
          <h2 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconCheck size={18} style={{ color: 'var(--accent)' }} /> Import complete
          </h2>
          <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>
            {done.newMatches} match{done.newMatches === 1 ? '' : 'es'} found,{' '}
            {done.updated} lead{done.updated === 1 ? '' : 's'} updated
            {done.failed ? `, ${done.failed} failed` : ''}. Head to Leads to see the
            updated Date Connected and statuses.
          </p>
        </div>
      )}
    </div>
  )
}
