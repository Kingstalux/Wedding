import { describe, expect, it } from 'vitest'
import { codeFromScan, pickCurrentEvent } from './door'

describe('codeFromScan', () => {
  it('reads the code from a pass address or on its own', () => {
    expect(codeFromScan('https://bride-groom.vercel.app/pass/K7Q2M9')).toBe('K7Q2M9')
    expect(codeFromScan('http://localhost:5180/pass/demobb')).toBe('DEMOBB')
    expect(codeFromScan(' k7q2m9 ')).toBe('K7Q2M9')
  })

  it('ignores anything that is not a pass', () => {
    expect(codeFromScan('https://example.com/some/other/page')).toBeNull()
    expect(codeFromScan('hello world')).toBeNull()
  })
})

describe('pickCurrentEvent', () => {
  const events = [
    { id: 'church', starts_at: '2026-12-26T11:00:00Z', ends_at: '2026-12-26T13:00:00Z' },
    { id: 'civil', starts_at: '2026-12-23T10:00:00Z', ends_at: null },
    { id: 'reception', starts_at: '2026-12-26T15:00:00Z', ends_at: '2026-12-26T19:00:00Z' },
  ]
  const at = (iso: string) => pickCurrentEvent(events, new Date(iso))?.id

  it('picks the event happening now, including the arrival time before it', () => {
    expect(at('2026-12-26T12:30:00Z')).toBe('church')
    expect(at('2026-12-26T13:30:00Z')).toBe('reception') // guests arriving early
  })

  it('otherwise the next one, otherwise the last one', () => {
    expect(at('2026-12-01T00:00:00Z')).toBe('civil')
    expect(at('2027-01-05T00:00:00Z')).toBe('reception')
  })
})
