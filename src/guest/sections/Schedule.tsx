import { Icon } from '../../components/Icon'
import { Eyebrow } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { dayKey, formatDayLong, formatTimeRange } from '../../lib/time'
import { useInvitation } from '../InvitationProvider'
import type { WeddingEvent } from '../types'
import styles from './Schedule.module.css'

type Numbered = WeddingEvent & { number: number }

/** Sorts by time, numbers each moment (01, 02…) and groups them by day in Douala. */
function byDay(events: WeddingEvent[]): Numbered[][] {
  const sorted = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const days = new Map<string, Numbered[]>()
  sorted.forEach((event, i) => {
    const key = dayKey(event.starts_at)
    days.set(key, [...(days.get(key) ?? []), { ...event, number: i + 1 }])
  })
  return [...days.values()]
}

export function Schedule() {
  const { t, lang, pick } = useT()
  const { content } = useInvitation()
  if (content.events.length === 0) return null

  const days = byDay(content.events)
  const count = content.events.length
  // "Two days · four moments": numbers as words up to ten, digits after.
  const words =
    lang === 'fr'
      ? ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix']
      : ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
  const word = (n: number) => words[n] ?? String(n)
  const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const eyebrow = [
    days.length === 1 ? t('sched.day') : capital(t('sched.days', { n: word(days.length) })),
    count === 1 ? t('sched.moment').toLowerCase() : t('sched.moments', { n: word(count) }),
  ].join(' · ')

  return (
    <section id="schedule" className={styles.schedule} aria-labelledby="schedule-title">
      <div className="container">
        <Eyebrow light>{eyebrow}</Eyebrow>
        <h2 id="schedule-title" className="display h2">
          {t('sched.title')}
        </h2>

        <div className={styles.days}>
          {days.map((events) => (
            <div key={events[0].id}>
              <h3 className={styles.dayTitle}>{formatDayLong(events[0].starts_at, lang)}</h3>
              <ol className={styles.timeline}>
                {events.map((event) => {
                  const title = pick(event.title_en, event.title_fr)
                  return (
                    <li key={event.id} className={styles.stop}>
                      <div className={styles.num} aria-hidden="true">
                        {String(event.number).padStart(2, '0')}
                      </div>
                      <div className={styles.track} aria-hidden="true" />
                      <h4 className={styles.title}>{title}</h4>
                      <p>{formatTimeRange(event.starts_at, event.ends_at, lang)}</p>
                      <p>{event.venue}</p>
                      {event.maps_url && (
                        <a
                          className={styles.link}
                          href={event.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${t('sched.directions')}: ${title}, ${event.venue}`}
                        >
                          {t('sched.directions')} <Icon name="arrowRight" size={12} />
                        </a>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          ))}
        </div>

        <div className={styles.foot}>
          <a className={styles.link} href="#dresscode">
            {t('sched.dressLink')} <Icon name="arrowRight" size={12} />
          </a>
        </div>
      </div>
    </section>
  )
}
