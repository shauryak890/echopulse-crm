// Shared domain constants — kept in one place so the table, forms, dashboard,
// and libraries all agree on segment/status names and colors.

export const ICP_SEGMENTS = [
  'Pune Real Estate',
  'SaaS Founder',
  'Coach/Course Creator',
  'DTC/Ecom',
  'Business Owner',
  'Other',
]

// Order matters: this is the funnel order used by the pipeline dashboard.
export const STATUSES = [
  'Sent',
  'Connected',
  'Replied',
  'Call Booked',
  'Closed Won',
  'Closed Lost',
  'Ignored',
]

// Status -> color tokens. `bg`/`fg`/`border` drive the badge styling.
// Matches the spec: Sent=amber, Connected=green, Replied=blue,
// Call Booked=orange (brand accent), Closed Won=dark green,
// Closed Lost=gray, Ignored=light gray.
export const STATUS_COLORS = {
  Sent: { bg: 'rgba(217, 161, 50, 0.16)', fg: '#e0b252', border: 'rgba(217, 161, 50, 0.35)' },
  Connected: { bg: 'rgba(60, 178, 116, 0.16)', fg: '#5ec98e', border: 'rgba(60, 178, 116, 0.35)' },
  Replied: { bg: 'rgba(74, 144, 226, 0.16)', fg: '#6ba6ec', border: 'rgba(74, 144, 226, 0.35)' },
  'Call Booked': { bg: 'rgba(232, 99, 60, 0.18)', fg: '#f0865f', border: 'rgba(232, 99, 60, 0.40)' },
  'Closed Won': { bg: 'rgba(34, 110, 70, 0.22)', fg: '#4caE80', border: 'rgba(34, 110, 70, 0.45)' },
  'Closed Lost': { bg: 'rgba(120, 120, 120, 0.18)', fg: '#9a9a9a', border: 'rgba(120, 120, 120, 0.32)' },
  Ignored: { bg: 'rgba(120, 120, 120, 0.10)', fg: '#777', border: 'rgba(120, 120, 120, 0.22)' },
}

// Segment chip accents for the table/dashboard.
export const SEGMENT_COLORS = {
  'Pune Real Estate': '#e8633c',
  'SaaS Founder': '#6ba6ec',
  'Coach/Course Creator': '#b98ce0',
  'DTC/Ecom': '#5ec98e',
  'Business Owner': '#e0b252',
  Other: '#9a9a9a',
}

// Funnel stages shown as the dashboard's top counters.
export const FUNNEL_STAGES = [
  'Sent',
  'Connected',
  'Replied',
  'Call Booked',
  'Closed Won',
  'Closed Lost',
]
