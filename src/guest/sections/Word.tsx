import { Photo } from '../../components/Photo'
import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { fillGuestName, splitGreeting } from '../../lib/template'
import { useInvitation } from '../InvitationProvider'
import styles from './Word.module.css'

/** "A word from the couple", personalised with the guest's name. Hidden when switched off. */
export function Word() {
  const { t, pick } = useT()
  const { content, invitation } = useInvitation()
  const { settings } = content
  if (!settings.show_word) return null

  const text = fillGuestName(pick(settings.word_en, settings.word_fr), invitation.name)
  const { greeting, body } = splitGreeting(text)

  return (
    <section id="word" className={styles.word} aria-labelledby="word-title">
      <div className={`container ${styles.split}`}>
        <Photo
          className={styles.photo}
          src={settings.word_photo_url}
          label={t('word.photo')}
          tone="forest"
        />
        <div className={styles.text}>
          <Eyebrow>{t('word.eyebrow')}</Eyebrow>
          <h2 id="word-title" className="display h2">
            {greeting ?? t('word.eyebrow')}
          </h2>
          <Rule />
          <p className="serif-body">{body}</p>
          <p className={`script ${styles.signature}`}>
            {settings.bride} + {settings.groom}
          </p>
        </div>
      </div>
    </section>
  )
}
