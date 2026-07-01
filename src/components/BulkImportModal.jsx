import { useState, useRef, useCallback } from 'react'
import Modal from './Modal'
import { parseProfileText, parseProfileImage, fileToDataUrl } from '../lib/groq'
import { useToast } from './Toast'
import { todayISO } from '../lib/format'
import { ICP_SEGMENTS } from '../lib/constants'
import { IconUpload, IconInfo, IconTrash, IconCheck, IconAlert } from './icons'

// Bulk lead import via the AI (Groq). Two ways to feed a batch:
//  - Paste multiple profiles' text, one block per profile, separated by a line
//    containing only "---". (Cheapest; best for free-tier limits.)
//  - Drop many screenshots at once (one profile per image).
// Each is parsed by the AI, shown in an editable review table, then saved
// together with today's date and status "Sent".
//
// Requests run sequentially with a small delay to respect free-tier RPM limits.
// Groq's free tier is generous, so a short delay is plenty.
const DELAY_MS = 700

export default function BulkImportModal({ onClose, onCreate }) {
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [text, setText] = useState('')
  const [defaultSegment, setDefaultSegment] = useState('')
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSummary, setSavedSummary] = useState(null)
  const fileRef = useRef(null)
  const notify = useToast()
  const rowSeq = useRef(0)

  const addRow = (fields, label, error) =>
    setRows((prev) => [
      ...prev,
      {
        id: ++rowSeq.current,
        label,
        full_name: fields?.full_name || '',
        title: fields?.title || '',
        company: fields?.company || '',
        location: fields?.location || '',
        icp_segment: fields?.icp_segment || '',
        ok: Boolean(fields?.full_name),
        error: error || '',
      },
    ])

  // Process a list of {kind, payload} jobs sequentially (rate-limit friendly).
  const runJobs = useCallback(
    async (jobs) => {
      setBusy(true)
      setProgress({ done: 0, total: jobs.length })
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i]
        try {
          const fields =
            job.kind === 'text'
              ? await parseProfileText(job.payload)
              : await parseProfileImage(job.payload)
          addRow(fields, job.label)
        } catch (e) {
          addRow(null, job.label, e.message || 'Failed')
        }
        setProgress({ done: i + 1, total: jobs.length })
        if (i < jobs.length - 1) await new Promise((r) => setTimeout(r, DELAY_MS))
      }
      setBusy(false)
    },
    []
  )

  const runText = useCallback(() => {
    const blocks = text
      .split(/^\s*---\s*$/m)
      .map((b) => b.trim())
      .filter(Boolean)
    if (!blocks.length) {
      notify('Paste at least one profile’s text.', { type: 'error' })
      return
    }
    setText('')
    runJobs(blocks.map((b, i) => ({ kind: 'text', payload: b, label: `Profile ${rows.length + i + 1}` })))
  }, [text, runJobs, notify, rows.length])

  const runImages = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
      if (!files.length) {
        notify('No images found in that drop.', { type: 'error' })
        return
      }
      const jobs = []
      for (const f of files) {
        try {
          jobs.push({ kind: 'image', payload: await fileToDataUrl(f), label: f.name })
        } catch {
          addRow(null, f.name, 'Could not read file')
        }
      }
      runJobs(jobs)
    },
    [runJobs, notify]
  )

  const setField = (id, field, value) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id))

  const applyDefaultSegment = () => {
    if (!defaultSegment) return
    setRows((prev) => prev.map((r) => (r.icp_segment ? r : { ...r, icp_segment: defaultSegment })))
  }

  const validRows = rows.filter((r) => r.full_name.trim())

  const saveAll = useCallback(async () => {
    if (!validRows.length) {
      notify('No rows with a name to save. Fix the flagged rows first.', { type: 'error' })
      return
    }
    setSaving(true)
    const today = todayISO()
    let ok = 0
    let failed = 0
    for (const r of validRows) {
      try {
        await onCreate({
          full_name: r.full_name.trim(),
          title: r.title.trim(),
          company: r.company.trim(),
          location: r.location.trim(),
          icp_segment: r.icp_segment || '',
          status: 'Sent',
          date_sent: today,
          replied: false,
        })
        ok += 1
      } catch {
        failed += 1
      }
    }
    setSaving(false)
    setSavedSummary({ ok, failed })
    notify(`${ok} lead${ok === 1 ? '' : 's'} saved${failed ? `, ${failed} failed` : ''}.`, {
      type: failed ? 'error' : 'info',
    })
    if (!failed) setTimeout(onClose, 700)
  }, [validRows, onCreate, notify, onClose])

  const badCount = rows.length - validRows.length

  return (
    <Modal
      title="Bulk import leads"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
            {savedSummary ? 'Close' : 'Cancel'}
          </button>
          <button className="btn btn-primary" onClick={saveAll} disabled={saving || busy || !validRows.length}>
            {saving ? 'Saving…' : `Save ${validRows.length} lead${validRows.length === 1 ? '' : 's'}`}
          </button>
        </>
      }
    >
      <div className="banner banner-info" style={{ marginBottom: 16 }}>
        <IconInfo className="banner-icon" />
        <div>
          Paste several profiles’ text (separate each with a line of{' '}
          <span className="kbd">---</span>) — cheapest and best for free-tier limits — or drop many
          screenshots. The AI reads each into a row below. Requests run one at a time to stay under rate limits.
        </div>
      </div>

      {/* Text batch */}
      <div className="field" style={{ marginBottom: 14 }}>
        <label className="label">Paste profiles (separate with a line of ---)</label>
        <textarea
          className="textarea"
          style={{ minHeight: 130, fontSize: 12.5 }}
          placeholder={'First profile’s text…\n---\nSecond profile’s text…\n---\nThird…'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 8, alignSelf: 'flex-start' }}
          onClick={runText}
          disabled={busy || !text.trim()}
        >
          Read pasted profiles
        </button>
      </div>

      {/* Image batch */}
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
          runImages(e.dataTransfer?.files)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileRef.current?.click()
          }
        }}
        style={{ padding: '20px' }}
        aria-label="Drop or click to upload multiple profile screenshots"
      >
        <IconUpload className="dropzone-icon" />
        <div>
          …or <strong>drop many screenshots</strong> here (one profile each)
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            runImages(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {busy && (
        <div className="hint" style={{ marginTop: 14 }}>
          <span className="spinner" /> Reading with AI… {progress.done} / {progress.total}
        </div>
      )}

      {/* Default-segment helper */}
      {rows.length > 0 && (
        <div className="toolbar" style={{ marginTop: 18, marginBottom: 10 }}>
          <span className="hint">
            {rows.length} parsed · {validRows.length} ready
            {badCount > 0 && ` · ${badCount} need a name`}
          </span>
          <div className="toolbar-spacer" />
          <select
            className="select"
            value={defaultSegment}
            onChange={(e) => setDefaultSegment(e.target.value)}
            aria-label="Default segment"
          >
            <option value="">Set segment for all…</option>
            {ICP_SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={applyDefaultSegment} disabled={!defaultSegment}>
            Apply to empty
          </button>
        </div>
      )}

      {/* Review table */}
      {rows.length > 0 && (
        <div className="table-wrap" style={{ maxHeight: '40vh' }}>
          <table className="leads">
            <thead>
              <tr>
                <th style={{ minWidth: 140 }}>Name</th>
                <th style={{ minWidth: 150 }}>Segment</th>
                <th style={{ minWidth: 150 }}>Title</th>
                <th style={{ minWidth: 130 }}>Company</th>
                <th style={{ minWidth: 130 }}>Location</th>
                <th style={{ minWidth: 120 }}>Source</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input
                      className="cell-edit"
                      value={r.full_name}
                      placeholder="Name required"
                      onChange={(e) => setField(r.id, 'full_name', e.target.value)}
                      style={!r.full_name.trim() ? { borderColor: 'var(--danger)' } : undefined}
                    />
                  </td>
                  <td>
                    <select
                      className="cell-edit"
                      value={r.icp_segment}
                      onChange={(e) => setField(r.id, 'icp_segment', e.target.value)}
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
                    <input className="cell-edit wide" value={r.title} onChange={(e) => setField(r.id, 'title', e.target.value)} />
                  </td>
                  <td>
                    <input className="cell-edit" value={r.company} onChange={(e) => setField(r.id, 'company', e.target.value)} />
                  </td>
                  <td>
                    <input className="cell-edit" value={r.location} onChange={(e) => setField(r.id, 'location', e.target.value)} />
                  </td>
                  <td>
                    <span
                      className="hint"
                      title={r.error || r.label}
                      style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', whiteSpace: 'nowrap' }}
                    >
                      {r.ok ? (
                        <IconCheck size={13} style={{ color: 'var(--accent)' }} />
                      ) : (
                        <IconAlert size={13} style={{ color: 'var(--danger)' }} />
                      )}{' '}
                      {r.error ? r.error : r.label}
                    </span>
                  </td>
                  <td>
                    <button className="row-del" onClick={() => removeRow(r.id)} aria-label="Remove row">
                      <IconTrash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {savedSummary && (
        <div className="banner banner-info" style={{ marginTop: 16 }}>
          <IconCheck className="banner-icon" style={{ color: 'var(--accent)' }} />
          <div>
            Saved {savedSummary.ok} lead{savedSummary.ok === 1 ? '' : 's'}
            {savedSummary.failed ? `, ${savedSummary.failed} failed` : ''}.
          </div>
        </div>
      )}
    </Modal>
  )
}
