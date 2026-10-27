import { describe, expect, it } from 'vitest'
import {
  countdown,
  dayKey,
  formatDate,
  formatDayLong,
  formatDaySpan,
  formatTime,
  formatTimeRange,
  fromLocalInput,
  joinLocal,
  splitLocal,
  toLocalInput,
} from './time'

// 11:00 in Yaoundé is 10:00 UTC
const civil = '2026-12-23T10:00:00Z'
const tradEnd = '2026-12-23T19:00:00Z'
const church = '2026-12-26T11:00:00Z'

describe('time helpers (Africa/Douala)', () => {
  it('groups by the local calendar day, even late at night UTC', () => {
    expect(dayKey(civil)).toBe('2026-12-23')
    // 23:30 UTC on the 23rd is already 00:30 on the 24th in Douala
    expect(dayKey('2026-12-23T23:30:00Z')).toBe('2026-12-24')
  })

  it('formats days and times in both languages', () => {
    expect(formatDayLong(civil, 'en')).toBe('Wednesday 23 December')
    expect(formatDayLong(civil, 'fr')).toBe('mercredi 23 décembre')
    expect(formatTime(civil, 'en')).toBe('11:00 AM')
    expect(formatTime(civil, 'fr')).toBe('11:00')
    expect(formatTimeRange('2026-12-23T15:00:00Z', tradEnd, 'fr')).toBe('16:00 – 20:00')
    expect(formatTimeRange(civil, null, 'en')).toBe('11:00 AM')
  })

  it('formats plain dates and the wedding day span', () => {
    expect(formatDate('2026-12-10', 'en')).toBe('10 December 2026')
    expect(formatDaySpan([civil, tradEnd, church], 'en')).toBe('23 & 26 December 2026')
    expect(formatDaySpan([civil, church], 'fr')).toBe('23 & 26 décembre 2026')
  })

  it('counts down and stops at zero', () => {
    const now = new Date('2026-12-22T09:00:00Z')
    expect(countdown(civil, now)).toEqual({
      days: 1,
      hours: 1,
      minutes: 0,
      seconds: 0,
      done: false,
    })
    expect(countdown(civil, new Date('2027-01-01')).done).toBe(true)
  })
})

describe('studio date fields (always Douala time)', () => {
  it('round-trips datetime-local values', () => {
    expect(toLocalInput('2026-12-23T10:00:00Z')).toBe('2026-12-23T11:00')
    expect(fromLocalInput('2026-12-23T11:00')).toBe('2026-12-23T11:00:00+01:00')
    expect(toLocalInput(fromLocalInput('2026-12-26T16:30'))).toBe('2026-12-26T16:30')
    expect(fromLocalInput('')).toBeNull()
  })

  it('splits and joins date and time', () => {
    expect(splitLocal('2026-12-26T19:00:00Z')).toEqual({ date: '2026-12-26', time: '20:00' })
    expect(joinLocal('2026-12-26', '20:00')).toBe('2026-12-26T20:00:00+01:00')
    expect(joinLocal('2026-12-26', '')).toBeNull()
  })
})
