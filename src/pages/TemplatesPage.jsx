import CopyButton from '../components/CopyButton'
import { IconBan } from '../components/icons'
import { TEMPLATE_GROUPS, BANNED_PHRASES } from '../data/templates'

// Render template text with [bracketed placeholders] visually highlighted so
// the user remembers to personalize them before sending.
function HighlightedTemplate({ text }) {
  const parts = text.split(/(\[[^\]]+\])/g)
  return (
    <div className="tmpl-text">
      {parts.map((part, i) =>
        /^\[[^\]]+\]$/.test(part) ? (
          <span className="ph" key={i}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  )
}

function TemplateCard({ tmpl }) {
  const len = tmpl.text.length
  const over = tmpl.limit && len > tmpl.limit
  return (
    <div className="ref-card">
      <div className="ref-card-head">
        <div className="ref-card-title">{tmpl.stage}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {tmpl.limit && (
            <span className={`char-count ${over ? 'over' : ''}`} title="LinkedIn connection-note limit is 300 characters">
              {len} / {tmpl.limit}
            </span>
          )}
          <CopyButton text={tmpl.text} label="Copy" />
        </div>
      </div>
      <HighlightedTemplate text={tmpl.text} />
    </div>
  )
}

export default function TemplatesPage() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-sub">
            Connection notes and DMs by segment and stage. Copy one, then swap the{' '}
            <span className="ph">[highlighted]</span> bits for something real about them —
            a generic template gets ignored.
          </p>
        </div>
      </div>

      {/* Banned phrases reminder */}
      <div className="banned-box">
        <h3>
          <IconBan size={17} /> Banned phrases — never use these
        </h3>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px' }}>
          They read as filler and kill trust. Lead with the actual human work and real numbers instead.
        </p>
        <div className="banned-list">
          {BANNED_PHRASES.map((p) => (
            <span className="banned-tag" key={p}>
              {p}
            </span>
          ))}
        </div>
      </div>

      {TEMPLATE_GROUPS.map((group) => (
        <div className="ref-section" key={group.segment}>
          <h2>{group.segment}</h2>
          {group.templates.map((tmpl) => (
            <TemplateCard key={tmpl.stage} tmpl={tmpl} />
          ))}
        </div>
      ))}
    </div>
  )
}
