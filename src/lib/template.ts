/*
 * Text templates written by the couple in the studio.
 */

/**
 * Fills {placeholders}: fill('Dear {name}, open {link}', { name: 'Ama', link: 'https://…' }).
 * Unknown placeholders are left as they are, so a typo stays visible instead of vanishing.
 */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{([^{}]+)\}/g, (match, key: string) => {
    const value = values[key.trim()]
    return value === undefined ? match : value
  })
}

/** The guest-name placeholder in either language: {guest name} or {nom de l’invité}. */
const GUEST_NAME = /\{\s*(guest name|nom de l['’]invité)\s*\}/gi

export function fillGuestName(text: string, name: string): string {
  return text.replace(GUEST_NAME, name)
}

/**
 * Splits "Dear Ama, thank you for…" into a greeting heading ("Dear Ama,")
 * and the body ("Thank you for…"), as the design shows them separately.
 * Text without a short opening greeting is returned as body only.
 */
export function splitGreeting(text: string): { greeting: string | null; body: string } {
  const comma = text.indexOf(',')
  if (comma <= 0 || comma > 60) return { greeting: null, body: text.trim() }
  const body = text.slice(comma + 1).trim()
  return {
    greeting: text.slice(0, comma + 1).trim(),
    body: body.charAt(0).toUpperCase() + body.slice(1),
  }
}

/** First word of a full name: "Ama Ngono" → "Ama". */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? ''
}
