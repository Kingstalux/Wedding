import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { TextAreaField } from '../../components/Form'
import { Eyebrow } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { dayKey, formatDate } from '../../lib/time'
import { containsLink } from '../../lib/validation'
import { errorMessageKey } from '../api'
import { useInvitation } from '../InvitationProvider'
import styles from './GuestBook.module.css'

export function GuestBook() {
  const { t, lang } = useT()
  const { content, invitation, actions } = useInvitation()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  // "just now" needs the current time; keep it in state so rendering stays pure.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

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
    } catch (err) {
      setError(t(errorMessageKey(err)))
    } finally {
      setPosting(false)
    }
  }

  async function onDelete(id: string) {
    if (window.confirm(t('book.deleteConfirm'))) await actions.deleteWish(id)
  }

  const when = (iso: string) =>
    now - new Date(iso).getTime() < 60_000 ? t('book.justNow') : formatDate(dayKey(iso), lang)

  return (
    <section id="guestbook" className={styles.book} aria-labelledby="book-title">
      <div className="container">
        <Eyebrow>{t('book.eyebrow')}</Eyebrow>
        <h2 id="book-title" className="display h2">
          {t('book.title')}
        </h2>

        <div className={styles.grid}>
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
            <p className={styles.as}>{t('book.postingAs', { name: invitation.first_name })}</p>
            <div>
              <Button type="submit" loading={posting} disabled={!draft.trim()}>
                {t('book.post')}
              </Button>
            </div>
          </form>

          {invitation.wishes.length === 0 ? (
            <p className={styles.empty}>{t('book.empty')}</p>
          ) : (
            <ul className={styles.list} aria-live="polite">
              {invitation.wishes.map((wish) => (
                <li key={wish.id} className={styles.item}>
                  <div className={styles.meta}>
                    <span className={styles.who}>
                      {wish.author} · {when(wish.created_at)}
                    </span>
                    {wish.mine && (
                      <button
                        type="button"
                        className={styles.delete}
                        onClick={() => onDelete(wish.id)}
                      >
                        {t('book.delete')}
                      </button>
                    )}
                  </div>
                  <p className={styles.message}>{wish.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
