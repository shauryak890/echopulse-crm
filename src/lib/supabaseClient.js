import { createClient } from '@supabase/supabase-js'

// Credentials come from env vars at build time (Vite inlines VITE_* values).
// Never hardcode these — see .env.example.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// `isConfigured` lets the UI degrade gracefully (show a setup banner) instead
// of throwing on load when .env hasn't been filled in yet. This is what keeps
// the app from spewing console errors on a fresh checkout.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Only construct a real client when we have credentials. createClient() with
// empty strings would otherwise throw at import time and white-screen the app.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
