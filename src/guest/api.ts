import type { MessageKey } from '../i18n/en'
import { mediaUrl } from '../lib/media'
import { supabase } from '../lib/supabase'
import type { Lang } from '../lib/time'
import type {
  GalleryPhoto,
  GiftAnnouncement,
  Invitation,
  PublicContent,
  Rsvp,
  Settings,
  WeddingEvent,
  Wish,
} from './types'

/*
 * Every call the guest site makes to Supabase. Guests never touch tables
 * directly: each call is a database function (rpc) that checks the token.
 */

// ---------- Shapes returned by the database functions -----------------------

type RawSettings = Omit<Settings, 'hero_url' | 'word_photo_url' | 'music_url'> & {
  hero_path: string | null
  word_photo_path: string | null
  music_path: string | null
}

type RawInvitation = {
  guest: { name: string; lang: Lang | null; pass_code: string }
  rsvp: Rsvp | null
  wishes: Wish[]
  settings: RawSettings
  events: WeddingEvent[]
  gallery: Array<{ id: string; path: string; width: number | null; height: number | null }>
}

export type LoadedInvitation = { content: PublicContent; invitation: Invitation }

/** Storage paths → full image/audio addresses; guest name → first name. */
function fromRaw(raw: RawInvitation): LoadedInvitation {
  const { hero_path, word_photo_path, music_path, ...settings } = raw.settings
  const gallery: GalleryPhoto[] = raw.gallery.map((p) => ({
    id: p.id,
    url: mediaUrl(p.path),
    width: p.width,
    height: p.height,
  }))
  return {
    content: {
      settings: {
        ...settings,
        // Until the couple enters their names in the studio
        bride: settings.bride.trim() || 'Bride',
        groom: settings.groom.trim() || 'Groom',
        hero_url: mediaUrl(hero_path),
        word_photo_url: mediaUrl(word_photo_path),
        music_url: mediaUrl(music_path),
      },
      events: raw.events,
      gallery,
    },
    invitation: {
      name: raw.guest.name,
      first_name: raw.guest.name.trim().split(/\s+/)[0] ?? raw.guest.name,
      lang: raw.guest.lang,
      pass_code: raw.guest.pass_code,
      rsvp: raw.rsvp,
      wishes: raw.wishes,
    },
  }
}

// ---------- Errors -----------------------------------------------------------

/** The short codes our SQL functions raise, plus network/unknown problems. */
const KNOWN_ERRORS = [
  'invalid_token',
  'rsvp_closed',
  'answer_required',
  'links_not_allowed',
  'message_length',
  'rate_limited',
  'invalid_amount',
  'method_required',
] as const

export class GuestError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}

function fail(error: { message: string } | null): never {
  const code = KNOWN_ERRORS.find((c) => error?.message === c) ?? 'generic'
  throw new GuestError(code)
}

/** The translation key for any error thrown by these calls. */
export function errorMessageKey(err: unknown): MessageKey {
  if (err instanceof GuestError && err.code !== 'generic') return `error.${err.code}` as MessageKey
  if (err instanceof TypeError) return 'error.network' // fetch failed: offline
  return 'error.generic'
}

// ---------- Calls --------------------------------------------------------------

/** null = unknown or removed token. `preview` = the couple viewing from the studio. */
export async function loadInvitation(
  token: string,
  preview = false,
): Promise<LoadedInvitation | null> {
  const { data, error } = await supabase.rpc('get_invitation', {
    p_token: token,
    p_preview: preview,
  })
  if (error) fail(error)
  return data ? fromRaw(data as unknown as RawInvitation) : null
}

export async function submitRsvp(token: string, rsvp: Rsvp): Promise<Rsvp> {
  const { data, error } = await supabase.rpc('submit_rsvp', {
    p_token: token,
    p_attending: rsvp.attending,
    p_diet: rsvp.diet,
    p_note: rsvp.note,
  })
  if (error) fail(error)
  return data as unknown as Rsvp
}

export async function postWish(token: string, message: string): Promise<Wish> {
  const { data, error } = await supabase.rpc('post_wish', { p_token: token, p_message: message })
  if (error) fail(error)
  return data as unknown as Wish
}

export async function deleteWish(token: string, wishId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_own_wish', { p_token: token, p_wish_id: wishId })
  if (error) fail(error)
}

export async function announceGift(token: string, gift: GiftAnnouncement): Promise<void> {
  const { error } = await supabase.rpc('announce_gift', {
    p_token: token,
    p_method: gift.method,
    p_amount: gift.amount_fcfa ?? undefined,
    p_message: gift.message,
  })
  if (error) fail(error)
}

export async function setLanguage(token: string, lang: Lang): Promise<void> {
  const { error } = await supabase.rpc('set_language', { p_token: token, p_lang: lang })
  if (error) fail(error)
}

export type PassStatus = { first_name: string; attending: boolean | null; checked_in: boolean }

/** What the door sees for a scanned pass; null = no such pass. */
export async function readPass(code: string): Promise<PassStatus | null> {
  const { data, error } = await supabase.rpc('read_pass', { p_code: code })
  if (error) fail(error)
  return (data as unknown as PassStatus | null) ?? null
}
