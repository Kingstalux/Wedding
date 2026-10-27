import { useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Photo, type PhotoTone } from '../../components/Photo'
import { useToast } from '../../components/Toast'
import { cx } from '../../lib/cx'
import { mediaUrl } from '../../lib/media'
import { removeMedia, uploadAudio, uploadPhoto, type MediaFolder } from '../../lib/upload'
import { studioErrorMessage } from '../queries'
import styles from './MediaField.module.css'

type Props = {
  kind: 'photo' | 'audio'
  folder: MediaFolder
  /** Current storage path, or null when nothing is uploaded yet. */
  path: string | null
  /** Saves the new path (or null to remove). The old file is deleted afterwards. */
  onSave: (path: string | null) => Promise<unknown>
  shape?: 'wide' | 'tall' | 'normal'
  tone?: PhotoTone
  placeholder?: string
}

/**
 * Shows the current photo (or song) with Replace / Remove buttons.
 * Changes are saved straight away, separately from the page's Save button,
 * because the file is uploaded the moment it's chosen.
 */
export function MediaField({
  kind,
  folder,
  path,
  onSave,
  shape = 'normal',
  tone = 'slate',
  placeholder = 'No photo yet',
}: Props) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const url = mediaUrl(path)

  async function replace(file: File) {
    setBusy(true)
    setError(null)
    try {
      const uploaded = kind === 'photo' ? await uploadPhoto(folder, file) : await uploadAudio(file)
      await onSave(uploaded.path)
      await removeMedia(path) // the previous file, now unused
      toast(kind === 'photo' ? 'Photo updated on the site' : 'Song updated on the site')
    } catch (err) {
      setError(studioErrorMessage(err))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove() {
    if (!window.confirm(kind === 'photo' ? 'Remove this photo?' : 'Remove the song?')) return
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
            shape === 'wide' && styles.wide,
            shape === 'tall' && styles.tall,
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
            onChange={(e) => e.target.files?.[0] && replace(e.target.files[0])}
            disabled={busy}
          />
          <Button size="sm" loading={busy} onClick={() => inputRef.current?.click()}>
            {busy
              ? 'Uploading…'
              : url
                ? `Replace ${kind === 'photo' ? 'photo' : 'song'}`
                : 'Upload'}
          </Button>
          {url && !busy && (
            <Button size="sm" variant="ghost" onClick={remove}>
              Remove
            </Button>
          )}
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
