import { describe, expect, it } from 'vitest'
import type { GuestRow } from './guests'
import { buildTables, seatsLabel, tablesWithRoom, waitingGuests, type Reservation } from './tables'

const guest = (over: Partial<GuestRow>) => ({ seats: 1, deleted_at: null, ...over }) as GuestRow
const reservation = (table_no: number, seats: number) => ({ table_no, seats }) as Reservation

describe('seating helpers', () => {
  const guests = [
    guest({ id: 'a', table_no: 1, attending: true }),
    guest({ id: 'b', table_no: 1, attending: true, seats: 2, partner_name: 'V' }),
    guest({ id: 'c', table_no: 2, attending: true, deleted_at: '2026-01-01' }), // removed
    guest({ id: 'd', table_no: null, attending: true }),
    guest({ id: 'e', table_no: null, attending: null }),
  ]
  const tables = buildTables(3, 4, guests, [reservation(2, 3)])

  it('counts couples as two and adds reservations', () => {
    expect(tables.map((t) => [t.number, t.used, t.free])).toEqual([
      [1, 3, 1],
      [2, 3, 1],
      [3, 0, 4],
    ])
  })

  it('offers only tables with room for the whole party', () => {
    expect(tablesWithRoom(tables, 1).map((t) => t.number)).toEqual([1, 2, 3])
    expect(tablesWithRoom(tables, 2).map((t) => t.number)).toEqual([3])
    expect(tablesWithRoom(tables, 1, 1).map((t) => t.number)).toEqual([2, 3])
  })

  it('lists accepted guests without a table', () => {
    expect(waitingGuests(guests).map((g) => g.id)).toEqual(['d'])
  })

  it('writes seat counts', () => {
    expect(seatsLabel(1)).toBe('1 seat')
    expect(seatsLabel(6)).toBe('6 seats')
  })
})
