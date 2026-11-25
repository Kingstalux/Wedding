import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { cx } from '../../lib/cx'
import { shortNames } from '../../lib/guestNames'
import { useInvitation } from '../InvitationProvider'
import { Garland, Wreath } from '../Laurel'
import { useGuestNames } from '../useGuestNames'
import styles from './Tables.module.css'

/**
 * "Your table": shown once the guest has accepted. Their table as a place
 * card (like the printed table cards: laurels, TABLE, the number, their
 * names), then a plan of every table with theirs in gold. Only numbers:
 * other guests' names are never shown.
 */
export function Tables() {
  const { t } = useT()
  const { content, invitation } = useInvitation()
  const { tc, greeting } = useGuestNames()
  const { show_tables, table_count } = content.settings
  // Tables are for the reception: guests coming on the first day only have none.
  if (!show_tables || !invitation.rsvp?.attending || invitation.rsvp.days === 'first') return null

  const mine = invitation.table_no
  const numbers = Array.from({ length: table_count }, (_, i) => i + 1)
  // Place-card names: "Kingsley & Vanessa", or "Ama".
  const names = shortNames(invitation.name, invitation.partner_name, '&')

  return (
    <section
      id="tables"
      data-reveal=""
      className={`on-dark ${styles.tables}`}
      aria-labelledby="tables-title"
    >
      <div className="container">
        <Eyebrow>{t('tables.eyebrow')}</Eyebrow>
        <h2 id="tables-title" className="display h2">
          {t('tables.title')}
        </h2>
        <Rule center />
        <p className={`serif-body ${styles.lede}`}>
          {mine ? tc('tables.seated', { n: mine }) : t('tables.pending')}
        </p>

        {mine && (
          <>
            <div
              className={styles.card}
              role="img"
              aria-label={t('tables.cardLabel', { n: mine, names: greeting })}
            >
              <Garland className={styles.garland} />
              <p className={styles.cardLabel}>{t('tables.card')}</p>
              <p className={styles.cardNumber}>{mine}</p>
              <p className={styles.cardNames}>{names}</p>
              <Garland className={styles.garland} flip />
            </div>

            <div className={styles.plan} role="img" aria-label={t('tables.yours', { n: mine })}>
              <p className={styles.planLabel} aria-hidden="true">
                {t('tables.plan')}
              </p>
              <ol className={styles.grid} aria-hidden="true">
                {numbers.map((n) => (
                  <li key={n} className={cx(n === mine && styles.mine)}>
                    {n === mine && <Wreath className={styles.wreath} />}
                    <span className={styles.table}>{n}</span>
                    {n === mine && <span className={styles.you}>{t('tables.you')}</span>}
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
