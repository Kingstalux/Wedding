import { describe, expect, it } from 'vitest'
import { paginate } from './paging'

const list = Array.from({ length: 23 }, (_, i) => i + 1)

describe('paginate', () => {
  it('cuts a list into pages', () => {
    expect(paginate(list, 1, 10)).toMatchObject({ page: 1, pageCount: 3, from: 1, to: 10 })
    const last = paginate(list, 3, 10)
    expect(last).toMatchObject({ page: 3, from: 21, to: 23 })
    expect(last.items).toEqual([21, 22, 23])
  })

  it('keeps the page in range when the list shrinks', () => {
    expect(paginate(list.slice(0, 12), 3, 10)).toMatchObject({ page: 2, from: 11, to: 12 })
    expect(paginate(list, 0, 10).page).toBe(1)
  })

  it('handles an empty list', () => {
    expect(paginate([], 2, 10)).toMatchObject({ page: 1, pageCount: 1, from: 0, to: 0, items: [] })
  })
})
