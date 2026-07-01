-- ============================================================================
-- EchoPulse CRM — Supabase schema
-- ============================================================================
-- How to run this:
--   1. Open your Supabase project.
--   2. Go to SQL Editor > New query.
--   3. Paste this whole file and click "Run".
--   4. Confirm the `leads` table appears under Table Editor.
--
-- This is idempotent enough to paste again safely (uses IF NOT EXISTS / drops
-- the policy before recreating it).
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto. It's usually enabled on Supabase already;
-- this is a no-op if so.
create extension if not exists pgcrypto;

create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  full_name      text,
  linkedin_url   text,
  icp_segment    text,
  title          text,
  company        text,
  location       text,
  date_sent      date,
  status         text default 'Sent',
  date_connected date,
  note_sent      text,
  replied        boolean default false,
  next_step      text,
  notes          text,
  created_at     timestamptz default now()
);

-- Newest leads first by default; speeds up the table's default ordering.
create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
-- SECURITY TRADEOFF — READ THIS:
--
-- This is an internal, single-user / small-team tool. The policy below allows
-- ANY signed-in (authenticated) user full read/write on every row. There is no
-- per-user row ownership and no multi-tenant isolation. That is an intentional,
-- acceptable tradeoff for an internal back-office tool used by one trusted team
-- behind a login — it is NOT appropriate for a public-facing or multi-customer
-- product. If this ever becomes multi-tenant, add an `owner` / `org_id` column
-- and scope these policies with `auth.uid()`.
--
alter table public.leads enable row level security;

-- ----------------------------------------------------------------------------
-- OPTION B — Anon access (NO LOGIN). This is the ACTIVE DEFAULT.
--
-- The app as shipped has no login screen — it talks to Supabase with the anon
-- key directly. So the anon role needs full access, or every insert/update is
-- rejected with "new row violates row-level security policy for table leads".
--
-- WARNING: the anon key ships in the built JS, so treat it as public. Anyone
-- with the deployed URL + key can read/write every row. Fine for a private
-- internal tool with low-sensitivity data. For anything real, switch to
-- Option A below (authenticated-only) and add a Supabase Auth login.
-- ----------------------------------------------------------------------------

drop policy if exists "allow all for anon (internal tool)" on public.leads;
create policy "allow all for anon (internal tool)"
  on public.leads
  for all
  to anon
  using (true)
  with check (true);

-- ----------------------------------------------------------------------------
-- OPTION A — Authenticated-only (MORE SECURE; commented out).
-- Turn on Supabase Auth (e.g. email magic link), build a login into the app,
-- then enable this instead of Option B. The anon key alone gets nothing.
--   To switch: comment out Option B above, uncomment this, and drop the anon
--   policy: drop policy if exists "allow all for anon (internal tool)" on public.leads;
-- ----------------------------------------------------------------------------

-- drop policy if exists "allow all for authenticated users" on public.leads;
-- create policy "allow all for authenticated users"
--   on public.leads
--   for all
--   to authenticated
--   using (true)
--   with check (true);

-- ----------------------------------------------------------------------------
-- Realtime: let the app receive live INSERT/UPDATE/DELETE events so multiple
-- open tabs / teammates stay in sync. Safe to run; ignores if already added.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'leads'
  ) then
    alter publication supabase_realtime add table public.leads;
  end if;
end $$;
