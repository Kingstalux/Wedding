import { useState, type FormEvent } from 'react'
import momoLogo from '../../assets/logos/mtn-momo.svg'
import orangeLogo from '../../assets/logos/orange-money.svg'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { Choice, TextAreaField, TextField } from '../../components/Form'
import { IconButton } from '../../components/IconButton'
import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { copyText } from '../../lib/clipboard'
import { containsLink } from '../../lib/validation'
import { errorMessageKey } from '../api'
import { useInvitation } from '../InvitationProvider'
import type { GiftMethod } from '../types'
import { useGuestNames } from '../useGuestNames'
import styles from './Gifts.module.css'

type Way = {
  method: GiftMethod
  label: string
  logo?: string
  number?: string
  name?: string | null
}

/** "A Gift From the Heart": a few words and a button that opens the gift popup. */
export function Gifts() {
  const { t, pick } = useT()
  const { settings } = useInvitation().content
  const [open, setOpen] = useState(false)
  if (!settings.show_gifts) return null

  // Only the options the couple filled in are shown.
  const ways: Way[] = []
  if (settings.momo_number)
    ways.push({
      method: 'momo',
      label: t('gift.momo'),
      logo: momoLogo,
      number: settings.momo_number,
      name: settings.momo_name,
    })
  if (settings.om_number)
    ways.push({
      method: 'orange',
      label: t('gift.orange'),
      logo: orangeLogo,
      number: settings.om_number,
      name: settings.om_name,
    })
  if (settings.show_gift_box) ways.push({ method: 'cash', label: t('gift.box') })
  if (ways.length === 0) return null

  return (
    <section
      id="gifts"
      data-reveal=""
      className={`on-dark ${styles.gifts}`}
      aria-labelledby="gifts-title"
    >
      <div className={`container ${styles.intro}`}>
        <Eyebrow>{t('gift.eyebrow')}</Eyebrow>
        <h2 id="gifts-title" className="display h2">
          {t('gift.title')}
        </h2>
        <Rule center />
        <p className={`serif-body ${styles.lede}`}>{t('gift.lede')}</p>
        <Button variant="gold" onClick={() => setOpen(true)}>
          {t('gift.open')}
        </Button>
      </div>

      <Dialog
        open={open}
        title={t('gift.dialogTitle')}
        closeLabel={t('common.close')}
        className={`paper ${styles.dialog}`}
        onClose={() => setOpen(false)}
      >
        <ul className={styles.ways}>
          {ways.map((way) => (
            <li key={way.method} className={styles.way}>
              {way.logo && <img className={styles.logo} src={way.logo} alt="" />}
              <p className={styles.label}>{way.label}</p>
              {way.number ? (
                <>
                  <p className={styles.sendTo}>{t('gift.sendTo')}</p>
                  <NumberToCopy number={way.number} method={way.label} />
                  {way.name && <p className={styles.accountName}>{way.name}</p>}
                </>
              ) : (
                <p className={styles.note}>
                  {pick(settings.gift_box_note_en, settings.gift_box_note_fr)}
                </p>
              )}
            </li>
          ))}
        </ul>
        <TellTheCouple ways={ways} />
      </Dialog>
    </section>
  )
}

/** The number in large type, with a round copy button beside it. */
function NumberToCopy({ number, method }: { number: string; method: string }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  return (
    <div className={styles.numberRow}>
      <span className={styles.number}>{number}</span>
      <IconButton
        className={styles.copy}
        icon={copied ? 'check' : 'copy'}
        label={t('gift.copyNumber', { method })}
        onClick={async () => {
          await copyText(number)
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        }}
      />
      <span className={styles.copied} aria-live="polite">
        {copied ? t('gift.copied') : ''}
      </span>
    </div>
  )
}

/** "Let us know": tells the couple about a gift. No money moves here. */
function TellTheCouple({ ways }: { ways: Way[] }) {
  const { t } = useT()
  const { actions } = useInvitation()
  const { greeting } = useGuestNames()
  const [method, setMethod] = useState<GiftMethod>(ways[0].method)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

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
        method,
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

  function another() {
    setAmount('')
    setMessage('')
    setSent(false)
  }

  if (sent) {
    return (
      <div className={styles.thanks} aria-live="polite">
        <p className="script">{t('gift.thanks')}</p>
        <p className="serif-body">{t('gift.thanksBody', { name: greeting })}</p>
        <Button variant="ghost" size="sm" onClick={another}>
          {t('gift.another')}
        </Button>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div>
        <h3 className={styles.tellTitle}>{t('gift.tellTitle')}</h3>
        <p className={styles.tellLede}>{t('gift.tellLede')}</p>
      </div>
      {ways.length > 1 && (
        <fieldset className={styles.via}>
          <legend>{t('gift.via')}</legend>
          {ways.map((way) => (
            <Choice
              key={way.method}
              name="gift-method"
              value={way.method}
              label={way.method === 'cash' ? t('gift.cashOption') : way.label}
              checked={method === way.method}
              onChange={() => setMethod(way.method)}
            />
          ))}
        </fieldset>
      )}
      <TextField
        look="box"
        label={t('gift.amount')}
        inputMode="numeric"
        placeholder={t('gift.amountPlaceholder')}
        value={amount}
        maxLength={12}
        onChange={(e) => setAmount(e.target.value)}
      />
      <TextAreaField
        look="box"
        label={t('gift.message')}
        rows={3}
        maxLength={300}
        value={message}
        error={error}
        onChange={(e) => {
          setMessage(e.target.value)
          setError(null)
        }}
      />
      <p className={styles.as}>{t('gift.sendingAs', { name: greeting })}</p>
      <Button type="submit" variant="gold" block loading={sending}>
        {t('gift.send')}
      </Button>
    </form>
  )
}
