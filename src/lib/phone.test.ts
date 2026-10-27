import { describe, expect, it } from 'vitest'
import { formatPhone, normalizePhone } from './phone'

describe('normalizePhone', () => {
  it('adds the Cameroon country code to local numbers', () => {
    expect(normalizePhone('6 77 12 34 56')).toEqual({ ok: true, phone: '237677123456' })
    expect(normalizePhone('677-123-456')).toEqual({ ok: true, phone: '237677123456' })
    expect(normalizePhone(677123456)).toEqual({ ok: true, phone: '237677123456' }) // Excel number cell
  })

  it('keeps numbers that already have a country code', () => {
    expect(normalizePhone('+237 677 12 34 56')).toEqual({ ok: true, phone: '237677123456' })
    expect(normalizePhone('00237677123456')).toEqual({ ok: true, phone: '237677123456' })
    expect(normalizePhone('+33 6 12 34 56 78')).toEqual({ ok: true, phone: '33612345678' })
  })

  it('treats an empty cell as "no phone"', () => {
    expect(normalizePhone('')).toEqual({ ok: true, phone: null })
    expect(normalizePhone(null)).toEqual({ ok: true, phone: null })
  })

  it('rejects things that are not phone numbers', () => {
    expect(normalizePhone('12345')).toEqual({ ok: false, input: '12345' })
    expect(normalizePhone('+237 677 12')).toEqual({ ok: false, input: '+237 677 12' })
    expect(normalizePhone('call me')).toEqual({ ok: false, input: 'call me' })
  })
})

describe('formatPhone', () => {
  it('formats Cameroonian numbers in pairs', () => {
    expect(formatPhone('237677123456')).toBe('+237 6 77 12 34 56')
    expect(formatPhone('33612345678')).toBe('+33612345678')
    expect(formatPhone(null)).toBe('')
  })
})
