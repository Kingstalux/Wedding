import { Button, ButtonLink } from '../../components/Button'
import { QrCode } from '../../components/QrCode'
import { downloadQrPng, passUrl } from '../../lib/qr'
import { Eyebrow, Monogram, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { formatDaySpan, formatDayShort, formatTime } from '../../lib/time'
import { useInvitation } from '../InvitationProvider'
import styles from './PassPage.module.css'

/** Route: /i/:token/pass. The guest's entrance ticket with its QR code. */
export function PassPage() {
  const { t, lang, pick } = useT()
  const { token, content, invitation } = useInvitation()
  const { settings, events } = content
  const url = passUrl(invitation.pass_code)
  const back = `/i/${token}#rsvp`

  if (!invitation.rsvp?.attending) {
    return (
      <div className={styles.page}>
        <div className={styles.door}>
          <p className="serif-body">{t('pass.notAttending')}</p>
          <div className={styles.actions} style={{ justifyContent: 'center' }}>
            <ButtonLink to={back}>{t('pass.back')}</ButtonLink>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <main className={styles.wrap}>
        <article className={styles.ticket} aria-label={t('pass.ticket')}>
          <span className={`${styles.notch} ${styles.left}`} aria-hidden="true" />
          <span className={`${styles.notch} ${styles.right}`} aria-hidden="true" />
          <div className={styles.top}>
            <Monogram bride={settings.bride} groom={settings.groom} size={30} gold />
            <h1 className="display">{t('pass.ticket')}</h1>
            <Eyebrow light className={styles.topMeta}>
              {formatDaySpan(
                events.map((e) => e.starts_at),
                lang,
              )}{' '}
              · {settings.city.split(',')[0]}
            </Eyebrow>
          </div>
          <QrCode
            className={styles.qr}
            value={url}
            label={t('pass.qrAlt', { name: invitation.name })}
          />
          <div className={styles.bottom}>
            <p className={styles.name}>{invitation.name}</p>
            <p className={styles.code}>
              {invitation.pass_code} · {t('pass.seat')}
            </p>
            <ul className={styles.events}>
              {events.map((event) => (
                <li key={event.id}>
                  <span>{pick(event.title_en, event.title_fr)}</span>
                  <span>
                    {formatDayShort(event.starts_at, lang)} · {formatTime(event.starts_at, lang)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <div>
          <Eyebrow>{t('pass.eyebrow')}</Eyebrow>
          <h2 className="display h2">{t('pass.title')}</h2>
          <Rule />
          <p className="serif-body">{t('pass.body')}</p>
          <div className={styles.actions}>
            <Button onClick={() => downloadQrPng(url, `pass-${invitation.pass_code}.png`)}>
              {t('pass.download')}
            </Button>
            <ButtonLink to={back} variant="ghost">
              {t('pass.back')}
            </ButtonLink>
          </div>
        </div>
      </main>
    </div>
  )
}
