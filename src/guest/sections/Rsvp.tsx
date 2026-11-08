import { useState, type FormEvent } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import { Choice, TextAreaField } from '../../components/Form'
import { QrCode } from '../../components/QrCode'
import { passUrl } from '../../lib/qr'
import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { formatDate } from '../../lib/time'
import { containsLink } from '../../lib/validation'
import { errorMessageKey, isWishError } from '../api'
import { useInvitation } from '../InvitationProvider'
import { useGuestNames } from '../useGuestNames'
import styles from './Rsvp.module.css'

type Answer = '' | 'yes' | 'no'

export function Rsvp() {
  const { t, lang } = useT()
  const { token, content, invitation, actions } = useInvitation()
  const { rsvp } = invitation
  const { greeting, dear, full, tc } = useGuestNames()
  const showTable = content.settings.show_tables && rsvp?.attending && invitation.table_no
  const deadline = content.settings.rsvp_deadline

  // Show the form when the guest hasn't replied yet, or chose "Change my answer".
  const [editing, setEditing] = useState(rsvp === null)
  const [answer, setAnswer] = useState<Answer>(rsvp ? (rsvp.attending ? 'yes' : 'no') : '')
  // The note for the couple is posted to Words of love, so it starts empty
  // each time: earlier ones are already there.
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wishesOn = content.settings.show_wishes
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!answer) {
      setError(tc('rsvp.choose'))
      return
    }
    const wish = wishesOn ? note.trim() : ''
    if (containsLink(wish)) {
      setNoteError(t('book.noLinks'))
      return
    }
    setError(null)
    setNoteError(null)
    setSaving(true)
    try {
      await actions.submitRsvp({ attending: answer === 'yes' }, wish)
      setNote('')
      setEditing(false)
    } catch (err) {
      const message = t(errorMessageKey(err))
      if (wish && isWishError(err)) setNoteError(message)
      else setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      id="rsvp"
      data-reveal=""
      className={`on-dark ${styles.rsvp}`}
      aria-labelledby="rsvp-title"
    >
      <div className={styles.head}>
        <Eyebrow>RSVP</Eyebrow>
        <h2 id="rsvp-title" className="display h2">
          {t('rsvp.title')}
        </h2>
        <Rule center />
      </div>
      {/* The reply card: ivory, like printed stationery */}
      <div className={`paper ${styles.card}`}>
        {editing || !rsvp ? (
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <p className={styles.lede}>
              {deadline
                ? tc('rsvp.lede', { name: dear, date: formatDate(deadline, lang) })
                : tc('rsvp.ledeNoDate', { name: dear })}
            </p>
            <fieldset className={styles.choices}>
              <legend className="sr-only">{tc('rsvp.legend')}</legend>
              <Choice
                name="attend"
                value="yes"
                label={tc('rsvp.yes')}
                checked={answer === 'yes'}
                onChange={() => setAnswer('yes')}
              />
              <Choice
                name="attend"
                value="no"
                label={tc('rsvp.no')}
                checked={answer === 'no'}
                onChange={() => setAnswer('no')}
              />
            </fieldset>
            {wishesOn && (
              <TextAreaField
                label={t('rsvp.note')}
                hint={t('rsvp.noteHint', { name: greeting })}
                rows={3}
                value={note}
                maxLength={500}
                error={noteError}
                onChange={(e) => {
                  setNote(e.target.value)
                  setNoteError(null)
                }}
              />
            )}
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <div>
              <Button type="submit" loading={saving}>
                {t('rsvp.submit')}
              </Button>
            </div>
          </form>
        ) : rsvp.attending ? (
          <div aria-live="polite">
            <p className={styles.thanks}>{tc('rsvp.thanksYes', { name: greeting })}</p>
            <div className={styles.passCard}>
              <QrCode
                className={styles.qr}
                value={passUrl(invitation.pass_code)}
                label={t('pass.qrAlt', { name: full })}
              />
              <div>
                <Eyebrow className={styles.passKicker}>{t('rsvp.passKicker')}</Eyebrow>
                <p className={styles.passName}>{full}</p>
                <p className={styles.passCode}>
                  {invitation.pass_code}
                  {invitation.seats > 1 && ` · ${t('pass.seats', { n: invitation.seats })}`}
                </p>
                {showTable && (
                  <a className={styles.tableLink} href="#tables">
                    {t('rsvp.tableLink', { n: invitation.table_no! })}
                  </a>
                )}
              </div>
            </div>
            <div className={styles.actions}>
              <ButtonLink to={`/i/${token}/pass`}>{t('rsvp.openPass')}</ButtonLink>
              <Button variant="ghost" onClick={() => setEditing(true)}>
                {t('rsvp.change')}
              </Button>
            </div>
          </div>
        ) : (
          <div aria-live="polite">
            <p className={styles.thanks}>{tc('rsvp.thanksNo', { name: greeting })}</p>
            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setEditing(true)}>
                {t('rsvp.change')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
