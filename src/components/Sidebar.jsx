import {
  IconLeads,
  IconImport,
  IconPipeline,
  IconSearch,
  IconTemplates,
} from './icons'

const NAV = [
  { key: 'leads', label: 'Leads', Icon: IconLeads },
  { key: 'import', label: 'Import', Icon: IconImport },
  { key: 'pipeline', label: 'Pipeline', Icon: IconPipeline },
  { key: 'search', label: 'Search Strings', Icon: IconSearch },
  { key: 'templates', label: 'Templates', Icon: IconTemplates },
]

export default function Sidebar({ active, onNavigate, leadCount }) {
  return (
    <nav className="sidebar" aria-label="Primary">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#242424" />
          <path
            d="M9 11h11M9 16h8M9 21h11"
            stroke="#E8633C"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="23.5" cy="16" r="2" fill="#E8633C" />
        </svg>
        <div>
          <div className="brand-name">EchoPulse</div>
          <div className="brand-tag">You run the business.<br />We run the content.</div>
        </div>
      </div>

      {NAV.map(({ key, label, Icon }) => (
        <button
          key={key}
          className={`nav-item ${active === key ? 'active' : ''}`}
          onClick={() => onNavigate(key)}
          aria-current={active === key ? 'page' : undefined}
        >
          <Icon className="nav-icon" />
          {label}
          {key === 'leads' && leadCount > 0 && (
            <span className="nav-count">{leadCount}</span>
          )}
        </button>
      ))}

      <div className="sidebar-foot">
        Internal tool · No LinkedIn automation.
        <br />
        Data you paste, only.
      </div>
    </nav>
  )
}
