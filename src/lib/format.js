// Small formatting helpers shared across the UI.

// Today's date as an ISO yyyy-mm-dd string, in the user's local timezone
// (not UTC) so "Date Request Sent" defaults match the calendar day they see.
export function todayISO() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

// Render an ISO date (yyyy-mm-dd) as a short, scannable label, e.g. "12 Mar 25".
// Returns '' for null/empty so empty cells stay quiet.
export function formatDate(iso) {
  if (!iso) return ''
  const parts = String(iso).slice(0, 10).split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const mi = parseInt(m, 10) - 1
  if (mi < 0 || mi > 11) return iso
  return `${parseInt(d, 10)} ${months[mi]} ${y.slice(2)}`
}

// Percentage with no decimals, guarding divide-by-zero.
export function pct(numerator, denominator) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 100)
}
