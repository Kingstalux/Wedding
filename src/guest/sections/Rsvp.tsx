import { useState, type FormEvent } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import { Choice, TextAreaField, TextField } from '../../components/Form'
import { Photo } from '../../components/Photo'
import { QrCode } from '../../components/QrCode'
import { passUrl } from '../../lib/qr'
import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { formatDate } from '../../lib/time'
import { errorMessageKey } from '../api'
import { useInvitation } from '../InvitationProvider'
import styles from './Rsvp.module.css'

type Answer = '' | 'yes' | 'no'

export function Rsvp() {
  const { t, lang } = useT()
  const { token, content, invitation, actions } = useInvitation()
  const { rsvp } = invitation
  const deadline = content.settings.rsvp_deadline

  // Show the form when the guest hasn't replied yet, or chose "Change my answer".
  const [editing, setEditing] = useState(rsvp === null)
  const [answer, setAnswer] = useState<Answer>(rsvp ? (rsvp.attending ? 'yes' : 'no') : '')
  const [diet, setDiet] = useState(rsvp?.diet ?? '')
  const [note, setNote] = useState(rsvp?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!answer) {
      setError(t('rsvp.choose'))
      return
    }
    setError(null)
    setSaving(true)
    try {
      await actions.submitRsvp({
        attending: answer === 'yes',
        diet: diet.trim(),
        note: note.trim(),
      })
      setEditing(false)
    } catch (err) {
      setError(t(errorMessageKey(err)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="rsvp" className={styles.rsvp} aria-labelledby="rsvp-title">
      <Photo
        className={styles.photo}
        src={content.settings.word_photo_url}
        label={t('rsvp.photo')}
        tone="slate"
      />
      <div className={styles.body}>
        <Eyebrow>RSVP</Eyebrow>
        <h2 id="rsvp-title" className="display h2">
          {t('rsvp.title')}
        </h2>
        <Rule />

        {editing || !rsvp ? (
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <p className={styles.lede}>
              {deadline
                ? t('rsvp.lede', { name: invitation.name, date: formatDate(deadline, lang) })
                : t('rsvp.ledeNoDate', { name: invitation.name })}
            </p>
            <fieldset className={styles.choices}>
              <legend className="sr-only">{t('rsvp.legend')}</legend>
              <Choice
                name="attend"
                value="yes"
                label={t('rsvp.yes')}
                checked={answer === 'yes'}
                onChange={() => setAnswer('yes')}
              />
              <Choice
                name="attend"
                value="no"
                label={t('rsvp.no')}
                checked={answer === 'no'}
                onChange={() => setAnswer('no')}
              />
            </fieldset>
            {answer !== 'no' && (
              <TextField
                label={t('rsvp.diet')}
                placeholder={t('rsvp.dietPlaceholder')}
                value={diet}
                maxLength={200}
                onChange={(e) => setDiet(e.target.value)}
              />
            )}
            <TextAreaField
              label={t('rsvp.note')}
              rows={3}
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
            />
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
            <p className={styles.thanks}>{t('rsvp.thanksYes', { name: invitation.first_name })}</p>
            <div className={styles.passCard}>
              <QrCode
                className={styles.qr}
                value={passUrl(invitation.pass_code)}
                label={t('pass.qrAlt', { name: invitation.name })}
              />
              <div>
                <Eyebrow className={styles.passKicker}>{t('rsvp.passKicker')}</Eyebrow>
                <p className={styles.passName}>{invitation.name}</p>
                <p className={styles.passCode}>{invitation.pass_code}</p>
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
            <p className={styles.thanks}>{t('rsvp.thanksNo', { name: invitation.first_name })}</p>
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
