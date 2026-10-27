import { useEffect, useState } from 'react'
import { Eyebrow } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import type { MessageKey } from '../../i18n/en'
import { countdown } from '../../lib/time'
import { useInvitation } from '../InvitationProvider'
import styles from './Countdown.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

export function Countdown() {
  const { t } = useT()
  const target = useInvitation().content.settings.countdown_at
  const [left, setLeft] = useState(() => countdown(target))

  // Tick every second; stop the timer when the section unmounts.
  useEffect(() => {
    const id = setInterval(() => setLeft(countdown(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  const units: Array<[number, MessageKey]> = [
    [left.days, 'count.days'],
    [left.hours, 'count.hours'],
    [left.minutes, 'count.minutes'],
    [left.seconds, 'count.seconds'],
  ]

  return (
    <section id="countdown" className={styles.countdown} aria-label={t('count.label')}>
      <Eyebrow>{t('count.eyebrow')}</Eyebrow>
      {left.done ? (
        <p className={`display ${styles.done}`}>{t('count.done')}</p>
      ) : (
        // aria-hidden + a static summary: a screen reader shouldn't announce every second.
        <>
          <div className={styles.grid} aria-hidden="true">
            {units.map(([value, key], i) => (
              <div key={key} className={styles.unit}>
                <strong className={styles.number}>{i === 0 ? value : pad(value)}</strong>
                <span className={styles.label}>{t(key)}</span>
              </div>
            ))}
          </div>
          <p className="sr-only">
            {left.days} {t('count.days')}, {left.hours} {t('count.hours')}
          </p>
        </>
      )}
    </section>
  )
}
