import { useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { useConfirm } from '../../components/Confirm'
import { Photo, type PhotoTone } from '../../components/Photo'
import { useToast } from '../../components/Toast'
import { cx } from '../../lib/cx'
import { mediaUrl } from '../../lib/media'
import { removeMedia, uploadAudio, uploadPhotoBlob, type MediaFolder } from '../../lib/upload'
import { studioErrorMessage } from '../queries'
import styles from './MediaField.module.css'
import { PhotoEditorDialog } from './photo/PhotoEditorDialog'
import type { PhotoShape } from './photo/shapes'

type Props = {
  kind: 'photo' | 'audio'
  folder: MediaFolder
  /** Current storage path, or null when nothing is uploaded yet. */
  path: string | null
  /** Saves the new path (or null to remove). The old file is deleted afterwards. */
  onSave: (path: string | null) => Promise<unknown>
  /** The shape the photo has on the site; the editor crops to it. */
  shape?: PhotoShape
  /** Names shown on the landing-photo previews. */
  names?: { bride: string; groom: string }
  /** Offer "Use the landing photo": re-crop another stored photo for this field. */
  copyFrom?: { path: string | null; label: string }
  tone?: PhotoTone
  placeholder?: string
}

/**
 * Shows the current photo (or song) with Replace / Remove buttons.
 * A new photo opens the photo editor first (crop, zoom, previews); it's
 * uploaded and goes live only when the couple presses "Save photo".
 */
export function MediaField({
  kind,
  folder,
  path,
  onSave,
  shape = 'portrait',
  names,
  copyFrom,
  tone = 'slate',
  placeholder = 'No photo yet',
}: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<File | null>(null)
  const url = mediaUrl(path)

  function chosen(file: File) {
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    if (kind === 'photo') setEditing(file)
    else saveSong(file)
  }

  /** Loads an already-uploaded photo into the editor, to crop it differently. */
  async function editStored(storedPath: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(mediaUrl(storedPath)!)
      if (!res.ok) throw new Error('The photo couldn’t be loaded.')
      const blob = await res.blob()
      setEditing(new File([blob], 'landing-photo.jpg', { type: blob.type || 'image/jpeg' }))
    } catch (err) {
      setError(studioErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  /** Called by the photo editor with the cropped photo. */
  async function savePhoto(photo: { blob: Blob; width: number; height: number }) {
    const uploaded = await uploadPhotoBlob(folder, photo)
    await onSave(uploaded.path)
    await removeMedia(path) // the previous file, now unused
    setEditing(null)
    toast('Photo updated on the site')
  }

  async function saveSong(file: File) {
    setBusy(true)
    try {
      const uploaded = await uploadAudio(file)
      await onSave(uploaded.path)
      await removeMedia(path)
      toast('Song updated on the site')
    } catch (err) {
      setError(studioErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    const ok = await confirm({
      title: kind === 'photo' ? 'Remove this photo?' : 'Remove the song?',
      message: 'It disappears from the site straight away.',
      confirmLabel: 'Remove',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await onSave(null)
      await removeMedia(path)
      toast('Removed')
    } catch (err) {
      setError(studioErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.field}>
      {kind === 'photo' ? (
        <Photo
          className={cx(
            styles.preview,
            shape === 'hero' ? styles.wide : shape === 'heroMobile' ? styles.phone : styles.tall,
          )}
          src={url}
          label={placeholder}
          tone={tone}
          loading="eager"
        />
      ) : url ? (
        <audio className={styles.audio} src={url} controls preload="none" />
      ) : (
        <p className="muted">No song uploaded yet.</p>
      )}

      <div className={styles.body}>
        <div className={styles.buttons}>
          {/* A real file input, visually hidden, opened by the button below */}
          <input
            ref={inputRef}
            aria-label={kind === 'photo' ? 'Choose a photo' : 'Choose a song'}
            className="sr-only"
            type="file"
            accept={kind === 'photo' ? 'image/jpeg,image/png,image/webp' : 'audio/*'}
            onChange={(e) => e.target.files?.[0] && chosen(e.target.files[0])}
            disabled={busy}
          />
          <Button size="sm" loading={busy} onClick={() => inputRef.current?.click()}>
            {busy
              ? 'Uploading…'
              : url
                ? `Replace ${kind === 'photo' ? 'photo' : 'song'}`
                : 'Upload'}
          </Button>
          {copyFrom?.path && !busy && (
            <Button size="sm" variant="ghost" onClick={() => editStored(copyFrom.path!)}>
              {copyFrom.label}
            </Button>
          )}
          {url && !busy && (
            <Button size="sm" variant="ghost" onClick={remove}>
              Remove
            </Button>
          )}
        </div>
        {kind === 'photo' && (
          <p className={styles.hint}>You’ll be able to crop and preview it before it’s saved.</p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      {editing && (
        <PhotoEditorDialog
          file={editing}
          shape={shape}
          names={names}
          onCancel={() => setEditing(null)}
          onSave={savePhoto}
        />
      )}
    </div>
  )
}
