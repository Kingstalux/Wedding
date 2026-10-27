import imageCompression from 'browser-image-compression'
import { MEDIA_BUCKET } from './media'
import { supabase } from './supabase'

/*
 * Uploads to the "media" storage bucket (only the couple's account may).
 * Photos are shrunk in the browser first: a 6 MB phone photo becomes about
 * 400 KB, so guests on mobile data load the page quickly.
 */

export type MediaFolder = 'hero' | 'word' | 'gallery' | 'music'

const MAX_AUDIO_BYTES = 15 * 1024 * 1024

export type Uploaded = { path: string; width?: number; height?: number }

/** Width and height of an image file, read in the browser. */
async function imageSize(file: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const size = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return size
}

export async function uploadPhoto(folder: MediaFolder, file: File): Promise<Uploaded> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo (JPG, PNG or WebP).')
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 2000,
    maxSizeMB: 0.5,
    fileType: 'image/jpeg',
    initialQuality: 0.82,
    useWebWorker: true,
  })
  const { width, height } = await imageSize(compressed)
  // A random name: nobody can guess the address, and replacing a photo never
  // shows an old cached copy.
  const path = `${folder}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, compressed, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  return { path, width, height }
}

export async function uploadAudio(file: File): Promise<Uploaded> {
  if (!file.type.startsWith('audio/')) throw new Error('Please choose an audio file (MP3 or M4A).')
  if (file.size > MAX_AUDIO_BYTES)
    throw new Error('The song is larger than 15 MB. Please use an MP3.')
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3'
  const path = `music/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  return { path }
}

/** Removes a file that's no longer used. Failures are ignored (an orphan file is harmless). */
export async function removeMedia(path: string | null | undefined): Promise<void> {
  if (!path) return
  await supabase.storage.from(MEDIA_BUCKET).remove([path])
}
