import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '../lib/database.types'
import { supabase } from '../lib/supabase'

/*
 * Studio data. The couple reads and writes tables directly: RLS lets these
 * requests through because is_admin() is true for their account.
 *
 * Every query key starts with 'admin', so signing out can clear all of it.
 */

export type SettingsRow = Database['public']['Tables']['settings']['Row']
export type SettingsPatch = Database['public']['Tables']['settings']['Update']

export const settingsKey = ['admin', 'settings'] as const

/** The single settings row (names, texts, switches…). */
export function useSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*').single()
      if (error) throw error
      return data
    },
  })
}

/** Saves some settings columns and puts the saved row in the cache. */
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: SettingsPatch) => {
      const { data, error } = await supabase
        .from('settings')
        .update(patch)
        .eq('id', true)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (row) => queryClient.setQueryData(settingsKey, row),
  })
}

/** Turns a Supabase/Postgres error into a sentence for the couple. */
export function studioErrorMessage(err: unknown): string {
  const message =
    err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err)
  if (/failed to fetch|network/i.test(message))
    return 'No connection. Check your internet and try again.'
  if (/maps_url/.test(message)) return 'The Google Maps link must start with https://'
  if (/ends_at|events_check/.test(message)) return 'The end time must be after the start time.'
  if (/JWT|not_authorized|permission denied/i.test(message))
    return 'Your session has expired. Please sign in again.'
  return message
}

/** A guest link the couple can use to preview the site (visits aren't counted). */
export function usePreviewLink() {
  return useQuery({
    queryKey: ['admin', 'preview-token'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('token')
        .is('deleted_at', null)
        .order('created_at')
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data ? `/i/${encodeURIComponent(data.token)}?preview=1` : null
    },
  })
}

export const eventsKey = ['admin', 'events'] as const

/** All moments of the programme, in time order (shared by Programme and Door). */
export function useEvents() {
  return useQuery({
    queryKey: eventsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('starts_at')
        .order('sort')
      if (error) throw error
      return data
    },
  })
}
