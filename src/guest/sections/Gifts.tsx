import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { SelectField, TextAreaField, TextField } from '../../components/Form'
import { Icon } from '../../components/Icon'
import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { copyText } from '../../lib/clipboard'
import { cx } from '../../lib/cx'
import { containsLink } from '../../lib/validation'
import { errorMessageKey } from '../api'
import { useInvitation } from '../InvitationProvider'
import type { GiftMethod } from '../types'
import styles from './Gifts.module.css'

function CopyButton({ text }: { text: string }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await copyText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }}
    >
      {copied ? (
        <>
          <Icon name="check" /> {t('gift.copied')}
        </>
      ) : (
        t('gift.copy')
      )}
    </Button>
  )
}

export function Gifts() {
  const { t, pick } = useT()
  const { content, invitation, actions } = useInvitation()
  const { settings } = content

  const [method, setMethod] = useState<GiftMethod | ''>('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!settings.show_gifts) return null

  // Only the options the couple filled in are shown.
  const ways: Array<{ method: GiftMethod; label: string; number?: string; name?: string | null }> =
    []
  if (settings.momo_number)
    ways.push({
      method: 'momo',
      label: t('gift.momo'),
      number: settings.momo_number,
      name: settings.momo_name,
    })
  if (settings.om_number)
    ways.push({
      method: 'orange',
      label: t('gift.orange'),
      number: settings.om_number,
      name: settings.om_name,
    })
  if (settings.show_gift_box) ways.push({ method: 'cash', label: t('gift.cash') })
  if (ways.length === 0) return null

  const chosen = method || ways[0].method

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (containsLink(message)) {
      setError(t('book.noLinks'))
      return
    }
    const digits = amount.replace(/\D/g, '')
    setError(null)
    setSending(true)
    try {
      await actions.announceGift({
        method: chosen,
        amount_fcfa: digits ? Number(digits) : null,
        message: message.trim(),
      })
      setSent(true)
    } catch (err) {
      setError(t(errorMessageKey(err)))
    } finally {
      setSending(false)
    }
  }

  function reset() {
    setMethod('')
    setAmount('')
    setMessage('')
    setSent(false)
  }

  return (
    <section id="gifts" className={styles.gifts} aria-labelledby="gifts-title">
      <div className="container">
        <div className={styles.intro}>
          <Eyebrow>{t('gift.eyebrow')}</Eyebrow>
          <h2 id="gifts-title" className="display h2">
            {t('gift.title')}
          </h2>
          <Rule center />
          <p className={`serif-body ${styles.lede}`}>{t('gift.lede')}</p>
        </div>

        <ul className={styles.ways}>
          {ways.map((way) => (
            <li key={way.method} className={styles.way}>
              <p className={styles.label}>{way.label}</p>
              {way.number ? (
                <>
                  <p className={styles.number}>{way.number}</p>
                  <p className={styles.note}>
                    {way.name && t('gift.accountName', { name: way.name })}
                  </p>
                  <CopyButton text={way.number} />
                </>
              ) : (
                <>
                  <p className={cx(styles.number, styles.numberSmall)}>{t('gift.box')}</p>
                  <p className={styles.note}>
                    {pick(settings.gift_box_note_en, settings.gift_box_note_fr)}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>

        <div className={styles.tell}>
          {sent ? (
            <div className={styles.thanks} aria-live="polite">
              <p className="script">{t('gift.thanks')}</p>
              <p className="serif-body">{t('gift.thanksBody', { name: invitation.first_name })}</p>
              <Button variant="ghost" size="sm" onClick={reset}>
                {t('gift.another')}
              </Button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={onSubmit}>
              <div>
                <h3 className="display h3">{t('gift.tellTitle')}</h3>
                <p className="muted" style={{ marginTop: 6, fontSize: 15 }}>
                  {t('gift.tellLede')}
                </p>
              </div>
              <div className={styles.fields}>
                <SelectField
                  label={t('gift.via')}
                  value={chosen}
                  onChange={(e) => setMethod(e.target.value as GiftMethod)}
                >
                  {ways.map((way) => (
                    <option key={way.method} value={way.method}>
                      {way.method === 'cash' ? t('gift.cashOption') : way.label}
                    </option>
                  ))}
                </SelectField>
                <TextField
                  label={t('gift.amount')}
                  inputMode="numeric"
                  placeholder={t('gift.amountPlaceholder')}
                  value={amount}
                  maxLength={12}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <TextAreaField
                label={t('gift.message')}
                rows={2}
                maxLength={300}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                error={error}
              />
              <div>
                <Button type="submit" loading={sending}>
                  {t('gift.send')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
