import { supabase, isSupabaseConfigured } from './supabaseClient'

// All lead CRUD goes through here so the rest of the app never touches Supabase
// directly. Supabase is the source of truth; components mirror it in state and
// keep in sync via the realtime subscription (see useLeads).

const TABLE = 'leads'

// Whitelist of columns we're allowed to write. Guards against accidentally
// pushing UI-only fields (like a screenshot thumbnail) into the DB.
const WRITABLE_COLUMNS = [
  'full_name',
  'linkedin_url',
  'icp_segment',
  'title',
  'company',
  'location',
  'date_sent',
  'status',
  'date_connected',
  'note_sent',
  'replied',
  'next_step',
  'notes',
]

function pickWritable(input) {
  const out = {}
  for (const key of WRITABLE_COLUMNS) {
    if (key in input) {
      // Normalize empty strings on date columns to null so Postgres `date`
      // doesn't choke on "".
      const value = input[key]
      if ((key === 'date_sent' || key === 'date_connected') && value === '') {
        out[key] = null
      } else {
        out[key] = value
      }
    }
  }
  return out
}

function ensureConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase isn’t connected yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env, then restart the dev server.'
    )
  }
}

export async function fetchLeads() {
  ensureConfigured()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createLead(lead) {
  ensureConfigured()
  const payload = pickWritable(lead)
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLead(id, patch) {
  ensureConfigured()
  const payload = pickWritable(patch)
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLead(id) {
  ensureConfigured()
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function deleteLeads(ids) {
  ensureConfigured()
  if (!ids.length) return
  const { error } = await supabase.from(TABLE).delete().in('id', ids)
  if (error) throw error
}

// Subscribe to realtime row changes. Returns an unsubscribe function.
// `onChange` is called with no args; the caller refetches (simplest correct
// approach — avoids reconciling individual INSERT/UPDATE/DELETE payloads).
export function subscribeToLeads(onChange) {
  if (!isSupabaseConfigured || !supabase) return () => {}
  const channel = supabase
    .channel('public:leads')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
      onChange()
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
