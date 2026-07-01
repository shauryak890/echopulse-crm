import { useState, useMemo, useCallback } from 'react'
import { StatusSelect, SegmentChip } from './Badges'
import { IconTrash, IconLink } from './icons'
import { ICP_SEGMENTS } from '../lib/constants'
import { formatDate } from '../lib/format'

// Columns config drives both the header (sortable) and which fields render.
const COLUMNS = [
  { key: 'full_name', label: 'Name', sortable: true, w: 150 },
  { key: 'icp_segment', label: 'Segment', sortable: true, w: 160 },
  { key: 'title', label: 'Title / Role', sortable: true, w: 160 },
  { key: 'company', label: 'Company', sortable: true, w: 140 },
  { key: 'location', label: 'Location', sortable: true, w: 130 },
  { key: 'date_sent', label: 'Sent', sortable: true, w: 90 },
  { key: 'status', label: 'Status', sortable: true, w: 130 },
  { key: 'date_connected', label: 'Connected', sortable: true, w: 100 },
  { key: 'note_sent', label: 'Note Sent', sortable: false, w: 150 },
  { key: 'replied', label: 'Replied', sortable: true, w: 80 },
  { key: 'next_step', label: 'Next Step', sortable: false, w: 150 },
  { key: 'notes', label: 'Notes', sortable: false, w: 170 },
  { key: 'linkedin_url', label: 'URL', sortable: false, w: 60 },
]

// A single editable text cell. Commits on blur or Enter; reverts on Escape.
function TextCell({ value, onCommit, placeholder, wide }) {
  const [draft, setDraft] = useState(value ?? '')
  // keep local draft in sync if the row updates from elsewhere (realtime)
  const [lastValue, setLastValue] = useState(value ?? '')
  if ((value ?? '') !== lastValue) {
    setLastValue(value ?? '')
    setDraft(value ?? '')
  }

  const commit = () => {
    if (draft !== (value ?? '')) onCommit(draft)
  }
  return (
    <input
      className={`cell-edit ${wide ? 'wide' : ''}`}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          setDraft(value ?? '')
          e.currentTarget.blur()
        }
      }}
    />
  )
}

function DateCell({ value, onCommit }) {
  return (
    <input
      type="date"
      className="cell-edit"
      value={value ? String(value).slice(0, 10) : ''}
      onChange={(e) => onCommit(e.target.value)}
      style={{ minWidth: 120 }}
      title={value ? formatDate(value) : ''}
    />
  )
}

export default function LeadsTable({
  leads,
  onUpdate,
  onDelete,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  sort,
  onSort,
}) {
  const allSelected = leads.length > 0 && selected.size === leads.length

  const sortIndicator = useCallback(
    (key) => {
      if (sort.key !== key) return null
      return <span className="sort-ind">{sort.dir === 'asc' ? '▲' : '▼'}</span>
    },
    [sort]
  )

  const handleField = useCallback(
    (id, field, value) => onUpdate(id, { [field]: value }),
    [onUpdate]
  )

  return (
    <div className="table-wrap">
      <table className="leads">
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input
                type="checkbox"
                className="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                aria-label="Select all"
              />
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={col.sortable ? 'sortable' : ''}
                style={{ minWidth: col.w }}
                onClick={col.sortable ? () => onSort(col.key) : undefined}
              >
                {col.label}
                {col.sortable && sortIndicator(col.key)}
              </th>
            ))}
            <th style={{ width: 44 }} />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className={selected.has(lead.id) ? 'selected' : ''}>
              <td>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selected.has(lead.id)}
                  onChange={() => onToggleSelect(lead.id)}
                  aria-label={`Select ${lead.full_name || 'lead'}`}
                />
              </td>

              <td>
                <TextCell
                  value={lead.full_name}
                  placeholder="Name"
                  onCommit={(v) => handleField(lead.id, 'full_name', v)}
                />
              </td>

              <td>
                <select
                  className="cell-edit"
                  value={lead.icp_segment || ''}
                  onChange={(e) => handleField(lead.id, 'icp_segment', e.target.value)}
                  aria-label="Segment"
                >
                  <option value="">—</option>
                  {ICP_SEGMENTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>

              <td>
                <TextCell
                  value={lead.title}
                  placeholder="Title"
                  onCommit={(v) => handleField(lead.id, 'title', v)}
                />
              </td>
              <td>
                <TextCell
                  value={lead.company}
                  placeholder="Company"
                  onCommit={(v) => handleField(lead.id, 'company', v)}
                />
              </td>
              <td>
                <TextCell
                  value={lead.location}
                  placeholder="Location"
                  onCommit={(v) => handleField(lead.id, 'location', v)}
                />
              </td>

              <td>
                <DateCell
                  value={lead.date_sent}
                  onCommit={(v) => handleField(lead.id, 'date_sent', v)}
                />
              </td>

              <td>
                <StatusSelect
                  value={lead.status}
                  onChange={(v) => handleField(lead.id, 'status', v)}
                />
              </td>

              <td>
                <DateCell
                  value={lead.date_connected}
                  onCommit={(v) => handleField(lead.id, 'date_connected', v)}
                />
              </td>

              <td>
                <TextCell
                  value={lead.note_sent}
                  placeholder="Note sent…"
                  wide
                  onCommit={(v) => handleField(lead.id, 'note_sent', v)}
                />
              </td>

              <td>
                <select
                  className="cell-edit"
                  value={lead.replied ? 'yes' : 'no'}
                  onChange={(e) =>
                    handleField(lead.id, 'replied', e.target.value === 'yes')
                  }
                  aria-label="Replied"
                  style={{ minWidth: 64 }}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </td>

              <td>
                <TextCell
                  value={lead.next_step}
                  placeholder="Next step…"
                  wide
                  onCommit={(v) => handleField(lead.id, 'next_step', v)}
                />
              </td>
              <td>
                <TextCell
                  value={lead.notes}
                  placeholder="Notes…"
                  wide
                  onCommit={(v) => handleField(lead.id, 'notes', v)}
                />
              </td>

              <td>
                {lead.linkedin_url ? (
                  <a
                    href={lead.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cell-link"
                    title={lead.linkedin_url}
                    aria-label="Open LinkedIn profile"
                  >
                    <IconLink size={15} />
                  </a>
                ) : (
                  <TextCell
                    value={lead.linkedin_url}
                    placeholder="Paste URL"
                    onCommit={(v) => handleField(lead.id, 'linkedin_url', v)}
                  />
                )}
              </td>

              <td>
                <button
                  className="row-del"
                  onClick={() => onDelete(lead)}
                  aria-label={`Delete ${lead.full_name || 'lead'}`}
                  title="Delete lead"
                >
                  <IconTrash size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Sorting helper, exported for the page to use.
export function sortLeads(leads, { key, dir }) {
  if (!key) return leads
  const factor = dir === 'asc' ? 1 : -1
  return [...leads].sort((a, b) => {
    let av = a[key]
    let bv = b[key]
    if (key === 'replied') {
      av = av ? 1 : 0
      bv = bv ? 1 : 0
    }
    av = av ?? ''
    bv = bv ?? ''
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    if (av < bv) return -1 * factor
    if (av > bv) return 1 * factor
    return 0
  })
}

export { COLUMNS }
