import { Icon } from '../../components/Icon'
import { Photo } from '../../components/Photo'
import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { cx } from '../../lib/cx'
import { formatDaySpan } from '../../lib/time'
import { useInvitation } from '../InvitationProvider'
import styles from './Hero.module.css'

export function Hero() {
  const { t, lang } = useT()
  const { settings, events } = useInvitation().content
  const dates = formatDaySpan(
    events.map((e) => e.starts_at),
    lang,
  )

  return (
    <section
      className={cx(styles.hero, settings.hero_text_side === 'right' && styles.right)}
      aria-labelledby="hero-names"
    >
      <Photo
        className={styles.photo}
        src={settings.hero_url ?? settings.hero_mobile_url}
        portraitSrc={settings.hero_mobile_url}
        label={t('hero.photo')}
        tone="slate"
        loading="eager"
      />
      <div className={styles.inner}>
        <Eyebrow light>{t('hero.eyebrow')}</Eyebrow>
        <h1 id="hero-names" className={`display ${styles.names}`}>
          {settings.bride} <em>{t('hero.and')}</em> {settings.groom}
        </h1>
        <Rule />
        <p className={styles.meta}>
          {dates}
          <br />
          {settings.city}
        </p>
      </div>
      <a className={styles.scroll} href="#countdown" aria-label={t('hero.scroll')}>
        <Icon name="arrowDown" size={22} />
      </a>
    </section>
  )
}
