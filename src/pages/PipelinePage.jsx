import { useMemo } from 'react'
import { ICP_SEGMENTS, SEGMENT_COLORS, FUNNEL_STAGES } from '../lib/constants'
import { pct } from '../lib/format'

// All metrics are derived live from the leads array — nothing stored separately,
// so this updates the moment a lead is added/edited (realtime feeds the array).
//
// Counting model:
//  - "Sent" counts every lead that has entered the pipeline (any status except
//    Ignored counts as having had a request sent — they all started as Sent).
//  - Each later stage counts leads that reached *at least* that stage, so the
//    funnel reads top-to-bottom sensibly (Connected includes those who Replied,
//    booked, or closed). Closed Lost / Ignored are shown as their own tallies.
function computeStats(leads) {
  const reached = (statuses) =>
    leads.filter((l) => statuses.includes((l.status || 'Sent'))).length

  // Funnel cumulative buckets.
  const closedWon = reached(['Closed Won'])
  const callBooked = reached(['Call Booked', 'Closed Won'])
  const replied = reached(['Replied', 'Call Booked', 'Closed Won'])
  const connected = reached(['Connected', 'Replied', 'Call Booked', 'Closed Won'])
  // Every lead in this CRM represents a request that was sent — that's the
  // app's premise — so "Sent" is simply the total row count. This is the
  // acceptance-rate denominator (Connected / Sent).
  const sent = leads.length
  const closedLost = reached(['Closed Lost'])
  const ignored = reached(['Ignored'])

  const counts = {
    Sent: sent,
    Connected: connected,
    Replied: replied,
    'Call Booked': callBooked,
    'Closed Won': closedWon,
    'Closed Lost': closedLost,
    Ignored: ignored,
  }

  // Per-segment sent + connected.
  const bySegment = ICP_SEGMENTS.map((seg) => {
    const rows = leads.filter((l) => l.icp_segment === seg)
    const segSent = rows.length
    const segConnected = rows.filter((l) =>
      ['Connected', 'Replied', 'Call Booked', 'Closed Won'].includes(l.status || 'Sent')
    ).length
    return { seg, sent: segSent, connected: segConnected }
  }).filter((s) => s.sent > 0)

  return { counts, sent, connected, closedWon, bySegment }
}

function Metric({ label, value, foot, hero }) {
  return (
    <div className={`metric ${hero ? 'hero' : ''}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {foot && <div className="metric-foot">{foot}</div>}
    </div>
  )
}

export default function PipelinePage({ state }) {
  const { leads, configured } = state
  const stats = useMemo(() => computeStats(leads), [leads])

  const acceptance = pct(stats.connected, stats.sent)
  const maxSegSent = Math.max(1, ...stats.bySegment.map((s) => s.sent))

  if (!configured) {
    return (
      <div className="page">
        <div className="page-head">
          <h1 className="page-title">Pipeline</h1>
        </div>
        <div className="empty">
          <h3>Connect Supabase to see your pipeline</h3>
          <p>Once leads are flowing in, this fills with live counts and acceptance rate.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Pipeline</h1>
          <p className="page-sub">
            Live from your leads table. Updates the moment anything changes.
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="empty">
          <h3>Nothing to measure yet</h3>
          <p>Add a few leads and this dashboard lights up — counts, acceptance rate, segment splits.</p>
        </div>
      ) : (
        <>
          {/* Top counters */}
          <div className="metric-grid">
            <Metric
              label="Acceptance rate"
              value={`${acceptance}%`}
              foot={`${stats.connected} connected / ${stats.sent} sent`}
              hero
            />
            {FUNNEL_STAGES.map((stage) => (
              <Metric key={stage} label={stage} value={stats.counts[stage]} />
            ))}
          </div>

          {/* Segment breakdown */}
          <div className="card">
            <h2 style={{ fontSize: 15, marginBottom: 4 }}>Breakdown by segment</h2>
            <div className="legend">
              <span>
                <i style={{ background: 'rgba(217, 161, 50, 0.55)' }} /> Sent
              </span>
              <span>
                <i style={{ background: 'var(--accent)' }} /> Connected
              </span>
            </div>

            {stats.bySegment.length === 0 ? (
              <p className="hint">No leads have a segment set yet.</p>
            ) : (
              stats.bySegment.map(({ seg, sent, connected }) => (
                <div className="bar-row" key={seg}>
                  <div className="seg-chip">
                    <span
                      className="badge-dot"
                      style={{ background: SEGMENT_COLORS[seg] || '#999', width: 8, height: 8 }}
                    />
                    {seg}
                  </div>
                  <div className="bar-track" title={`${connected} connected of ${sent} sent`}>
                    {/* Sent bar (full width relative to the biggest segment) */}
                    <div
                      className="bar-fill sent"
                      style={{ width: `${(sent / maxSegSent) * 100}%`, position: 'absolute', left: 0 }}
                    />
                    {/* Connected overlay */}
                    <div
                      className="bar-fill connected"
                      style={{ width: `${(connected / maxSegSent) * 100}%`, position: 'relative' }}
                    />
                  </div>
                  <div className="bar-nums">
                    {connected}/{sent} · {pct(connected, sent)}%
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Closed tallies */}
          <div className="metric-grid" style={{ marginTop: 22 }}>
            <Metric
              label="Closed Won"
              value={stats.counts['Closed Won']}
              foot={stats.sent ? `${pct(stats.counts['Closed Won'], stats.sent)}% of sent` : ''}
            />
            <Metric label="Closed Lost" value={stats.counts['Closed Lost']} />
            <Metric label="Ignored" value={stats.counts['Ignored']} />
          </div>
        </>
      )}
    </div>
  )
}
