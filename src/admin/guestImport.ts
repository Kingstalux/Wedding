import { normalizePhone } from '../lib/phone'

/*
 * Turns the rows of an uploaded spreadsheet into guests, before anything is
 * sent to the database. Kept free of React and SheetJS so it can be tested.
 *
 * Expected columns (any order, English or French, case doesn't matter):
 *   Name / Nom / Full name / Nom complet      (required)
 *   Phone / Téléphone / Phone number / Tel…   (optional)
 *   Partner name / Nom du conjoint…           (optional: fill it for a couple)
 *   Partner phone / Téléphone du conjoint…    (optional)
 */

export type ImportRow = {
  name: string
  phone: string | null
  /**
   * Only present when the file has a partner column. A file without one
   * leaves existing couples as they are; with one, an empty cell means
   * "one person".
   */
  partner_name?: string | null
  partner_phone?: string | null
}

export type ParseResult = {
  rows: ImportRow[]
  /** Rows that can't be imported, with the spreadsheet row number (as Excel shows it). */
  problems: Array<{ row: number; message: string }>
  /** Repeated people (a phone used twice, or same name without phone): only the first is kept. */
  duplicates: Array<{ row: number; name: string }>
}

const NAME_HEADERS = ['name', 'nom', 'full name', 'nom complet', 'guest', 'invité', 'invite']
const PHONE_HEADERS = [
  'phone',
  'phone number',
  'téléphone',
  'telephone',
  'tel',
  'tél',
  'mobile',
  'whatsapp',
  'numéro',
  'numero',
]

const PARTNER_NAME_HEADERS = [
  'partner name',
  'partner',
  'second guest',
  'spouse',
  'nom du conjoint',
  'conjoint',
  'conjointe',
  'partenaire',
  'nom du partenaire',
]
const PARTNER_PHONE_HEADERS = [
  'partner phone',
  'partner whatsapp',
  'partner number',
  'spouse phone',
  'téléphone du conjoint',
  'telephone du conjoint',
  'téléphone conjoint',
  'téléphone partenaire',
  'telephone partenaire',
  'téléphone du partenaire',
]

const clean = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.:]/g, '')

export class ImportFormatError extends Error {}

/** `table` is the first sheet as an array of rows (row 0 = headers). */
export function parseGuestRows(table: unknown[][]): ParseResult {
  const [header = [], ...body] = table
  const headers = header.map(clean)
  const nameCol = headers.findIndex((h) => NAME_HEADERS.includes(h))
  const phoneCol = headers.findIndex((h) => PHONE_HEADERS.includes(h))
  const partnerCol = headers.findIndex((h) => PARTNER_NAME_HEADERS.includes(h))
  const partnerPhoneCol = headers.findIndex((h) => PARTNER_PHONE_HEADERS.includes(h))
  if (nameCol === -1) {
    throw new ImportFormatError(
      'The first row needs a “Name” column (and optionally “Phone”). Download the template to see the format.',
    )
  }

  const result: ParseResult = { rows: [], problems: [], duplicates: [] }
  const seen = new Set<string>()

  body.forEach((cells, i) => {
    const rowNumber = i + 2 // +1 for the header row, +1 because Excel counts from 1
    const name = String(cells[nameCol] ?? '')
      .trim()
      .replace(/\s+/g, ' ')
    const rawPhone = phoneCol === -1 ? '' : cells[phoneCol]
    const partnerName =
      partnerCol === -1
        ? ''
        : String(cells[partnerCol] ?? '')
            .trim()
            .replace(/\s+/g, ' ')
    const rawPartnerPhone = partnerPhoneCol === -1 ? '' : cells[partnerPhoneCol]
    if (
      !name &&
      !String(rawPhone ?? '').trim() &&
      !partnerName &&
      !String(rawPartnerPhone ?? '').trim()
    )
      return // blank line

    if (!name) {
      result.problems.push({ row: rowNumber, message: 'has a phone number but no name' })
      return
    }
    if (name.length > 120 || partnerName.length > 120) {
      result.problems.push({ row: rowNumber, message: 'has a name longer than 120 characters' })
      return
    }
    const phone = normalizePhone(rawPhone as string | number | null)
    if (!phone.ok) {
      result.problems.push({
        row: rowNumber,
        message: `“${phone.input}” isn’t a valid phone number`,
      })
      return
    }

    const partnerPhone = normalizePhone(rawPartnerPhone as string | number | null)
    if (!partnerPhone.ok) {
      result.problems.push({
        row: rowNumber,
        message: `“${partnerPhone.input}” isn’t a valid partner phone number`,
      })
      return
    }
    if (partnerPhone.phone && !partnerName) {
      result.problems.push({ row: rowNumber, message: 'has a partner phone but no partner name' })
      return
    }
    if (partnerPhone.phone && partnerPhone.phone === phone.phone) {
      result.problems.push({ row: rowNumber, message: 'has the same number for both partners' })
      return
    }

    // A number may only appear once in the whole file, whichever column it's in.
    const phones = [phone.phone, partnerPhone.phone].filter((p): p is string => !!p)
    const keys = phones.length ? phones : [`name:${name.toLowerCase()}`]
    if (keys.some((k) => seen.has(k))) {
      result.duplicates.push({ row: rowNumber, name })
      return
    }
    keys.forEach((k) => seen.add(k))

    const row: ImportRow = { name, phone: phone.phone }
    if (partnerCol !== -1) {
      row.partner_name = partnerName || null
      row.partner_phone = partnerName ? partnerPhone.phone : null
    }
    result.rows.push(row)
  })

  return result
}
