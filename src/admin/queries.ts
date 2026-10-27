import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/*
 * Studio data. The couple reads tables directly: RLS lets these requests
 * through because is_admin() is true for their account.
 *
 * Every query key starts with 'admin', so signing out can clear all of it.
 */

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
