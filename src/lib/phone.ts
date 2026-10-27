/*
 * Phone numbers are stored as digits with the country code, e.g. 237677123456,
 * which is exactly what WhatsApp links (wa.me/237677123456) expect.
 */

export type PhoneResult =
  | { ok: true; phone: string | null } // null = no phone given (allowed)
  | { ok: false; input: string } // something was typed but it isn't a valid number

/**
 * Accepts the ways people write Cameroonian numbers:
 *   "6 77 12 34 56", "677-123-456"     → 237677123456 (country code added)
 *   "+237 677 12 34 56", "00237677…"   → 237677123456
 *   "+33 6 12 34 56 78" (abroad)       → 33612345678 (kept as is)
 */
export function normalizePhone(input: string | number | null | undefined): PhoneResult {
  const raw = String(input ?? '').trim()
  if (raw === '') return { ok: true, phone: null }

  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)

  // Local Cameroonian number: 9 digits starting with 6 (mobile) or 2 (landline)
  if (/^[62]\d{8}$/.test(digits) && !raw.startsWith('+')) {
    return { ok: true, phone: `237${digits}` }
  }

  // International format (8–15 digits, the E.164 maximum)
  if (/^\d{8,15}$/.test(digits)) {
    // A Cameroonian number must have exactly 9 digits after 237.
    if (digits.startsWith('237') && digits.length !== 12) return { ok: false, input: raw }
    return { ok: true, phone: digits }
  }

  return { ok: false, input: raw }
}

/** 237677123456 → "+237 6 77 12 34 56" for display. Other countries: "+33612345678". */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const cm = phone.match(/^237(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/)
  return cm ? `+237 ${cm.slice(1).join(' ')}` : `+${phone}`
}
