import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '../lib/database.types'
import { supabase } from '../lib/supabase'
import type { ImportRow } from './guestImport'

/*
 * Guest-list data for the studio: the guest_list view (guests + reply +
 * last check-in), the overview figures, and every change the couple makes.
 * After any change, both are refreshed.
 */

export type GuestRow = Database['public']['Views']['guest_list']['Row']

export type Stats = {
  invited: number
  sent: number
  opened: number
  attending: number
  declined: number
  pending: number
  checked_in: number
  wishes: number
  gifts: number
}

export type ImportSummary = {
  added: Array<{ name: string; phone: string | null }>
  changed: Array<{
    id: string
    name: string
    old_name: string
    phone: string | null
    old_phone: string | null
  }>
  missing: Array<{ id: string; name: string; phone: string | null }>
  unchanged: number
}

const guestsKey = ['admin', 'guests'] as const
const statsKey = ['admin', 'stats'] as const

export function useGuests() {
  return useQuery({
    queryKey: guestsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_list')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useStats() {
  return useQuery({
    queryKey: statsKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('dashboard_stats')
      if (error) throw error
      return data as unknown as Stats
    },
  })
}

/** Wraps a change so the list and the figures refresh afterwards. */
function useGuestChange<T>(run: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestsKey })
      queryClient.invalidateQueries({ queryKey: statsKey })
      queryClient.invalidateQueries({ queryKey: ['admin', 'preview-token'] })
    },
  })
}

const check = <R extends { error: unknown }>(result: R) => {
  if (result.error) throw result.error
  return result
}

export type GuestInput = { name: string; phone: string | null; lang: 'en' | 'fr' | null }

export function useAddGuest() {
  return useGuestChange(async (guest: GuestInput) =>
    check(await supabase.from('guests').insert(guest)),
  )
}

export function useUpdateGuest() {
  return useGuestChange(async ({ id, ...guest }: GuestInput & { id: string }) =>
    check(await supabase.from('guests').update(guest).eq('id', id)),
  )
}

/** "Remove" hides the guest (and their reply); restorable for 60 days. */
export function useRemoveGuest() {
  return useGuestChange(async (id: string) =>
    check(
      await supabase.from('guests').update({ deleted_at: new Date().toISOString() }).eq('id', id),
    ),
  )
}

export function useRestoreGuest() {
  return useGuestChange(async (id: string) =>
    check(await supabase.rpc('restore_guest', { p_guest_id: id })),
  )
}

export function useMarkSent() {
  return useGuestChange(async (id: string) =>
    check(await supabase.rpc('mark_invite_sent', { p_guest_id: id })),
  )
}

export function useNewLink() {
  return useGuestChange(async (id: string) =>
    check(await supabase.rpc('regenerate_token', { p_guest_id: id })),
  )
}

/** Preview (apply = false) or save (apply = true) an uploaded list. */
export async function importGuests(
  rows: ImportRow[],
  apply: boolean,
  removeMissing = false,
): Promise<ImportSummary> {
  const { data, error } = await supabase.rpc('import_guests', {
    p_rows: rows,
    p_apply: apply,
    p_remove_missing: removeMissing,
  })
  if (error) throw error
  return data as unknown as ImportSummary
}

export function useApplyImport() {
  return useGuestChange(
    async ({ rows, removeMissing }: { rows: ImportRow[]; removeMissing: boolean }) =>
      importGuests(rows, true, removeMissing),
  )
}
