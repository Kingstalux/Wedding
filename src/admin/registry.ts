import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '../lib/database.types'
import { supabase } from '../lib/supabase'
import { removeMedia } from '../lib/upload'

/*
 * The gift list for the studio: the gifts the couple would love, and who
 * reserved each one (guests only see that a gift is taken, never by whom).
 */

type GiftRow = Database['public']['Tables']['registry_gifts']['Row']
export type GiftInput = Pick<
  GiftRow,
  'title_en' | 'title_fr' | 'description_en' | 'description_fr' | 'category_en' | 'category_fr'
>

export type RegistryGift = GiftRow & {
  gift_reservations: {
    created_at: string
    guests: { name: string; partner_name: string | null } | null
  } | null
}

export const registryKey = ['admin', 'registry'] as const

export function useRegistry() {
  return useQuery({
    queryKey: registryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registry_gifts')
        .select('*, gift_reservations(created_at, guests(name, partner_name))')
        .order('sort')
        .order('created_at')
      if (error) throw error
      return data as unknown as RegistryGift[]
    },
  })
}

const check = <R extends { error: unknown }>(result: R) => {
  if (result.error) throw result.error
  return result
}

function useRegistryChange<T, R = unknown>(run: (input: T) => Promise<R>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: registryKey }),
  })
}

/** Add a gift (at the end of the list) or change one. Returns the saved row. */
export function useSaveGift() {
  return useRegistryChange(
    async ({ id, sort, ...input }: GiftInput & { id?: string; sort?: number }) => {
      const query = id
        ? supabase.from('registry_gifts').update(input).eq('id', id)
        : supabase.from('registry_gifts').insert({ ...input, sort: sort ?? 0 })
      const { data } = check(await query.select().single())
      return data as GiftRow
    },
  )
}

export function useSetGiftPhoto() {
  return useRegistryChange(async ({ id, path }: { id: string; path: string | null }) =>
    check(await supabase.from('registry_gifts').update({ photo_path: path }).eq('id', id)),
  )
}

/** Deletes the gift, its reservation, and its photo. */
export function useDeleteGift() {
  return useRegistryChange(async (gift: RegistryGift) => {
    check(await supabase.from('registry_gifts').delete().eq('id', gift.id))
    await removeMedia(gift.photo_path)
  })
}

/** Makes a reserved gift available again. */
export function useFreeGift() {
  return useRegistryChange(async (giftId: string) =>
    check(await supabase.from('gift_reservations').delete().eq('gift_id', giftId)),
  )
}

/** Swaps two gifts' places in the list. */
export function useSwapGifts() {
  return useRegistryChange(async ([a, b]: [RegistryGift, RegistryGift]) => {
    // Equal sort numbers (e.g. both 0) would swap to the same; use positions instead.
    const [sa, sb] = a.sort === b.sort ? [a.sort, a.sort + 1] : [a.sort, b.sort]
    check(await supabase.from('registry_gifts').update({ sort: sb }).eq('id', a.id))
    check(await supabase.from('registry_gifts').update({ sort: sa }).eq('id', b.id))
  })
}
