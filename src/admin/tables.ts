import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '../lib/database.types'
import { supabase } from '../lib/supabase'
import { reservationsKey, useGuestChange, type GuestRow } from './guests'

/*
 * Seating for the studio: tables, who sits where, and reserved seats.
 * The database enforces the rules (no table over its seats); these helpers
 * only work out what to show and which tables to offer.
 */

export type Reservation = Database['public']['Tables']['reservations']['Row']
export type ReservationInput = Pick<Reservation, 'label' | 'seats' | 'table_no' | 'note'>

export type TableInfo = {
  number: number
  guests: GuestRow[]
  reservations: Reservation[]
  used: number
  free: number
}

/** Seats an invitation takes (the view already says; 1 if unknown). */
const seatsOf = (g: GuestRow) => g.seats ?? 1

/** Every table from 1 to `count`, with who is at it and how many seats are left. */
export function buildTables(
  count: number,
  capacity: number,
  guests: GuestRow[],
  reservations: Reservation[],
): TableInfo[] {
  return Array.from({ length: count }, (_, i) => {
    const number = i + 1
    const seated = guests.filter((g) => !g.deleted_at && g.table_no === number)
    const reserved = reservations.filter((r) => r.table_no === number)
    const used =
      seated.reduce((sum, g) => sum + seatsOf(g), 0) + reserved.reduce((sum, r) => sum + r.seats, 0)
    return { number, guests: seated, reservations: reserved, used, free: capacity - used }
  })
}

/**
 * Tables that can take `seats` more people. `current` (the table someone is
 * already at) is left out, since moving there changes nothing.
 */
export function tablesWithRoom(tables: TableInfo[], seats: number, current?: number | null) {
  return tables.filter((t) => t.number !== current && t.free >= seats)
}

/** Accepted guests who have no table yet. */
export function waitingGuests(guests: GuestRow[]) {
  return guests.filter((g) => !g.deleted_at && g.attending === true && !g.table_no)
}

export function seatsLabel(n: number) {
  return n === 1 ? '1 seat' : `${n} seats`
}

export function useReservations() {
  return useQuery({
    queryKey: reservationsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('table_no')
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

const check = <R extends { error: unknown }>(result: R) => {
  if (result.error) throw result.error
  return result
}

/** Place a guest at a table by hand, or back on the waiting list (table = null). */
export function useMoveGuest() {
  return useGuestChange(async ({ id, table }: { id: string; table: number | null }) =>
    check(await supabase.rpc('move_guest', { p_guest_id: id, p_table: table as number })),
  )
}

export function useSeatWaiting() {
  return useGuestChange(async () => {
    const { data, error } = await supabase.rpc('seat_waiting')
    if (error) throw error
    return data as number
  })
}

function useReservationChange<T>(run: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reservationsKey }),
  })
}

export function useSaveReservation() {
  return useReservationChange(async ({ id, ...input }: ReservationInput & { id?: string }) =>
    check(
      id
        ? await supabase.from('reservations').update(input).eq('id', id)
        : await supabase.from('reservations').insert(input),
    ),
  )
}

export function useDeleteReservation() {
  return useReservationChange(async (id: string) =>
    check(await supabase.from('reservations').delete().eq('id', id)),
  )
}
