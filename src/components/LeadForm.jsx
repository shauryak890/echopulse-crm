import { ICP_SEGMENTS, STATUSES } from '../lib/constants'

// Controlled form for a lead's fields. Used both for manual entry and as the
// editable "review" step after OCR. The parent owns the `lead` object + setter.
export default function LeadForm({ lead, onChange }) {
  const set = (field) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value
    onChange({ ...lead, [field]: value })
  }

  return (
    <div className="form-grid">
      <div className="field span-2">
        <label className="label" htmlFor="lf-name">
          Full Name
        </label>
        <input
          id="lf-name"
          className="input"
          value={lead.full_name || ''}
          onChange={set('full_name')}
          placeholder="e.g. Aditya Kulkarni"
          autoFocus
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="lf-seg">
          ICP Segment
        </label>
        <select
          id="lf-seg"
          className="select"
          value={lead.icp_segment || ''}
          onChange={set('icp_segment')}
        >
          <option value="">Pick a segment…</option>
          {ICP_SEGMENTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="label" htmlFor="lf-status">
          Status
        </label>
        <select
          id="lf-status"
          className="select"
          value={lead.status || 'Sent'}
          onChange={set('status')}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="label" htmlFor="lf-title">
          Title / Role
        </label>
        <input
          id="lf-title"
          className="input"
          value={lead.title || ''}
          onChange={set('title')}
          placeholder="e.g. Founder"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="lf-company">
          Company
        </label>
        <input
          id="lf-company"
          className="input"
          value={lead.company || ''}
          onChange={set('company')}
          placeholder="e.g. Skyline Realty"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="lf-loc">
          Location
        </label>
        <input
          id="lf-loc"
          className="input"
          value={lead.location || ''}
          onChange={set('location')}
          placeholder="e.g. Pune, Maharashtra"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="lf-sent">
          Date Request Sent
        </label>
        <input
          id="lf-sent"
          type="date"
          className="input"
          value={lead.date_sent ? String(lead.date_sent).slice(0, 10) : ''}
          onChange={set('date_sent')}
        />
      </div>

      <div className="field span-2">
        <label className="label" htmlFor="lf-url">
          LinkedIn Profile URL <span style={{ textTransform: 'none', color: 'var(--text-dim)' }}>(optional)</span>
        </label>
        <input
          id="lf-url"
          className="input"
          value={lead.linkedin_url || ''}
          onChange={set('linkedin_url')}
          placeholder="https://www.linkedin.com/in/…"
        />
      </div>

      <div className="field span-2">
        <label className="label" htmlFor="lf-note">
          Note Sent
        </label>
        <textarea
          id="lf-note"
          className="textarea"
          value={lead.note_sent || ''}
          onChange={set('note_sent')}
          placeholder="The connection note you sent (paste from Templates)…"
        />
      </div>

      <div className="field span-2">
        <label className="label" htmlFor="lf-notes">
          Notes
        </label>
        <textarea
          id="lf-notes"
          className="textarea"
          value={lead.notes || ''}
          onChange={set('notes')}
          placeholder="Anything worth remembering — their recent post, a hook idea, timing…"
        />
      </div>
    </div>
  )
}
