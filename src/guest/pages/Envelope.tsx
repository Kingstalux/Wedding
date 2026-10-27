import { Button } from '../../components/Button'
import { Eyebrow, Monogram, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { formatDaySpan } from '../../lib/time'
import { useInvitation } from '../InvitationProvider'
import styles from './Envelope.module.css'

/** The opening screen. Its button is the tap that lets the music start. */
export function Envelope({ onOpen, hasMusic }: { onOpen: () => void; hasMusic: boolean }) {
  const { t, lang, setLang } = useT()
  const { content, invitation } = useInvitation()
  const { settings, events } = content

  return (
    <div className={styles.page}>
      <div className={styles.lang} role="group" aria-label={t('lang.label')}>
        {(['en', 'fr'] as const).map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={lang === code}
            onClick={() => setLang(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>

      <main className={styles.card}>
        <Monogram bride={settings.bride} groom={settings.groom} size={44} gold />
        <p className={styles.dear}>{t('envelope.dear', { name: invitation.name })}</p>
        <Eyebrow light>{t('envelope.invited')}</Eyebrow>
        <h1 className={`display ${styles.names}`}>
          {settings.bride} <em>{t('hero.and')}</em> {settings.groom}
        </h1>
        <Rule center />
        <p className={styles.meta}>
          {formatDaySpan(
            events.map((e) => e.starts_at),
            lang,
          )}
          <br />
          {settings.city}
        </p>
        <div className={styles.open}>
          <Button variant="gold" onClick={onOpen} autoFocus>
            {t('envelope.open')}
          </Button>
        </div>
        {hasMusic && settings.music_title && (
          <p className={styles.hint}>♪ {t('music.willPlay', { title: settings.music_title })}</p>
        )}
      </main>
    </div>
  )
}
