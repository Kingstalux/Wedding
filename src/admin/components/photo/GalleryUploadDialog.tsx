import { useEffect, useState } from 'react'
import { Button } from '../../../components/Button'
import { Dialog, DialogActions } from '../../../components/Dialog'
import { IconButton } from '../../../components/IconButton'
import { CENTERED, cropRect, type Crop, type Size } from '../../../lib/crop'
import { loadImage, renderCrop } from '../../../lib/upload'
import { CropPreview, Cropper } from './Cropper'
import { PHOTO_SHAPES } from './shapes'
import styles from './PhotoEditor.module.css'

type Item = { id: string; name: string; url: string; img: HTMLImageElement; size: Size; crop: Crop }
export type PreparedPhoto = { name: string; blob: Blob; width: number; height: number }

/**
 * Several new gallery photos at once: crop each one, put them in order and
 * drop any you don't want, then upload them all. Nothing is uploaded before
 * "Add to gallery".
 */
export function GalleryUploadDialog({
  files,
  onCancel,
  onUpload,
}: {
  files: File[]
  onCancel: () => void
  /** Uploads the prepared photos in order; reports progress through `onProgress`. */
  onUpload: (photos: PreparedPhoto[], onProgress: (done: number) => void) => Promise<void>
}) {
  const { aspect, maxWidth } = PHOTO_SHAPES.portrait
  const [items, setItems] = useState<Item[]>([])
  const [selected, setSelected] = useState(0)
  const [problems, setProblems] = useState<string[]>([])
  const [progress, setProgress] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const urls: string[] = []
    Promise.allSettled(files.map((f) => loadImage(f))).then((results) => {
      if (cancelled) return
      const ok: Item[] = []
      const bad: string[] = []
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          urls.push(r.value.url)
          ok.push({
            id: `${i}-${files[i].name}`,
            name: files[i].name,
            url: r.value.url,
            img: r.value.img,
            size: { w: r.value.img.naturalWidth, h: r.value.img.naturalHeight },
            crop: CENTERED,
          })
        } else bad.push(`${files[i].name} couldn’t be opened (use JPG or PNG).`)
      })
      setItems(ok)
      setProblems(bad)
    })
    return () => {
      cancelled = true
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [files])

  const current = items[selected]
  const busy = progress !== null

  const move = (from: number, to: number) => {
    setItems((list) => {
      const next = [...list]
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })
    setSelected(to)
  }
  const remove = (index: number) => {
    setItems((list) => list.filter((_, i) => i !== index))
    setSelected((s) => Math.max(0, s > index ? s - 1 : Math.min(s, items.length - 2)))
  }

  async function upload() {
    setProgress(0)
    const prepared: PreparedPhoto[] = []
    for (const item of items) {
      const photo = await renderCrop(item.img, cropRect(item.size, aspect, item.crop), maxWidth)
      prepared.push({ name: item.name, ...photo })
    }
    await onUpload(prepared, setProgress)
  }

  return (
    <Dialog
      open
      title={`Add ${items.length || ''} photo${items.length === 1 ? '' : 's'}`}
      wide
      locked={busy}
      onClose={onCancel}
    >
      {items.length === 0 && problems.length === 0 && <p className="muted">Opening the photos…</p>}

      {current && (
        <div className={styles.layout}>
          <Cropper
            url={current.url}
            size={current.size}
            aspect={aspect}
            crop={current.crop}
            onChange={(crop) =>
              setItems((list) => list.map((it, i) => (i === selected ? { ...it, crop } : it)))
            }
          />
          <div className={styles.previews}>
            <p className={styles.previewLabel}>Order in the gallery · click one to adjust it</p>
            <ol className={styles.batch}>
              {items.map((item, i) => (
                <li key={item.id} className={styles.item} aria-current={i === selected}>
                  <button
                    type="button"
                    className={styles.thumb}
                    onClick={() => setSelected(i)}
                    aria-label={`Adjust photo ${i + 1}`}
                  >
                    <CropPreview
                      url={item.url}
                      size={item.size}
                      rect={cropRect(item.size, aspect, item.crop)}
                    />
                  </button>
                  <div className={styles.itemTools}>
                    <span>{i + 1}</span>
                    <div>
                      <IconButton
                        icon="chevronLeft"
                        size="sm"
                        label={`Move photo ${i + 1} earlier`}
                        disabled={i === 0 || busy}
                        onClick={() => move(i, i - 1)}
                      />
                      <IconButton
                        icon="chevronRight"
                        size="sm"
                        label={`Move photo ${i + 1} later`}
                        disabled={i === items.length - 1 || busy}
                        onClick={() => move(i, i + 1)}
                      />
                      <IconButton
                        icon="trash"
                        size="sm"
                        label={`Leave out photo ${i + 1}`}
                        disabled={busy}
                        onClick={() => remove(i)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {problems.map((p) => (
        <p key={p} role="alert" className={styles.error}>
          {p}
        </p>
      ))}

      <DialogActions>
        {busy && (
          <span className={styles.progress} role="status">
            Uploading {Math.min((progress ?? 0) + 1, items.length)} of {items.length}…
          </span>
        )}
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={upload} loading={busy} disabled={!items.length}>
          Add {items.length} to gallery
        </Button>
      </DialogActions>
    </Dialog>
  )
}
