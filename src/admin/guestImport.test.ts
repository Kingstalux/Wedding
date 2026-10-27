import { describe, expect, it } from 'vitest'
import { ImportFormatError, parseGuestRows } from './guestImport'

describe('parseGuestRows', () => {
  it('reads English or French headers in any order', () => {
    const result = parseGuestRows([
      ['Téléphone', 'Nom'],
      ['6 77 12 34 56', 'Ama  Ngono'],
      [699887766, 'Paul Etoa'], // Excel number cell
      ['', 'Marie Abena'], // no phone is fine
    ])
    expect(result.rows).toEqual([
      { name: 'Ama Ngono', phone: '237677123456' },
      { name: 'Paul Etoa', phone: '237699887766' },
      { name: 'Marie Abena', phone: null },
    ])
    expect(result.problems).toEqual([])
  })

  it('reports bad rows with their Excel row numbers and skips blank lines', () => {
    const result = parseGuestRows([
      ['Name', 'Phone'],
      ['Ama', '677123456'],
      ['', ''],
      ['', '677000000'],
      ['Paul', '12345'],
    ])
    expect(result.rows).toHaveLength(1)
    expect(result.problems).toEqual([
      { row: 4, message: 'has a phone number but no name' },
      { row: 5, message: '“12345” isn’t a valid phone number' },
    ])
  })

  it('keeps the first of repeated people', () => {
    const result = parseGuestRows([
      ['Name', 'Phone'],
      ['Ama', '677123456'],
      ['Ama N.', '+237 6 77 12 34 56'], // same phone
      ['Marie', ''],
      ['marie', ''], // same name, no phone
    ])
    expect(result.rows.map((r) => r.name)).toEqual(['Ama', 'Marie'])
    expect(result.duplicates).toEqual([
      { row: 3, name: 'Ama N.' },
      { row: 5, name: 'marie' },
    ])
  })

  it('rejects a sheet without a name column', () => {
    expect(() => parseGuestRows([['Phone'], ['677123456']])).toThrow(ImportFormatError)
  })
})
