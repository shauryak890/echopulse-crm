import { useState, useMemo, useCallback } from 'react'
import LeadsTable, { sortLeads } from '../components/LeadsTable'
import AddLeadModal from '../components/AddLeadModal'
import BulkImportModal from '../components/BulkImportModal'
import { useToast } from '../components/Toast'
import { IconPlus, IconTrash, IconSearch, IconUpload } from '../components/icons'
import { ICP_SEGMENTS, STATUSES } from '../lib/constants'

export default function LeadsPage({ state }) {
  const { leads, loading, error, configured, createLead, updateLead, removeLead, removeLeads } = state
  const notify = useToast()

  const [adding, setAdding] = useState(false)
  const [bulk, setBulk] = useState(false)
  const [query, setQuery] = useState('')
  const [segFilter, setSegFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState({ key: 'created_at', dir: 'desc' })
  const [selected, setSelected] = useState(new Set())

  const onSort = useCallback((key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = leads.filter((l) => {
      if (segFilter && l.icp_segment !== segFilter) return false
      if (statusFilter && (l.status || '') !== statusFilter) return false
      if (q) {
        const hay = [l.full_name, l.company, l.title, l.location, l.notes, l.next_step]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    return sortLeads(rows, sort)
  }, [leads, query, segFilter, statusFilter, sort])

  // Keep selection in sync with what's actually visible/existing.
  const visibleIds = useMemo(() => new Set(filtered.map((l) => l.id)), [filtered])

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      const allVisibleSelected = filtered.length > 0 && filtered.every((l) => prev.has(l.id))
      return allVisibleSelected ? new Set() : new Set(filtered.map((l) => l.id))
    })
  }, [filtered])

  const handleUpdate = useCallback(
    async (id, patch) => {
      try {
        await updateLead(id, patch)
      } catch (err) {
        notify(err.message || 'Update failed.', { type: 'error' })
      }
    },
    [updateLead, notify]
  )

  const handleDeleteOne = useCallback(
    async (lead) => {
      if (!window.confirm(`Delete ${lead.full_name || 'this lead'}? This can’t be undone.`)) return
      try {
        await removeLead(lead.id)
        setSelected((prev) => {
          const n = new Set(prev)
          n.delete(lead.id)
          return n
        })
        notify('Lead deleted.')
      } catch (err) {
        notify(err.message || 'Delete failed.', { type: 'error' })
      }
    },
    [removeLead, notify]
  )

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selected].filter((id) => visibleIds.has(id))
    if (!ids.length) return
    if (!window.confirm(`Delete ${ids.length} lead${ids.length > 1 ? 's' : ''}? This can’t be undone.`)) return
    try {
      await removeLeads(ids)
      setSelected(new Set())
      notify(`Deleted ${ids.length} lead${ids.length > 1 ? 's' : ''}.`)
    } catch (err) {
      notify(err.message || 'Bulk delete failed.', { type: 'error' })
    }
  }, [selected, visibleIds, removeLeads, notify])

  const selectedVisibleCount = useMemo(
    () => [...selected].filter((id) => visibleIds.has(id)).length,
    [selected, visibleIds]
  )

  const filtersActive = query || segFilter || statusFilter

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-sub">
            Your outbound pipeline. Click any cell to edit it inline — changes save straight to Supabase.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setBulk(true)} disabled={!configured}>
            <IconUpload className="ic" /> Bulk import
          </button>
          <button className="btn btn-primary" onClick={() => setAdding(true)} disabled={!configured}>
            <IconPlus className="ic" /> Add lead
          </button>
        </div>
      </div>

      {error && (
        <div className="banner banner-warn">
          <div>Couldn’t load leads: {error}</div>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="grow" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <IconSearch
            size={15}
            style={{ position: 'absolute', left: 10, color: 'var(--text-dim)' }}
          />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search name, company, title, notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="select" value={segFilter} onChange={(e) => setSegFilter(e.target.value)} aria-label="Filter by segment">
          <option value="">All segments</option>
          {ICP_SEGMENTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {filtersActive && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setQuery('')
              setSegFilter('')
              setStatusFilter('')
            }}
          >
            Clear
          </button>
        )}
        <div className="toolbar-spacer" />
        <span className="hint">
          {filtered.length} of {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
        </span>
      </div>

      {/* Bulk action bar */}
      {selectedVisibleCount > 0 && (
        <div className="bulkbar">
          <strong>{selectedVisibleCount} selected</strong>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
            <IconTrash className="ic" /> Delete selected
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      {/* Body states */}
      {loading ? (
        <div className="empty">
          <span className="spinner" />
          <p style={{ marginTop: 12 }}>Loading leads…</p>
        </div>
      ) : !configured ? (
        <div className="empty">
          <h3>Connect Supabase to start</h3>
          <p>
            Add your Supabase URL and anon key to <code>.env</code>, run <code>schema.sql</code>,
            then restart the dev server. The Search Strings and Templates pages work right now.
          </p>
        </div>
      ) : leads.length === 0 ? (
        <div className="empty">
          <h3>No leads yet</h3>
          <p>Paste a LinkedIn profile screenshot or add one manually to start.</p>
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <IconPlus className="ic" /> Add your first lead
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <h3>Nothing matches those filters</h3>
          <p>Loosen the search or clear the filters to see your leads again.</p>
        </div>
      ) : (
        <LeadsTable
          leads={filtered}
          onUpdate={handleUpdate}
          onDelete={handleDeleteOne}
          selected={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          sort={sort}
          onSort={onSort}
        />
      )}

      {adding && (
        <AddLeadModal
          onClose={() => setAdding(false)}
          onCreate={createLead}
          onBulk={() => {
            setAdding(false)
            setBulk(true)
          }}
        />
      )}

      {bulk && <BulkImportModal onClose={() => setBulk(false)} onCreate={createLead} />}
    </div>
  )
}
