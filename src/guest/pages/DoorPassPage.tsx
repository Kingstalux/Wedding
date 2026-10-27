import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { Icon } from '../../components/Icon'
import { Eyebrow } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { cx } from '../../lib/cx'
import { errorMessageKey, readPass } from '../api'
import styles from './PassPage.module.css'

/*
 * Route: /pass/:code. What opens when someone scans a pass's QR code with a
 * phone camera. Shows only the guest's first name and status (read_pass),
 * never private details.
 *
 * Step 14 adds a "Check in" button here for the signed-in couple; the
 * studio's Door page does the same with a built-in scanner.
 */
export function DoorPassPage() {
  const { t } = useT()
  const { code = '' } = useParams()
  const pass = useQuery({ queryKey: ['pass', code], queryFn: () => readPass(code) })

  return (
    <div className={styles.page}>
      <main className={styles.door} aria-live="polite">
        <Eyebrow>{t('door.eyebrow')}</Eyebrow>

        {pass.isPending && <p className="muted">{t('door.checking')}</p>}

        {pass.isError && (
          <p className="serif-body" role="alert">
            {t(errorMessageKey(pass.error))}
          </p>
        )}

        {pass.isSuccess && !pass.data && (
          <>
            <span className={cx(styles.status, styles.unknown)}>{t('door.notFound')}</span>
            <p className="muted" style={{ marginTop: 16 }}>
              {code}
            </p>
          </>
        )}

        {pass.data && (
          <>
            <span
              className={cx(styles.status, pass.data.attending === false ? styles.no : styles.ok)}
            >
              {pass.data.attending !== false && <Icon name="check" />}
              {pass.data.attending === false
                ? t('door.notAttending')
                : pass.data.attending
                  ? t('door.confirmed')
                  : t('door.noReply')}
            </span>
            <p className={styles.doorName}>{pass.data.first_name}</p>
            <p className="muted">
              {code.toUpperCase()} · {t('pass.seat')}
              {pass.data.checked_in && ` · ${t('door.checkedIn')}`}
            </p>
          </>
        )}
      </main>
    </div>
  )
}
