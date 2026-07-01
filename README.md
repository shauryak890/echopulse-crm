# EchoPulse CRM

A LinkedIn lead-gen CRM for the EchoPulse content studio. Single-page React + Vite app, Supabase for storage, deploys to Netlify.

**You run the business. We run the content.**

It does these things:

1. **Profile → Lead (AI)** — open a LinkedIn profile, **copy the page text** (`Ctrl+A`, `Ctrl+C`) and paste it, *or* paste/drop a **screenshot**. Groq (fast, free-tier LLMs) reads it and returns name / title / company / location and a best-guess ICP segment into an editable form you review before saving. It understands the content, so it handles any profile layout. **Bulk mode:** paste many profiles (separated by a line of `---`) or drop many screenshots, review them all in a table, set segments, and save them together.
2. **Leads table** — sortable, filterable, inline-editable, with a per-row **status dropdown** (color-coded), single and bulk delete.
3. **Connections CSV import** — drop your own LinkedIn Connections export; it fuzzy-matches accepted requests to your leads and auto-fills *Date Connected* + advances *Sent → Connected*.
4. **Pipeline dashboard** — live counts, acceptance rate, per-segment breakdown. No stored aggregates; everything is derived from the leads table in real time.
5. **Search Strings + Templates** — copy-to-clipboard Boolean search strings and connection/DM templates, in the EchoPulse voice.

> **No LinkedIn automation, anywhere.** This app never talks to linkedin.com. It only ever reads data *you* copy or paste — profile text/screenshots you capture yourself, or the Connections CSV you download from your own account settings. That's the ToS-safe way to do this.

### Text vs screenshot?

- **Paste text (default)** — cheapest on the free tier (a screenshot costs many more tokens than text), so it's the right choice for daily batches. One extra step: `Ctrl+A` / `Ctrl+C` on the profile.
- **Screenshot** — easiest to capture (just paste an image); the AI reads it directly with no cropping. Uses more of your free-tier quota, so prefer text for large batches.
- **Manual** — always available for one-offs, and works without an AI key.

---

## 1. Create the database table

1. Open your Supabase project.
2. Go to **SQL Editor → New query**.
3. Paste the entire contents of [`schema.sql`](schema.sql) and click **Run**.
4. Confirm a `leads` table appears under **Table Editor**.

`schema.sql` creates the `leads` table, an index, enables Row Level Security, and adds the table to the realtime publication so the UI updates live.

### A note on Row Level Security (read this)

`schema.sql` ships **two** RLS options, commented inline:

- **Option A (recommended, default in the file):** full access for *authenticated* users. This requires you to turn on Supabase Auth and sign in. With this policy and **no** login, the app's requests are rejected.
- **Option B:** full access for the **anon** role — i.e. no login at all. The app as shipped has no login screen, so **if you want it to work immediately without building auth, use Option B** (uncomment it, comment out Option A).

This is an internal tool for a small trusted team, so "allow all" is an acceptable tradeoff — but the anon key ships in the built JavaScript and should be treated as public. If you use Option B, keep the deployed URL private and the data low-sensitivity. For anything real, prefer Option A plus a quick Supabase Auth login. Both tradeoffs are documented in `schema.sql`.

---

## 2. Get your Supabase URL + anon key

1. In Supabase, go to **Project Settings → API**.
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public** key → `VITE_SUPABASE_ANON_KEY` (the publishable one — **not** the `service_role` secret key)
3. Copy `.env.example` to `.env` and paste your values in:

   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

`.env` is gitignored — never commit real credentials. If `.env` is missing or blank, the app still loads (no console errors) and shows a setup banner; the Search Strings and Templates pages work without Supabase.

## 2b. Get a Groq API key (for Profile → Lead)

Groq runs open LLMs on a fast, generous free tier — used here for reading profiles (Llama 3.3 70B for text, Llama 4 Scout for screenshots).

1. Go to **https://console.groq.com/keys** and create a free API key.
2. Add it to `.env`:

   ```env
   VITE_GROQ_API_KEY=your-groq-api-key
   ```

3. Restart `npm run dev`.

Without this key, the **From profile (AI)** and **Bulk import** features are disabled (the tab is greyed out) — everything else, including **Enter manually**, still works.

> **⚠️ Security note.** This is a client-side app, so `VITE_*` values are baked into the browser bundle. The Groq key is therefore **public** to anyone who opens the deployed site's dev tools (same as the Supabase anon key). Keep it on the **free tier** (no billing attached) so a leaked key can't run up a bill, and rotate it in the Groq console if you ever suspect it's compromised. For a fully locked-down setup you'd proxy the key through a serverless function — out of scope for this internal tool.
>
> **Free-tier note:** pasting **text** costs far fewer tokens than a **screenshot**, so prefer text for big batches to stay under the per-minute limits. Bulk import runs requests one at a time (with a short delay) and auto-retries on a rate-limit hit.

---

## 3. Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

---

## 4. Deploy to Netlify

1. Push this repo to GitHub/GitLab.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Build settings are already in [`netlify.toml`](netlify.toml) — Netlify reads them automatically:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - SPA redirect (`/* → /index.html`) is included.
4. Set the environment variables in **Site settings → Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GROQ_API_KEY` (keep it on the free tier — see 2b)

   (Same values as your local `.env`. Vite inlines `VITE_*` vars at build time, so set them **before** the first deploy or trigger a redeploy after adding them.)
5. Deploy.

---

## How the features work

### Profile → Lead (AI)
The client ([`src/lib/groq.js`](src/lib/groq.js)) sends the pasted profile text or screenshot to Groq's OpenAI-compatible API with a strict JSON schema, so the model returns exactly `{ full_name, title, company, location, icp_segment }` — no fragile regex parsing. Because the model *understands* the content, it works across any profile layout and ignores sidebars/ads. The parsed fields land in an editable form so you review before saving. Rate-limit hits auto-retry with backoff.

### Connections CSV import
Export your connections from LinkedIn: **Settings & Privacy → Data Privacy → Get a copy of your data → Connections** (only) → Request archive. You'll get a `Connections.csv` with `First Name`, `Last Name`, `Connected On`. Drop it on the Import page. Matching ([`src/lib/csvMatcher.js`](src/lib/csvMatcher.js)) is case-insensitive, accent-insensitive, token-order-insensitive, and forgives small typos. It previews proposed updates before applying anything.

### Pipeline
Every number is computed from the leads array on render, so adding or editing a lead (or a realtime change from another tab) updates the dashboard instantly. The funnel is cumulative — *Connected* includes everyone who later replied, booked, or closed.

---

## Tech

- **React 18 + Vite 5** — SPA, fast builds.
- **@supabase/supabase-js** — data + realtime subscriptions.
- **Groq API** — profile → lead parsing (called via `fetch`, no SDK).
- **papaparse** — robust CSV parsing.
- No CSS framework — a small custom design system in [`src/styles/index.css`](src/styles/index.css) (dark theme, terracotta accent, Space Grotesk / Inter / JetBrains Mono).

## Project layout

```
src/
  components/    shared UI (table, modal, badges, AI capture, bulk import, toast, icons…)
  pages/         Leads, Import, Pipeline, SearchStrings, Templates
  hooks/         useLeads (Supabase mirror + realtime)
  lib/           supabaseClient, leadsApi, groq, csvMatcher, constants, format
  data/          static reference content (search strings, templates)
  styles/        global CSS + design tokens
schema.sql       run this in Supabase
netlify.toml     build config
```
