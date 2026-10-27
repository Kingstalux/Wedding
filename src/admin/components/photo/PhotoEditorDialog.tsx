import { useEffect, useState } from 'react'
import { Button } from '../../../components/Button'
import { Dialog, DialogActions } from '../../../components/Dialog'
import { CENTERED, coverRect, cropRect, type Crop, type Size } from '../../../lib/crop'
import { loadImage, renderCrop } from '../../../lib/upload'
import { studioErrorMessage } from '../../queries'
import { CropPreview, Cropper } from './Cropper'
import { PHOTO_SHAPES, type PhotoShape } from './shapes'
import styles from './PhotoEditor.module.css'

type Loaded = { url: string; img: HTMLImageElement; size: Size }

/**
 * Choose what part of a new photo to keep, see how it will look on the site,
 * then save. Nothing is uploaded until "Save photo".
 */
export function PhotoEditorDialog({
  file,
  shape,
  names,
  onCancel,
  onSave,
}: {
  file: File
  shape: PhotoShape
  /** Shown on the landing photo previews. */
  names?: { bride: string; groom: string }
  onCancel: () => void
  onSave: (photo: { blob: Blob; width: number; height: number }) => Promise<void>
}) {
  const { aspect, maxWidth } = PHOTO_SHAPES[shape]
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [crop, setCrop] = useState<Crop>(CENTERED)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let url = ''
    loadImage(file)
      .then(({ img, url: u }) => {
        url = u
        setLoaded({ url: u, img, size: { w: img.naturalWidth, h: img.naturalHeight } })
      })
      .catch((err) => setError(err.message))
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [file])

  async function save() {
    if (!loaded) return
    setSaving(true)
    setError(null)
    try {
      await onSave(await renderCrop(loaded.img, cropRect(loaded.size, aspect, crop), maxWidth))
    } catch (err) {
      setError(studioErrorMessage(err))
      setSaving(false)
    }
  }

  const rect = loaded ? cropRect(loaded.size, aspect, crop) : null
  const small = loaded && Math.min(loaded.size.w, loaded.size.h) < 800

  return (
    <Dialog open title="Adjust the photo" wide locked={saving} onClose={onCancel}>
      {!loaded && !error && <p className="muted">Opening the photo…</p>}

      {loaded && rect && (
        <div className={styles.layout}>
          <Cropper
            url={loaded.url}
            size={loaded.size}
            aspect={aspect}
            crop={crop}
            onChange={setCrop}
          />

          <div className={styles.previews}>
            {shape === 'hero' ? (
              <div>
                <p className={styles.previewLabel}>On a computer · on a phone</p>
                <div className={styles.devices}>
                  <CropPreview
                    url={loaded.url}
                    size={loaded.size}
                    rect={rect}
                    className={styles.desktop}
                  >
                    <HeroText names={names} />
                  </CropPreview>
                  <CropPreview
                    url={loaded.url}
                    size={loaded.size}
                    rect={coverRect(rect, 9 / 16)}
                    className={styles.phone}
                  >
                    <HeroText names={names} />
                  </CropPreview>
                </div>
                <p className={styles.note}>
                  On phones the middle of the photo is shown, so keep faces near the centre.
                </p>
              </div>
            ) : (
              <div>
                <p className={styles.previewLabel}>On the site</p>
                <CropPreview
                  url={loaded.url}
                  size={loaded.size}
                  rect={rect}
                  className={styles.portrait}
                />
              </div>
            )}
            {small && (
              <p className={styles.note}>
                This photo is quite small, so it may look soft on large screens.
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <DialogActions>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={save} loading={saving} disabled={!loaded}>
          {saving ? 'Saving…' : 'Save photo'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function HeroText({ names }: { names?: { bride: string; groom: string } }) {
  return (
    <div className={styles.heroText} aria-hidden="true">
      <span>{names?.bride || 'Bride'}</span>
      <em>and</em>
      <span>{names?.groom || 'Groom'}</span>
    </div>
  )
}
