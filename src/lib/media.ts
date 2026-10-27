import { supabase } from './supabase'

export const MEDIA_BUCKET = 'media'

/**
 * The public address of a file in the "media" storage bucket, e.g.
 * "gallery/5f0c….jpg" → "https://<project>.supabase.co/storage/v1/object/public/media/gallery/5f0c….jpg".
 * Returns null when there is no file yet, so components show their placeholder.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}
