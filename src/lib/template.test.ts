import { describe, expect, it } from 'vitest'
import { fill, fillGuestName, firstName, splitGreeting } from './template'

describe('template helpers', () => {
  it('fills placeholders and keeps unknown ones visible', () => {
    expect(fill('Dear {name}, open {link}', { name: 'Ama', link: 'https://x.y/i/abc' })).toBe(
      'Dear Ama, open https://x.y/i/abc',
    )
    expect(fill('Hi {nmae}', { name: 'Ama' })).toBe('Hi {nmae}')
  })

  it('replaces the guest name placeholder in English and French', () => {
    expect(fillGuestName('Dear {guest name}, thank you', 'Ama')).toBe('Dear Ama, thank you')
    expect(fillGuestName('Cher(e) {nom de l’invité}, merci', 'Ama')).toBe('Cher(e) Ama, merci')
    expect(fillGuestName("Cher(e) {nom de l'invité}, merci", 'Ama')).toBe('Cher(e) Ama, merci')
  })

  it('splits a greeting from the body', () => {
    expect(splitGreeting('Dear Ama, thank you for coming.')).toEqual({
      greeting: 'Dear Ama,',
      body: 'Thank you for coming.',
    })
    expect(splitGreeting('No greeting here')).toEqual({ greeting: null, body: 'No greeting here' })
  })

  it('takes the first name', () => {
    expect(firstName('  Ama Ngono Mbarga ')).toBe('Ama')
  })
})
