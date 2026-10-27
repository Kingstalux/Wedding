import { fill, firstName } from './template'

/*
 * WhatsApp "click to chat": https://wa.me/<phone>?text=<message>
 * Opens WhatsApp (app or web) with the message typed in, ready to send.
 * The couple presses Send; nothing is sent automatically.
 */

/** A guest's private invitation address. */
export function invitationUrl(origin: string, token: string): string {
  return `${origin}/i/${encodeURIComponent(token)}`
}

/** The couple's template with this guest's details filled in. */
export function inviteMessage(
  template: string,
  values: { guestName: string; bride: string; groom: string; link: string },
): string {
  return fill(template, {
    name: firstName(values.guestName),
    bride: values.bride,
    groom: values.groom,
    link: values.link,
  })
}

/** Without a phone, WhatsApp opens with the message and lets you pick the contact. */
export function whatsappUrl(phone: string | null, message: string): string {
  const to = phone ? phone.replace(/\D/g, '') : ''
  return `https://wa.me/${to}?text=${encodeURIComponent(message)}`
}
