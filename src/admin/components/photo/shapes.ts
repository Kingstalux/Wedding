/** The shape each photo is shown in on the site. */
export const PHOTO_SHAPES = {
  hero: { aspect: 16 / 9, maxWidth: 2400 }, // landing photo on computers and tablets
  heroMobile: { aspect: 9 / 16, maxWidth: 1080 }, // optional landing photo for phones held upright
  portrait: { aspect: 4 / 5, maxWidth: 1600 }, // couple photo, gallery
} as const
export type PhotoShape = keyof typeof PHOTO_SHAPES
