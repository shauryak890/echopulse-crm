// Boolean search strings for LinkedIn's FREE People search (no Sales Navigator).
// Reference content — copy/paste into LinkedIn search, apply the suggested
// filters from the left rail.

export const SEARCH_STRINGS = [
  {
    segment: 'Pune Real Estate (solo)',
    string: '"real estate" AND (agent OR broker OR realtor) AND Pune',
    filters: 'Location: Pune · Connections: 2nd + 3rd · Industry: Real Estate',
    note: 'Also check Instagram directly for solo brokers — many aren’t very active on LinkedIn.',
  },
  {
    segment: 'Pune Real Estate (brokerage)',
    string: '"real estate" AND (principal OR director OR owner) AND (brokerage OR realty) AND Pune',
    filters: 'Location: Pune · Company size 2–50',
    note: 'Targets multi-agent brokerages for the higher-tier offer.',
  },
  {
    segment: 'SaaS Founder',
    string: '(founder OR "co-founder" OR CEO) AND (SaaS OR "B2B software") AND ("personal brand" OR content)',
    filters: 'Industry: Software Development · Company size 1–10 or 11–50',
    note: 'Narrow further by region (US/UK/EU/CA/AU).',
  },
  {
    segment: 'SaaS Founder (alt)',
    string: '"indie hacker" OR "solo founder" OR "bootstrapped founder"',
    filters: 'Connections 2nd + 3rd',
    note: 'Check their last 5 posts for declining consistency — that’s the buying signal.',
  },
  {
    segment: 'Coach / Course Creator',
    string: '(coach OR "course creator" OR educator) AND (cohort OR launch OR "online course")',
    filters: 'Industry: Professional Training & Coaching',
    note: 'A launch with no content backing it is the moment they feel the pain.',
  },
  {
    segment: 'Business Owner (general)',
    string: '(founder OR owner OR "managing director") AND ("service business" OR consultancy OR agency) NOT recruiter',
    filters: 'Company size 1–50',
    note: 'The NOT recruiter trims a lot of noise from these terms.',
  },
]

export const COMMERCIAL_LIMIT_NOTE =
  'LinkedIn’s free Commercial Use Limit throttles search after a set number of profile views/searches per month (resets monthly, exact number isn’t published). Work in focused batches of 15–20 profiles per session rather than one long run.'
