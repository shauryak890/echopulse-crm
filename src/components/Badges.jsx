import { STATUS_COLORS, SEGMENT_COLORS, STATUSES } from '../lib/constants'

// Read-only status badge (used where the status isn't editable).
export function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS['Closed Lost']
  return (
    <span
      className="badge"
      style={{ background: c.bg, color: c.fg, borderColor: c.border }}
    >
      <span className="badge-dot" />
      {status || '—'}
    </span>
  )
}

// Editable status dropdown styled as a colored badge — used in the table.
export function StatusSelect({ value, onChange }) {
  const c = STATUS_COLORS[value] || STATUS_COLORS['Closed Lost']
  return (
    <select
      className="status-select"
      value={value || 'Sent'}
      onChange={(e) => onChange(e.target.value)}
      style={{ background: c.bg, color: c.fg, borderColor: c.border }}
      aria-label="Status"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} style={{ background: '#242424', color: '#ededed' }}>
          {s}
        </option>
      ))}
    </select>
  )
}

export function SegmentChip({ segment }) {
  if (!segment) return <span style={{ color: 'var(--text-dim)' }}>—</span>
  const color = SEGMENT_COLORS[segment] || SEGMENT_COLORS.Other
  return (
    <span className="seg-chip">
      <span className="badge-dot" style={{ background: color }} />
      {segment}
    </span>
  )
}
