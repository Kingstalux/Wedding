import { describe, expect, it } from 'vitest'
import { invitationUrl, inviteMessage, whatsappUrl } from './whatsapp'

describe('WhatsApp invitations', () => {
  const link = invitationUrl('https://example.com', 'Ab12Cd34Ef56Gh78')

  it('builds the private link', () => {
    expect(link).toBe('https://example.com/i/Ab12Cd34Ef56Gh78')
  })

  it('fills the template with the first name and link', () => {
    const message = inviteMessage('Dear {name}, {bride} & {groom} invite you: {link}', {
      guestName: 'Ama Ngono',
      bride: 'Bride',
      groom: 'Groom',
      link,
    })
    expect(message).toBe(
      'Dear Ama, Bride & Groom invite you: https://example.com/i/Ab12Cd34Ef56Gh78',
    )
  })

  it('greets both first names for a couple', () => {
    const message = inviteMessage('Dear {name}, you are both invited: {link}', {
      guestName: 'Kingsley Ngu',
      partnerName: 'Vanessa Ngu',
      and: 'et',
      bride: 'Bride',
      groom: 'Groom',
      link,
    })
    expect(message).toBe('Dear Kingsley et Vanessa, you are both invited: ' + link)
  })

  it('makes a wa.me link, with or without a phone', () => {
    expect(whatsappUrl('237677123456', 'Hi & welcome')).toBe(
      'https://wa.me/237677123456?text=Hi%20%26%20welcome',
    )
    expect(whatsappUrl(null, 'Hi')).toBe('https://wa.me/?text=Hi')
  })
})
