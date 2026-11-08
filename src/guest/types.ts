import type { Lang } from '../lib/time'

/*
 * The data the guest site needs, as returned by get_invitation (see api.ts).
 * Field names match the database columns (snake_case). Image/audio fields
 * here are full URLs; the database stores storage paths and api.ts turns
 * them into URLs.
 */

export type Settings = {
  bride: string
  groom: string
  city: string
  countdown_at: string
  rsvp_deadline: string | null
  hero_url: string | null
  /** Optional upright version of the landing photo for phones. */
  hero_mobile_url: string | null
  /** Which side the names sit on over the landing photo (computers). */
  hero_text_side: 'left' | 'right'
  word_en: string
  word_fr: string
  show_word: boolean
  dress_en: string
  dress_fr: string
  show_dress: boolean
  show_gallery: boolean
  show_wishes: boolean
  show_gifts: boolean
  momo_number: string | null
  momo_name: string | null
  om_number: string | null
  om_name: string | null
  show_gift_box: boolean
  gift_box_note_en: string
  gift_box_note_fr: string
  music_url: string | null
  music_title: string | null
  /** Seating: how many tables, and whether guests see theirs. */
  table_count: number
  table_capacity: number
  show_tables: boolean
}

export type WeddingEvent = {
  id: string
  title_en: string
  title_fr: string
  starts_at: string
  ends_at: string | null
  venue: string
  maps_url: string | null
}

export type GalleryPhoto = {
  id: string
  url: string | null
  width?: number | null
  height?: number | null
}

/** Readable by anyone: the same for every guest. */
export type PublicContent = {
  settings: Settings
  events: WeddingEvent[]
  gallery: GalleryPhoto[]
}

export type Rsvp = {
  attending: boolean
}

export type Wish = {
  id: string
  author: string
  message: string
  created_at: string
  /** True for the current guest's own messages (they may delete them). */
  mine: boolean
}

/** Private to one guest, loaded with their token. */
export type Invitation = {
  name: string
  /** Set when the invitation is for a couple. */
  partner_name: string | null
  /** 1, or 2 for a couple. */
  seats: 1 | 2
  /** The guest's table once they have accepted and been seated. */
  table_no: number | null
  lang: Lang | null
  pass_code: string
  rsvp: Rsvp | null
  wishes: Wish[]
}
