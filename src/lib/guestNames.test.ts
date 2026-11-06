import { describe, expect, it } from 'vitest'
import { fullNames, seatsFor, shortNames } from './guestNames'

describe('guest names', () => {
  it('uses the first name for one person', () => {
    expect(shortNames('Ama Ngono', null, 'and')).toBe('Ama')
    expect(fullNames(' Ama Ngono ', null)).toBe('Ama Ngono')
    expect(seatsFor(null)).toBe(1)
  })

  it('joins both first names for a couple', () => {
    expect(shortNames('Kingsley Ngu', 'Vanessa Ngu', 'and')).toBe('Kingsley and Vanessa')
    expect(shortNames('Kingsley Ngu', 'Vanessa Ngu', 'et')).toBe('Kingsley et Vanessa')
    expect(fullNames('Kingsley Ngu', 'Vanessa Ngu')).toBe('Kingsley Ngu & Vanessa Ngu')
    expect(seatsFor('Vanessa')).toBe(2)
  })
})
