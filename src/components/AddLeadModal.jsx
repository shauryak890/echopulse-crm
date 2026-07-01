import { useState } from 'react'
import Modal from './Modal'
import LeadForm from './LeadForm'
import AiCapture from './AiCapture'
import { useToast } from './Toast'
import { todayISO } from '../lib/format'
import { isGroqConfigured } from '../lib/groq'

const EMPTY = () => ({
  full_name: '',
  linkedin_url: '',
  icp_segment: '',
  title: '',
  company: '',
  location: '',
  date_sent: todayISO(),
  status: 'Sent',
  note_sent: '',
  notes: '',
  replied: false,
})

// Add-lead flow. "From profile" uses the AI (paste text or a screenshot) to
// pre-fill the fields; "Enter manually" skips straight to the form. Both
// converge on the same editable LeadForm before saving.
export default function AddLeadModal({ onClose, onCreate, onBulk }) {
  const [mode, setMode] = useState(isGroqConfigured ? 'ai' : 'manual') // 'ai' | 'manual'
  const [lead, setLead] = useState(EMPTY)
  const [parsedYet, setParsedYet] = useState(false)
  const [saving, setSaving] = useState(false)
  const notify = useToast()

  const handleParsed = (fields) => {
    setLead((prev) => ({
      ...prev,
      full_name: fields.full_name || prev.full_name,
      title: fields.title || prev.title,
      company: fields.company || prev.company,
      location: fields.location || prev.location,
      icp_segment: fields.icp_segment || prev.icp_segment,
    }))
    setParsedYet(true)
  }

  const save = async () => {
    if (!lead.full_name?.trim()) {
      notify('Add a name first — that’s the one field we need.', { type: 'error' })
      return
    }
    setSaving(true)
    try {
      await onCreate(lead)
      notify(`Saved ${lead.full_name.trim()}.`)
      onClose()
    } catch (err) {
      notify(err.message || 'Couldn’t save the lead.', { type: 'error' })
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Add lead"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save lead'}
          </button>
        </>
      }
    >
      <div style={{ marginBottom: 18 }}>
        <div className="segmented" role="tablist" aria-label="Add method">
          <button
            role="tab"
            aria-selected={mode === 'ai'}
            className={mode === 'ai' ? 'on' : ''}
            onClick={() => setMode('ai')}
            disabled={!isGroqConfigured}
            title={isGroqConfigured ? undefined : 'Add VITE_GROQ_API_KEY to enable'}
          >
            From profile (AI)
          </button>
          <button
            role="tab"
            aria-selected={mode === 'manual'}
            className={mode === 'manual' ? 'on' : ''}
            onClick={() => setMode('manual')}
          >
            Enter manually
          </button>
        </div>

        {mode === 'ai' && !parsedYet && onBulk && (
          <p className="hint" style={{ display: 'block', marginTop: 10 }}>
            Sent a batch today?{' '}
            <button
              type="button"
              onClick={onBulk}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                padding: 0,
                font: 'inherit',
                textDecoration: 'underline',
              }}
            >
              Bulk import
            </button>{' '}
            reads many at once.
          </p>
        )}
      </div>

      {!isGroqConfigured && mode === 'ai' && (
        <div className="banner banner-warn">
          <div>
            The AI isn’t connected. Add <code>VITE_GROQ_API_KEY</code> to your <code>.env</code> and restart —
            or use <strong>Enter manually</strong>.
          </div>
        </div>
      )}

      {mode === 'ai' && isGroqConfigured && !parsedYet && (
        <AiCapture onParsed={handleParsed} />
      )}

      {mode === 'ai' && parsedYet && (
        <div>
          <p className="hint" style={{ display: 'block', marginBottom: 12 }}>
            Read by the AI. Check the fields, adjust the segment if needed, then save.
          </p>
          <LeadForm lead={lead} onChange={setLead} />
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => setParsedYet(false)}
          >
            Read another profile
          </button>
        </div>
      )}

      {mode === 'manual' && <LeadForm lead={lead} onChange={setLead} />}
    </Modal>
  )
}
