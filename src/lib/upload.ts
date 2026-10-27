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

/** Loads a chosen photo so it can be shown and cropped in the browser. */
export function loadImage(file: Blob): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This photo couldn’t be opened. Please use a JPG or PNG.'))
    }
    img.src = url
  })
}

/**
 * Cuts the chosen rectangle out of the photo and saves it as a JPEG of at most
 * `maxWidth` pixels wide (never enlarged), ready to upload.
 */
export async function renderCrop(
  img: HTMLImageElement,
  rect: { sx: number; sy: number; sw: number; sh: number },
  maxWidth: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const width = Math.round(Math.min(maxWidth, rect.sw))
  const height = Math.round((width * rect.sh) / rect.sw)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85),
  )
  if (!blob) throw new Error('The photo couldn’t be prepared. Please try another one.')
  return { blob, width, height }
}

/** Uploads an already-cropped photo (from the photo editor). */
export async function uploadPhotoBlob(
  folder: MediaFolder,
  photo: { blob: Blob; width: number; height: number },
): Promise<Uploaded> {
  const path = `${folder}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, photo.blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  return { path, width: photo.width, height: photo.height }
}
