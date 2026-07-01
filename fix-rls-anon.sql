-- ============================================================================
-- FIX: "new row violates row-level security policy for table leads"
-- ============================================================================
-- Cause: the app talks to Supabase with the ANON key and no login screen, but
-- the table's policy only allowed AUTHENTICATED users. This switches the leads
-- table to allow the anon role full access — the right setup for this no-login
-- internal tool.
--
-- Run this whole file in Supabase > SQL Editor > New query > Run.
--
-- SECURITY NOTE: the anon key ships in the built JavaScript, so treat it as
-- public. Anyone with the deployed URL + key can read/write leads. Fine for a
-- private internal tool with low-sensitivity data; if that's not you, build a
-- Supabase Auth login and use the authenticated policy instead.
-- ============================================================================

alter table public.leads enable row level security;

-- Remove the authenticated-only policy if it's there.
drop policy if exists "allow all for authenticated users" on public.leads;

-- (Re)create the anon policy.
drop policy if exists "allow all for anon (internal tool)" on public.leads;
create policy "allow all for anon (internal tool)"
  on public.leads
  for all
  to anon
  using (true)
  with check (true);
