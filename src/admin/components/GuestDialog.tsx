import { useState, type FormEvent } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import { useConfirm } from '../../components/Confirm'
import { Dialog, DialogActions } from '../../components/Dialog'
import { SelectField, Switch, TextField } from '../../components/Form'
import { Icon } from '../../components/Icon'
import { useToast } from '../../components/Toast'
import { copyText } from '../../lib/clipboard'
import { fullNames } from '../../lib/guestNames'
import { formatPhone, normalizePhone } from '../../lib/phone'
import { invitationUrl } from '../../lib/whatsapp'
import { useAddGuest, useNewLink, useRemoveGuest, useUpdateGuest, type GuestRow } from '../guests'
import { studioErrorMessage } from '../queries'
import studio from '../studio.module.css'

/** Add a guest (guest = null) or edit one. Rendered only while open. */
export function GuestDialog({
  guest,
  origin,
  onClose,
}: {
  guest: GuestRow | null
  origin: string
  onClose: () => void
}) {
  const toast = useToast()
  const confirm = useConfirm()
  const add = useAddGuest()
  const update = useUpdateGuest()
  const newLink = useNewLink()
  const remove = useRemoveGuest()

  const [name, setName] = useState(guest?.name ?? '')
  const [phone, setPhone] = useState(formatPhone(guest?.phone))
  const [couple, setCouple] = useState(Boolean(guest?.partner_name))
  const [partnerName, setPartnerName] = useState(guest?.partner_name ?? '')
  const [partnerPhone, setPartnerPhone] = useState(formatPhone(guest?.partner_phone))
  const [lang, setLang] = useState<'' | 'en' | 'fr'>((guest?.lang as 'en' | 'fr' | null) ?? '')
  const [error, setError] = useState<string | null>(null)

  const link = guest?.token ? invitationUrl(origin, guest.token) : null
  const busy = add.isPending || update.isPending

  async function save(e: FormEvent) {
    e.preventDefault()
    const cleanName = name.trim().replace(/\s+/g, ' ')
    if (!cleanName) return setError('Please enter a name.')
    const normalized = normalizePhone(phone)
    if (!normalized.ok) return setError(`“${normalized.input}” isn’t a valid phone number.`)

    const cleanPartner = couple ? partnerName.trim().replace(/\s+/g, ' ') : ''
    if (couple && !cleanPartner) return setError('Please enter the partner’s name.')
    const partnerNormalized = normalizePhone(couple ? partnerPhone : '')
    if (!partnerNormalized.ok)
      return setError(`“${partnerNormalized.input}” isn’t a valid phone number.`)
    if (partnerNormalized.phone && partnerNormalized.phone === normalized.phone)
      return setError('The two numbers are the same. Leave the partner’s number empty instead.')

    const input = {
      name: cleanName,
      phone: normalized.phone,
      partner_name: cleanPartner || null,
      partner_phone: cleanPartner ? partnerNormalized.phone : null,
      lang: lang || null,
    }
    const who = fullNames(cleanName, input.partner_name)
    try {
      if (guest?.id) await update.mutateAsync({ id: guest.id, ...input })
      else await add.mutateAsync(input)
      toast(guest ? `${who} updated` : `${who} added`)
      onClose()
    } catch (err) {
      setError(studioErrorMessage(err))
    }
  }

  async function regenerate() {
    if (!guest?.id) return
    const ok = await confirm({
      title: `New private link for ${fullNames(guest.name ?? '', guest.partner_name)}?`,
      message: 'The old link stops working immediately, so send the new one to the guest.',
      confirmLabel: 'Create new link',
      danger: true,
    })
    if (!ok) return
    try {
      await newLink.mutateAsync(guest.id)
      toast('New link created — send it to the guest again')
      onClose()
    } catch (err) {
      setError(studioErrorMessage(err))
    }
  }

  async function removeGuest() {
    if (!guest?.id) return
    const reply = guest.attending === null ? '' : ' Their reply is hidden with them.'
    const ok = await confirm({
      title: `Remove ${fullNames(guest.name ?? '', guest.partner_name)}?`,
      message: `They disappear from the guest list.${reply} You can restore them for 60 days from “Recently removed”.`,
      confirmLabel: 'Remove',
      danger: true,
    })
    if (!ok) return
    try {
      await remove.mutateAsync(guest.id)
      toast(`${fullNames(guest.name ?? '', guest.partner_name)} removed`)
      onClose()
    } catch (err) {
      setError(studioErrorMessage(err))
    }
  }

  return (
    <Dialog open title={guest ? 'Edit guest' : 'New guest'} onClose={onClose}>
      <form onSubmit={save} noValidate style={{ display: 'contents' }}>
        <TextField
          look="box"
          label="Name"
          placeholder="Full name, as you’d write it on a card"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <TextField
          look="box"
          label="WhatsApp number"
          inputMode="tel"
          placeholder="6 77 12 34 56"
          hint="Without a country code, +237 is added."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Switch
          label="This invitation is for a couple (2 seats)"
          checked={couple}
          onChange={(e) => setCouple(e.target.checked)}
        />
        {couple && (
          <>
            <TextField
              look="box"
              label="Partner’s name"
              placeholder="Full name"
              hint="The invitation will greet them both, e.g. “Kingsley and Vanessa”."
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />
            <TextField
              look="box"
              label="Partner’s WhatsApp number (optional)"
              inputMode="tel"
              placeholder="6 99 88 77 66"
              hint="Lets you send the invitation to both of them. One number is enough."
              value={partnerPhone}
              onChange={(e) => setPartnerPhone(e.target.value)}
            />
          </>
        )}
        <SelectField
          look="box"
          label="Language for messages"
          value={lang}
          onChange={(v) => setLang(v as '' | 'en' | 'fr')}
          hint="Set automatically when the guest switches language on the site."
          options={[
            { value: '', label: 'Not set (use the default)' },
            { value: 'en', label: 'English' },
            { value: 'fr', label: 'Français' },
          ]}
        />

        {guest && link && (
          <div className={studio.card} style={{ padding: 16, background: 'var(--ivory)' }}>
            <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Private link</p>
            <p style={{ fontSize: 13, overflowWrap: 'anywhere', marginBottom: 12 }}>{link}</p>
            <div className={studio.row}>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await copyText(link)
                  toast('Link copied')
                }}
              >
                <Icon name="copy" /> Copy
              </Button>
              <ButtonLink
                href={`${link}?preview=1`}
                target="_blank"
                rel="noopener"
                size="sm"
                variant="ghost"
              >
                <Icon name="external" /> Preview
              </ButtonLink>
              <Button size="sm" variant="ghost" onClick={regenerate} loading={newLink.isPending}>
                New link
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className={studio.error} role="alert">
            {error}
          </p>
        )}

        <DialogActions>
          {guest && (
            <Button
              variant="danger"
              onClick={removeGuest}
              loading={remove.isPending}
              style={{ marginRight: 'auto' }}
            >
              <Icon name="trash" /> Remove
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {guest ? 'Save' : 'Add guest'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
