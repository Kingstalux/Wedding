import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { fillGuestName, splitGreeting } from '../../lib/template'
import { useInvitation } from '../InvitationProvider'
import styles from './Word.module.css'

/**
 * "A word from the couple", personalised with the guest's name, laid out as
 * a letter in a double gold frame. Hidden when switched off.
 */
export function Word() {
  const { t, pick } = useT()
  const { content, invitation } = useInvitation()
  const { settings } = content
  if (!settings.show_word) return null

  const text = fillGuestName(pick(settings.word_en, settings.word_fr), invitation.name)
  const { greeting, body } = splitGreeting(text)

  return (
    <section
      id="word"
      data-reveal=""
      className={`on-dark ${styles.word}`}
      aria-labelledby="word-title"
    >
      <div className="container">
        <article className={styles.letter}>
          <span className={styles.quote} aria-hidden="true">
            “
          </span>
          <Eyebrow>{t('word.eyebrow')}</Eyebrow>
          <h2 id="word-title" className="display h2">
            {greeting ?? t('word.eyebrow')}
          </h2>
          <Rule center />
          <p className={`serif-body ${styles.body}`}>{body}</p>
          <p className={`script ${styles.signature}`}>
            {settings.bride} + {settings.groom}
          </p>
        </article>
      </div>
    </section>
  )
}
