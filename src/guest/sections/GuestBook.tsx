import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { TextAreaField } from '../../components/Form'
import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { containsLink } from '../../lib/validation'
import { errorMessageKey } from '../api'
import { useInvitation } from '../InvitationProvider'
import styles from './GuestBook.module.css'

/** "Leave us a wish": the form. The messages themselves are in the Wishes carousel. */
export function GuestBook() {
  const { t } = useT()
  const { content, invitation, actions } = useInvitation()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)

  if (!content.settings.show_wishes) return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const message = draft.trim()
    if (!message) return
    if (containsLink(message)) {
      setError(t('book.noLinks'))
      return
    }
    setError(null)
    setPosting(true)
    try {
      await actions.postWish(message)
      setDraft('')
      // Show it: the new wish is first in the carousel just above.
      document.getElementById('wishes')?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      setError(t(errorMessageKey(err)))
    } finally {
      setPosting(false)
    }
  }

  return (
    <section id="guestbook" className={styles.book} aria-labelledby="book-title">
      <div className={`container ${styles.inner}`}>
        <Eyebrow>{t('book.eyebrow')}</Eyebrow>
        <h2 id="book-title" className="display h2">
          {t('book.title')}
        </h2>
        <Rule center />
        <form className={styles.form} onSubmit={onSubmit}>
          <TextAreaField
            label={t('book.label')}
            placeholder={t('book.placeholder')}
            rows={4}
            maxLength={500}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            error={error}
          />
          <div className={styles.footer}>
            <p className={styles.as}>{t('book.postingAs', { name: invitation.first_name })}</p>
            <Button type="submit" loading={posting} disabled={!draft.trim()}>
              {t('book.post')}
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
