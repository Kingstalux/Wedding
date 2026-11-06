import { en, type MessageKey } from '../i18n/en'
import { useT } from '../i18n/LanguageProvider'
import { fullNames, shortNames } from '../lib/guestNames'
import { useInvitation } from './InvitationProvider'

/**
 * The guest's names as the invitation shows them, and `tc`: like `t`, but
 * uses the couple's version of a message ("rsvp.legendBoth") when the
 * invitation is for two people and that version exists.
 */
export function useGuestNames() {
  const { t } = useT()
  const { invitation } = useInvitation()
  const couple = Boolean(invitation.partner_name)
  const greeting = shortNames(invitation.name, invitation.partner_name, t('common.and'))
  return {
    couple,
    /** "Ama", or "Kingsley and Vanessa" */
    greeting,
    /** After "Dear": the full name for one person ("Ama Ngono"), both first names for a couple. */
    dear: couple ? greeting : invitation.name,
    /** "Ama Ngono", or "Kingsley Ngu & Vanessa Ngu" */
    full: fullNames(invitation.name, invitation.partner_name),
    tc: (key: MessageKey, values?: Record<string, string | number>) => {
      const both = `${key}Both`
      return t(couple && both in en ? (both as MessageKey) : key, values)
    },
  }
}
