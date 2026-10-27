/*
 * Photo cropping maths for the studio's photo editor.
 *
 * A crop is stored independently of screen size:
 *   u, v  = the centre of the crop, as a fraction of the photo's width/height
 *   zoom  = 1 shows the largest area that fits the frame's shape; 3 = 3× closer
 * From that and the frame's aspect ratio we get the exact rectangle of the
 * original photo to keep (in original pixels).
 */

export type Crop = { u: number; v: number; zoom: number }
export type Size = { w: number; h: number }
/** A rectangle of the original photo, in its own pixels. */
export type Rect = { sx: number; sy: number; sw: number; sh: number }

export const MIN_ZOOM = 1
export const MAX_ZOOM = 3
export const CENTERED: Crop = { u: 0.5, v: 0.5, zoom: 1 }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** The part of the photo kept for a frame of `aspect` (width / height). */
export function cropRect(img: Size, aspect: number, crop: Crop): Rect {
  const zoom = clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM)
  const sw = Math.min(img.w, img.h * aspect) / zoom
  const sh = sw / aspect
  const cx = clamp(crop.u * img.w, sw / 2, img.w - sw / 2)
  const cy = clamp(crop.v * img.h, sh / 2, img.h - sh / 2)
  return { sx: cx - sw / 2, sy: cy - sh / 2, sw, sh }
}

/** The same crop with its centre pulled back inside the photo (so dragging stops at the edges). */
export function normalizeCrop(img: Size, aspect: number, crop: Crop): Crop {
  const zoom = clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM)
  const r = cropRect(img, aspect, { ...crop, zoom })
  return { u: (r.sx + r.sw / 2) / img.w, v: (r.sy + r.sh / 2) / img.h, zoom }
}

/**
 * Moves the crop when the photo is dragged. dx, dy are the drag distance as a
 * fraction of the frame's width and height (dragging right reveals more on the left).
 */
export function panCrop(img: Size, aspect: number, crop: Crop, dx: number, dy: number): Crop {
  const r = cropRect(img, aspect, crop)
  return normalizeCrop(img, aspect, {
    ...crop,
    u: (r.sx + r.sw / 2 - dx * r.sw) / img.w,
    v: (r.sy + r.sh / 2 - dy * r.sh) / img.h,
  })
}

/**
 * The centred part of `rect` that a frame of another shape shows with
 * object-fit: cover. Used to preview the landing photo on a phone.
 */
export function coverRect(rect: Rect, aspect: number): Rect {
  const rectAspect = rect.sw / rect.sh
  if (aspect < rectAspect) {
    const sw = rect.sh * aspect
    return { sx: rect.sx + (rect.sw - sw) / 2, sy: rect.sy, sw, sh: rect.sh }
  }
  const sh = rect.sw / aspect
  return { sx: rect.sx, sy: rect.sy + (rect.sh - sh) / 2, sw: rect.sw, sh }
}

/**
 * CSS that shows `rect` of the photo filling a frame of the same shape:
 * an absolutely positioned <img> inside a frame with overflow: hidden.
 * Percentages keep it right at any frame size.
 */
export function rectStyle(img: Size, rect: Rect) {
  return {
    width: `${(img.w / rect.sw) * 100}%`,
    left: `${(-rect.sx / rect.sw) * 100}%`,
    top: `${(-rect.sy / rect.sh) * 100}%`,
  }
}
