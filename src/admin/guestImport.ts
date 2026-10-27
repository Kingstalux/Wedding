import { normalizePhone } from '../lib/phone'

/*
 * Turns the rows of an uploaded spreadsheet into guests, before anything is
 * sent to the database. Kept free of React and SheetJS so it can be tested.
 *
 * Expected columns (any order, English or French, case doesn't matter):
 *   Name / Nom / Full name / Nom complet      (required)
 *   Phone / Téléphone / Phone number / Tel…   (optional)
 */

export type ImportRow = { name: string; phone: string | null }

export type ParseResult = {
  rows: ImportRow[]
  /** Rows that can't be imported, with the spreadsheet row number (as Excel shows it). */
  problems: Array<{ row: number; message: string }>
  /** Repeated people (same phone, or same name without phone): only the first is kept. */
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
    if (!name && !String(rawPhone ?? '').trim()) return // blank line

    if (!name) {
      result.problems.push({ row: rowNumber, message: 'has a phone number but no name' })
      return
    }
    if (name.length > 120) {
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

    const key = phone.phone ?? `name:${name.toLowerCase()}`
    if (seen.has(key)) {
      result.duplicates.push({ row: rowNumber, name })
      return
    }
    seen.add(key)
    result.rows.push({ name, phone: phone.phone })
  })

  return result
}
