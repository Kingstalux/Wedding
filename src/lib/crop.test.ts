import { describe, expect, it } from 'vitest'
import { CENTERED, coverRect, cropRect, normalizeCrop, panCrop } from './crop'

const landscape = { w: 4000, h: 3000 }

describe('cropRect', () => {
  it('keeps the largest centred area of the frame shape at zoom 1', () => {
    // 4:5 portrait frame from a 4:3 photo: full height, centred horizontally
    expect(cropRect(landscape, 4 / 5, CENTERED)).toEqual({ sx: 800, sy: 0, sw: 2400, sh: 3000 })
    // 16:9 frame: full width
    const r = cropRect(landscape, 16 / 9, CENTERED)
    expect(r.sw).toBe(4000)
    expect(r.sh).toBeCloseTo(2250)
    expect(r.sy).toBeCloseTo(375)
  })

  it('zooms in around the centre and never leaves the photo', () => {
    expect(cropRect(landscape, 1, { u: 0.5, v: 0.5, zoom: 2 })).toEqual({
      sx: 1250,
      sy: 750,
      sw: 1500,
      sh: 1500,
    })
    // asking for the far corner stops at the edge
    expect(cropRect(landscape, 1, { u: 1, v: 1, zoom: 2 })).toEqual({
      sx: 2500,
      sy: 1500,
      sw: 1500,
      sh: 1500,
    })
  })
})

describe('panCrop / normalizeCrop', () => {
  it('dragging right shows more of the left side, and stops at the edge', () => {
    const moved = panCrop(landscape, 4 / 5, CENTERED, 0.1, 0)
    expect(moved.u).toBeLessThan(0.5)
    const far = panCrop(landscape, 4 / 5, CENTERED, 5, 0)
    expect(cropRect(landscape, 4 / 5, far).sx).toBe(0)
  })

  it('clamps zoom to the allowed range', () => {
    expect(normalizeCrop(landscape, 1, { u: 0.5, v: 0.5, zoom: 10 }).zoom).toBe(3)
  })
})

describe('coverRect', () => {
  it('shows the centred strip a phone would display', () => {
    const wide = { sx: 0, sy: 375, sw: 4000, sh: 2250 }
    const phone = coverRect(wide, 9 / 16)
    expect(phone.sh).toBe(2250)
    expect(phone.sw).toBeCloseTo(1265.625)
    expect(phone.sx).toBeCloseTo((4000 - 1265.625) / 2)
  })
})
