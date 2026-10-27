import { Monogram, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { formatDaySpan } from '../../lib/time'
import { useInvitation } from '../InvitationProvider'
import styles from './Footer.module.css'

export function Footer() {
  const { t, lang } = useT()
  const { settings, events } = useInvitation().content
  const city = settings.city.split(',')[0]

  return (
    <footer className={styles.footer}>
      <a className={styles.monogram} href="#top" aria-label={t('nav.top')}>
        <Monogram bride={settings.bride} groom={settings.groom} size={40} gold />
      </a>
      <Rule center />
      <p className={styles.line}>
        {settings.bride} &amp; {settings.groom} ·{' '}
        {formatDaySpan(
          events.map((e) => e.starts_at),
          lang,
        )}{' '}
        · {city}
      </p>
    </footer>
  )
}
