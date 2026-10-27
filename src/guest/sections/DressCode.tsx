import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import type { MessageKey } from '../../i18n/en'
import { useInvitation } from '../InvitationProvider'
import styles from './DressCode.module.css'

const colours: Array<[string, MessageKey]> = [
  ['var(--navy)', 'colour.navy'],
  ['var(--slate)', 'colour.slate'],
  ['var(--forest)', 'colour.forest'],
  ['var(--emerald)', 'colour.emerald'],
  ['var(--gold)', 'colour.gold'],
]

export function DressCode() {
  const { t, pick } = useT()
  const { settings } = useInvitation().content
  if (!settings.show_dress) return null

  return (
    <section id="dresscode" className={styles.dresscode} aria-labelledby="dress-title">
      <div className="container">
        <Eyebrow>{t('dress.eyebrow')}</Eyebrow>
        <h2 id="dress-title" className="display h2">
          {t('dress.title')}
        </h2>
        <Rule center />
        <p className={`serif-body ${styles.body}`}>{pick(settings.dress_en, settings.dress_fr)}</p>
        <ul className={styles.swatches}>
          {colours.map(([colour, key]) => (
            <li key={key}>
              <span className={styles.dot} style={{ background: colour }} aria-hidden="true" />
              <span className={styles.name}>{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
