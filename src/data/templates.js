// Connection notes + DM templates, organized by segment and stage.
// `limit` (when set) is LinkedIn's connection-note character cap (300).
// Bracketed [placeholders] are highlighted in the UI as a reminder to personalize.

export const TEMPLATE_GROUPS = [
  {
    segment: 'Pune Real Estate',
    templates: [
      {
        stage: 'Connection note',
        limit: 300,
        text: 'Hi [Name] — saw your [property/listing] post. I edit property reels for Pune brokers, 48h turnaround. Happy to send you one free sample from your own footage, no charge. Worth connecting?',
      },
      {
        stage: 'Follow-up DM after accept',
        text: 'Hey [Name], thanks for connecting. Quick question — are you editing your reels yourself, or do you have someone? Looking at your last 10 posts, there are a couple of hook ideas sitting there that just need 24h to ship. I can send one edited tonight as a free sample. If you like it, ₹2,499 a reel after that. If not, we both move on. Want me to send it?',
      },
    ],
  },
  {
    segment: 'SaaS Founder',
    templates: [
      {
        stage: 'Connection note',
        limit: 300,
        text: 'Hey [Name] — saw your post on [their specific topic]. The way you framed [specific insight] is the angle most B2B founders miss. I run a one-team studio for founder content. Worth connecting?',
      },
      {
        stage: 'Follow-up DM after accept',
        text: 'Hey [Name], thanks for connecting. I run EchoPulse — a one-team studio for founders building their personal brand around the company. Most of my clients used to write LinkedIn posts on Sunday nights at midnight. I run their whole channel — posts, carousels, reels — in their voice. 20 to 30 hours back per week. I’ve got a $299, 14-day Pilot if you want to see real work before committing to anything. Open to a free 10-minute brand-brief preview first?',
      },
    ],
  },
  {
    segment: 'Coach / Course Creator',
    templates: [
      {
        stage: 'Connection note',
        limit: 300,
        text: 'Hi [Name] — saw your post on [their course/cohort topic]. Running a launch without content backing it up is brutal. I run a studio that handles pre-launch content + funnels for coaches. Worth connecting?',
      },
      {
        stage: 'Follow-up DM after accept',
        text: 'Hey [Name], thanks for connecting. Most coaches I work with are great at the thing they teach and drowning in the content needed to sell it. I run pre-launch content, short-form, ad creative, and funnels for coaches and course creators — one bill instead of five vendors. Got a $299 Pilot (14 days, no retainer) if you want to see the work before deciding anything. Want details?',
      },
    ],
  },
  {
    segment: 'Any segment',
    templates: [
      {
        stage: 'Day 5–7 nudge if no reply',
        text: 'Hey [Name], no pressure if the timing’s off — just didn’t want this to get buried. Still happy to send that free sample / Pilot details if useful. Either way, good luck with [specific thing from their recent post].',
      },
    ],
  },
]

// Phrases that are never allowed in EchoPulse copy.
export const BANNED_PHRASES = [
  'synergy',
  'leverage',
  'circle back',
  'touch base',
  'hop on a call',
  'AI-powered',
  'game-changer',
  'move the needle',
  'best-in-class',
  '“increase your engagement” (no real numbers)',
]
