/*
 * Date and time helpers. Every date is shown in Cameroon time (Africa/Douala,
 * UTC+1), whatever time zone the guest's phone is set to.
 */
export type Lang = 'en' | 'fr'

export const TIME_ZONE = 'Africa/Douala'

const locale = (lang: Lang) => (lang === 'fr' ? 'fr-FR' : 'en-GB')

function parts(iso: string | Date, lang: Lang, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale(lang), { timeZone: TIME_ZONE, ...options }).format(
    new Date(iso),
  )
}

/** "2026-12-23": the calendar day in Douala. Used to group events by day. */
export function dayKey(iso: string): string {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

/** "Wednesday, 23 December" · "mercredi 23 décembre" */
export function formatDayLong(iso: string, lang: Lang): string {
  return parts(iso, lang, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** "Wed 23" · "mer. 23" */
export function formatDayShort(iso: string, lang: Lang): string {
  return parts(iso, lang, { weekday: 'short', day: 'numeric' })
}

/** "11:00 AM" · "11:00" */
export function formatTime(iso: string, lang: Lang): string {
  return lang === 'fr'
    ? parts(iso, lang, { hour: '2-digit', minute: '2-digit', hour12: false })
    : parts(iso, 'en', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()
}

/** "4:00 PM – 8:00 PM" · "16:00 – 20:00" · or a single time when there is no end. */
export function formatTimeRange(start: string, end: string | null | undefined, lang: Lang): string {
  return end ? `${formatTime(start, lang)} – ${formatTime(end, lang)}` : formatTime(start, lang)
}

/** "10 December 2026" · "10 décembre 2026" (for a plain YYYY-MM-DD date). */
export function formatDate(date: string, lang: Lang): string {
  // Noon avoids the date shifting across midnight in any time zone.
  return parts(`${date}T12:00:00Z`, lang, { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * The wedding days as one line: "23 & 26 December 2026".
 * Falls back to the full dates when they span different months.
 */
export function formatDaySpan(isoDates: string[], lang: Lang): string {
  const days = [...new Set(isoDates.map(dayKey))].sort()
  if (days.length === 0) return ''
  const month = (d: string) => d.slice(0, 7)
  if (days.length === 1 || days.some((d) => month(d) !== month(days[0]))) {
    return days.map((d) => formatDate(d, lang)).join(' & ')
  }
  const dayNumbers = days.map((d) => String(Number(d.slice(8, 10)))).join(' & ')
  const monthYear = parts(`${days[0]}T12:00:00Z`, lang, { month: 'long', year: 'numeric' })
  return `${dayNumbers} ${monthYear}`
}

export type Countdown = {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

/** Time left until `target`; all zero (and done) once it has passed. */
export function countdown(target: string | Date, now: Date = new Date()): Countdown {
  let s = Math.max(0, Math.floor((new Date(target).getTime() - now.getTime()) / 1000))
  const days = Math.floor(s / 86400)
  s -= days * 86400
  const hours = Math.floor(s / 3600)
  s -= hours * 3600
  const minutes = Math.floor(s / 60)
  return { days, hours, minutes, seconds: s - minutes * 60, done: days + hours + minutes + s === 0 }
}

/*
 * Studio form fields. <input type="datetime-local"> has no time zone, so the
 * studio always reads and writes it as Douala time (UTC+1, no summer time),
 * whatever time zone the couple's laptop is set to.
 */
const DOUALA_OFFSET = '+01:00'

/** "2026-12-23T10:00:00Z" → "2026-12-23T11:00" for a datetime-local input. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const shifted = new Date(new Date(iso).getTime() + 60 * 60 * 1000) // UTC → UTC+1
  return shifted.toISOString().slice(0, 16)
}

/** "2026-12-23T11:00" (typed in Douala time) → "2026-12-23T11:00:00+01:00", or null if empty. */
export function fromLocalInput(value: string): string | null {
  return value ? `${value}:00${DOUALA_OFFSET}` : null
}

/** Splits an ISO time into Douala date ("2026-12-23") and time ("11:00") inputs. */
export function splitLocal(iso: string | null | undefined): { date: string; time: string } {
  const local = toLocalInput(iso)
  return { date: local.slice(0, 10), time: local.slice(11, 16) }
}

/** Joins date + time inputs (Douala) back into an ISO string, or null if incomplete. */
export function joinLocal(date: string, time: string): string | null {
  return date && time ? `${date}T${time}:00${DOUALA_OFFSET}` : null
}

/** "12 Oct, 19:02" in Douala time: for the studio's tables. */
export function formatShortDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  return parts(iso, 'en', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
