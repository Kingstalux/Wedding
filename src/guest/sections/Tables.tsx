import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { useInvitation } from '../InvitationProvider'
import { useGuestNames } from '../useGuestNames'
import styles from './Tables.module.css'

/**
 * "Your table": shown once the guest has accepted. A plan of every table
 * with theirs in gold. Only numbers: other guests' names are never shown.
 */
export function Tables() {
  const { t } = useT()
  const { content, invitation } = useInvitation()
  const { tc } = useGuestNames()
  const { show_tables, table_count } = content.settings
  if (!show_tables || !invitation.rsvp?.attending) return null

  const mine = invitation.table_no
  const numbers = Array.from({ length: table_count }, (_, i) => i + 1)

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
          <div className={styles.plan} role="img" aria-label={t('tables.yours', { n: mine })}>
            <p className={styles.planLabel} aria-hidden="true">
              {t('tables.plan')}
            </p>
            <ol className={styles.grid} aria-hidden="true">
              {numbers.map((n) => (
                <li key={n} className={n === mine ? styles.mine : undefined}>
                  <span className={styles.table}>{n}</span>
                  {n === mine && <span className={styles.you}>{t('tables.you')}</span>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  )
}
