import { useParams } from 'react-router'
import { Icon } from '../../components/Icon'
import { Eyebrow } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { cx } from '../../lib/cx'
import { sampleInvitation } from '../sample'
import styles from './PassPage.module.css'

/*
 * Route: /pass/:code. What opens when someone scans a pass's QR code.
 * It shows only the guest's first name and status, never private details.
 *
 * STEP 3: checks against the sample pass code.
 * STEP 8: calls read_pass(code) in the database; signed-in couple
 *         accounts also get a "Check in" button.
 */
export function DoorPassPage() {
  const { t } = useT()
  const { code = '' } = useParams()
  const found = code.toUpperCase() === sampleInvitation.pass_code
  const attending = true

  return (
    <div className={styles.page}>
      <main className={styles.door}>
        <Eyebrow>{t('door.eyebrow')}</Eyebrow>
        {found ? (
          <>
            <span className={cx(styles.status, attending ? styles.ok : styles.no)}>
              {attending && <Icon name="check" />}
              {attending ? t('door.confirmed') : t('door.notAttending')}
            </span>
            <p className={styles.doorName}>{sampleInvitation.first_name}</p>
            <p className="muted">
              {code.toUpperCase()} · {t('pass.seat')}
            </p>
          </>
        ) : (
          <>
            <span className={cx(styles.status, styles.unknown)}>{t('door.notFound')}</span>
            <p className="muted" style={{ marginTop: 16 }}>
              {code}
            </p>
          </>
        )}
      </main>
    </div>
  )
}
