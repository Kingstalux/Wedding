import { supabase } from '../lib/supabase'

/*
 * Door check-in helpers, shared by the studio's Door page and the
 * /pass/:code page that opens when a pass is scanned with a phone camera.
 */

export type CheckInStatus = 'ok' | 'already' | 'declined' | 'not_found'
export type CheckInResult = {
  status: CheckInStatus
  name?: string
  checked_in_at?: string
  replied?: boolean
}

type EventTimes = { id: string; starts_at: string; ends_at: string | null }

/**
 * The pass code inside whatever the camera read: the full pass address
 * (https://…/pass/K7Q2M9) or just the code. Returns null for anything else.
 */
export function codeFromScan(text: string): string | null {
  const trimmed = text.trim()
  const fromUrl = trimmed.match(/\/pass\/([A-Za-z0-9-]{4,20})\/?(?:[?#].*)?$/)
  const code = fromUrl ? fromUrl[1] : trimmed
  return /^[A-Za-z0-9-]{4,20}$/.test(code) ? code.toUpperCase() : null
}

/**
 * The event the door is probably checking people into: one that's on now
 * (from 3 hours before it starts until it ends, or 4 hours after the start),
 * otherwise the next one coming, otherwise the last one.
 */
export function pickCurrentEvent<T extends EventTimes>(events: T[], now = new Date()): T | null {
  if (events.length === 0) return null
  const sorted = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const t = now.getTime()
  const HOUR = 60 * 60 * 1000
  const onNow = sorted.find((e) => {
    const start = new Date(e.starts_at).getTime()
    const end = e.ends_at ? new Date(e.ends_at).getTime() : start + 4 * HOUR
    return t >= start - 3 * HOUR && t <= end
  })
  return onNow ?? sorted.find((e) => new Date(e.starts_at).getTime() > t) ?? sorted.at(-1)!
}

export async function checkIn(code: string, eventId: string): Promise<CheckInResult> {
  const { data, error } = await supabase.rpc('check_in', { p_code: code, p_event_id: eventId })
  if (error) throw error
  return data as unknown as CheckInResult
}
