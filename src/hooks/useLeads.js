import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchLeads,
  createLead as apiCreate,
  updateLead as apiUpdate,
  deleteLead as apiDelete,
  deleteLeads as apiDeleteMany,
  subscribeToLeads,
} from '../lib/leadsApi'
import { isSupabaseConfigured } from '../lib/supabaseClient'

// Single source of lead state for the whole app. Supabase is canonical; this
// hook keeps a local mirror and refetches on any realtime change so multiple
// tabs / teammates stay live. CRUD helpers also optimistically refetch.
export function useLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    try {
      const rows = await fetchLeads()
      if (mounted.current) {
        setLeads(rows)
        setError(null)
      }
    } catch (err) {
      if (mounted.current) setError(err.message || 'Failed to load leads.')
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    load()
    // Realtime: refetch whenever the leads table changes anywhere.
    const unsub = subscribeToLeads(() => load())
    return () => {
      mounted.current = false
      unsub()
    }
  }, [load])

  // --- CRUD wrappers. Each refetches so the realtime mirror and the local
  // mirror converge even if realtime is disabled in the project. ---

  const createLead = useCallback(
    async (lead) => {
      const row = await apiCreate(lead)
      await load()
      return row
    },
    [load]
  )

  const updateLead = useCallback(
    async (id, patch) => {
      // Optimistic update for snappy inline editing; reconciled by load().
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
      try {
        const row = await apiUpdate(id, patch)
        await load()
        return row
      } catch (err) {
        await load() // roll back optimistic change to server truth
        throw err
      }
    },
    [load]
  )

  const removeLead = useCallback(
    async (id) => {
      await apiDelete(id)
      await load()
    },
    [load]
  )

  const removeLeads = useCallback(
    async (ids) => {
      await apiDeleteMany(ids)
      await load()
    },
    [load]
  )

  return {
    leads,
    loading,
    error,
    configured: isSupabaseConfigured,
    refresh: load,
    createLead,
    updateLead,
    removeLead,
    removeLeads,
  }
}
