import { weddingDays } from '../guest/eventDays'
import { TIME_ZONE } from '../lib/time'
import { useEvents } from './queries'

/*
 * The two wedding days as short labels ("23 Dec", "26 Dec"), from the
 * programme, for the guests who come on one day only.
 */

const short = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))

export type DayLabels = { first: string; second: string }

export function useDayLabels(): DayLabels {
  const days = weddingDays(useEvents().data ?? [])
  return days
    ? { first: short(days.first.iso), second: short(days.second.iso) }
    : { first: 'First day', second: 'Last day' }
}
