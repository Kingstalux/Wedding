import { useState, type FormEvent } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import { Dialog, DialogActions } from '../../components/Dialog'
import { SelectField, TextField } from '../../components/Form'
import { Icon } from '../../components/Icon'
import { useToast } from '../../components/Toast'
import { copyText } from '../../lib/clipboard'
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
  const add = useAddGuest()
  const update = useUpdateGuest()
  const newLink = useNewLink()
  const remove = useRemoveGuest()

  const [name, setName] = useState(guest?.name ?? '')
  const [phone, setPhone] = useState(formatPhone(guest?.phone))
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
    const input = { name: cleanName, phone: normalized.phone, lang: lang || null }
    try {
      if (guest?.id) await update.mutateAsync({ id: guest.id, ...input })
      else await add.mutateAsync(input)
      toast(guest ? `${cleanName} was updated` : `${cleanName} was added`)
      onClose()
    } catch (err) {
      setError(studioErrorMessage(err))
    }
  }

  async function regenerate() {
    if (!guest?.id) return
    if (
      !window.confirm(
        `Create a new private link for ${guest.name}? The old link stops working immediately.`,
      )
    )
      return
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
    if (
      !window.confirm(
        `Remove ${guest.name} from the guest list?${reply} You can restore them for 60 days.`,
      )
    )
      return
    try {
      await remove.mutateAsync(guest.id)
      toast(`${guest.name} was removed`)
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
        <SelectField
          look="box"
          label="Language for messages"
          value={lang}
          onChange={(e) => setLang(e.target.value as '' | 'en' | 'fr')}
          hint="Set automatically when the guest switches language on the site."
        >
          <option value="">Not set (use the default)</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
        </SelectField>

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
