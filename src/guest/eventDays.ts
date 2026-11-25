import { dayKey } from '../lib/time'
import type { RsvpDays, WeddingEvent } from './types'

/** One wedding day: its date (any event time that day) and its events. */
export type WeddingDay = { iso: string; events: WeddingEvent[] }

/**
 * The first and the last wedding day from the schedule, for the "which days"
 * question on the reply. Null when everything happens on a single day.
 */
export function weddingDays(
  events: WeddingEvent[],
): { first: WeddingDay; second: WeddingDay } | null {
  const byDay = new Map<string, WeddingEvent[]>()
  for (const event of [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
    const key = dayKey(event.starts_at)
    byDay.set(key, [...(byDay.get(key) ?? []), event])
  }
  const days = [...byDay.values()]
  if (days.length < 2) return null
  const first = days[0]
  const last = days[days.length - 1]
  return {
    first: { iso: first[0].starts_at, events: first },
    second: { iso: last[0].starts_at, events: last },
  }
}

/** The one day a guest is coming, or null when it's both days (or unknown). */
export function onlyDay(
  days: ReturnType<typeof weddingDays>,
  choice: RsvpDays | undefined,
): WeddingDay | null {
  if (!days || !choice || choice === 'both') return null
  return days[choice]
}
