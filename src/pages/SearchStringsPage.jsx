import CopyButton from '../components/CopyButton'
import { IconAlert } from '../components/icons'
import { SEARCH_STRINGS, COMMERCIAL_LIMIT_NOTE } from '../data/searchStrings'

export default function SearchStringsPage() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Search strings</h1>
          <p className="page-sub">
            Boolean strings for LinkedIn’s free People search — no Sales Navigator needed.
            Copy one, paste it into the LinkedIn search bar, then apply the suggested filters
            from the left rail.
          </p>
        </div>
      </div>

      {/* Commercial use limit warning */}
      <div className="banner banner-warn">
        <IconAlert className="banner-icon" />
        <div>{COMMERCIAL_LIMIT_NOTE}</div>
      </div>

      {SEARCH_STRINGS.map((item) => (
        <div className="ref-card" key={item.segment}>
          <div className="ref-card-head">
            <div className="ref-card-title">{item.segment}</div>
            <CopyButton text={item.string} label="Copy string" />
          </div>

          <div className="codeblock">{item.string}</div>

          <div className="ref-meta">
            <b>Filters:</b> {item.filters}
            <br />
            <b>Note:</b> {item.note}
          </div>
        </div>
      ))}
    </div>
  )
}
