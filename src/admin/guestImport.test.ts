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

  it('reads couples from the partner columns', () => {
    const result = parseGuestRows([
      ['Name', 'Phone', 'Partner name', 'Partner phone'],
      ['Kingsley Ngu', '677123456', 'Vanessa Ngu', '699887766'],
      ['Paul Etoa', '677000001', 'Marie Etoa', ''], // one number is fine
      ['Ama Ngono', '677000002', '', ''], // one person
    ])
    expect(result.rows).toEqual([
      {
        name: 'Kingsley Ngu',
        phone: '237677123456',
        partner_name: 'Vanessa Ngu',
        partner_phone: '237699887766',
      },
      { name: 'Paul Etoa', phone: '237677000001', partner_name: 'Marie Etoa', partner_phone: null },
      { name: 'Ama Ngono', phone: '237677000002', partner_name: null, partner_phone: null },
    ])
  })

  it('checks partner numbers too', () => {
    const result = parseGuestRows([
      ['Nom', 'Téléphone', 'Nom du conjoint', 'Téléphone du conjoint'],
      ['Kingsley', '677123456', 'Vanessa', '699887766'],
      ['Odette', '699887766', '', ''], // already used as a partner number
      ['Lucien', '677000003', '', '677000004'], // number but no partner name
      ['Paul', '677000005', 'Marie', '677000005'], // same number twice
    ])
    expect(result.rows.map((r) => r.name)).toEqual(['Kingsley'])
    expect(result.duplicates).toEqual([{ row: 3, name: 'Odette' }])
    expect(result.problems).toEqual([
      { row: 4, message: 'has a partner phone but no partner name' },
      { row: 5, message: 'has the same number for both partners' },
    ])
  })

  it('rejects a sheet without a name column', () => {
    expect(() => parseGuestRows([['Phone'], ['677123456']])).toThrow(ImportFormatError)
  })
})
