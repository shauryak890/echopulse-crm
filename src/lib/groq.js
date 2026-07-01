// Groq client — turns a LinkedIn profile (pasted text or a screenshot) into
// structured lead fields. Groq's free tier is fast and has generous limits.
// OpenAI-compatible chat/completions API, called directly via fetch.
//
// SECURITY: VITE_ vars are inlined into the browser bundle, so this key is
// effectively public. Keep it on the free tier and treat it as exposed. See
// README / .env.example.

import { ICP_SEGMENTS } from './constants'

const API_KEY = import.meta.env.VITE_GROQ_API_KEY
export const isGroqConfigured = Boolean(API_KEY)

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
// Text: fast, strong 70B. Vision: Llama 4 Scout reads images.
const TEXT_MODEL = 'llama-3.3-70b-versatile'
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

const SYSTEM_PROMPT = `You extract lead details from a LinkedIn profile (given as a screenshot OR as copied page text) for a sales CRM.
Return ONLY the profile owner's details — ignore sidebars ("More profiles for you"), ads, feed posts, navigation, "People also viewed", and any other person on the page.
Respond with ONLY a JSON object (no markdown, no prose) with exactly these string keys:
- "full_name": the person's name (no connection degree like "2nd", no badges).
- "title": their current job title / role (short — e.g. "Founder", "Real Estate Broker", or their headline's first phrase). Not the company.
- "company": their current company/organization name only.
- "location": "City, Region, Country" as shown.
- "icp_segment": the single best match from this exact list, or "" if unclear: ${ICP_SEGMENTS.join(', ')}.
If a field is not visible, use an empty string "". Never guess or invent values.`

// Read a File/Blob into a data URL (base64) — used for the image path.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the image file.'))
    reader.readAsDataURL(file)
  })
}

export async function parseProfileText(pageText) {
  const trimmed = (pageText || '').trim()
  if (!trimmed) throw new Error('Paste some profile text first.')
  const snippet = trimmed.slice(0, 12000)
  return callGroq(
    TEXT_MODEL,
    [
      {
        type: 'text',
        text:
          'Extract the profile owner’s lead details from this copied LinkedIn profile text. ' +
          'The text may include navigation, "People also viewed", and other noise — ignore it.\n\n' +
          snippet,
      },
    ],
    'text'
  )
}

export async function parseProfileImage(dataUrl) {
  return callGroq(
    VISION_MODEL,
    [
      { type: 'text', text: 'Extract the profile owner’s lead details from this LinkedIn screenshot.' },
      { type: 'image_url', image_url: { url: dataUrl } },
    ],
    'image'
  )
}

// Shared request/response handling, with retry-on-429 (exponential backoff).
async function callGroq(model, userContent, kind) {
  if (!isGroqConfigured) {
    throw new Error(
      'Groq isn’t connected. Add VITE_GROQ_API_KEY to your .env, then restart the dev server.'
    )
  }

  const body = {
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  }

  const maxAttempts = 3
  let lastErr = ''
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
      })
    } catch {
      throw new Error('Couldn’t reach Groq. Check your internet connection.')
    }

    if (res.ok) {
      const json = await res.json()
      const text = json?.choices?.[0]?.message?.content
      if (!text) throw new Error('Groq returned no result. Try again or enter the lead manually.')
      return normalize(text)
    }

    // Read error detail once.
    let detail = ''
    try {
      const err = await res.json()
      detail = err?.error?.message || ''
    } catch {
      /* ignore */
    }

    if (res.status === 401) throw new Error('Groq API key is invalid. Check VITE_GROQ_API_KEY.')
    if (res.status === 400 && /model/i.test(detail))
      throw new Error(`Groq model unavailable${detail ? `: ${detail}` : ''}.`)

    if (res.status === 429) {
      // Respect Retry-After if given; otherwise exponential backoff.
      lastErr = detail || 'Rate limit hit.'
      if (attempt < maxAttempts) {
        const retryAfter = Number(res.headers.get('retry-after'))
        const waitMs = retryAfter > 0 ? retryAfter * 1000 : 1500 * attempt
        await new Promise((r) => setTimeout(r, waitMs))
        continue
      }
      throw new Error('Groq rate limit hit. Wait a few seconds and try again.')
    }

    throw new Error(`Groq error ${res.status}${detail ? `: ${detail}` : ''}.`)
  }
  throw new Error(lastErr || 'Groq request failed.')
}

// Parse + validate the model's JSON into normalized lead fields.
function normalize(rawText) {
  let text = rawText.trim()
  // Strip accidental ```json fences if the model added them.
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Groq returned an unexpected format. Try again.')
  }
  const clean = (v) => (typeof v === 'string' ? v.trim() : '')
  const segment = clean(parsed.icp_segment)
  return {
    full_name: clean(parsed.full_name),
    title: clean(parsed.title),
    company: clean(parsed.company),
    location: clean(parsed.location),
    icp_segment: ICP_SEGMENTS.includes(segment) ? segment : '',
  }
}
