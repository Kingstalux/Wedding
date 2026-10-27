import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { IconButton } from '../../components/IconButton'
import { Photo, type PhotoTone } from '../../components/Photo'
import { Eyebrow } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { useInvitation } from '../InvitationProvider'
import styles from './Gallery.module.css'

const tones: PhotoTone[] = ['navy', 'emerald', 'slate', 'forest']

export function Gallery() {
  const { t } = useT()
  const { content } = useInvitation()
  const photos = content.gallery
  const [current, setCurrent] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Open/close the native <dialog>: it traps focus and closes on Escape for us.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (current !== null && !dialog.open) dialog.showModal()
    if (current === null && dialog.open) dialog.close()
  }, [current])

  if (!content.settings.show_gallery || photos.length === 0) return null

  const go = (step: number) =>
    setCurrent((i) => (i === null ? i : (i + step + photos.length) % photos.length))

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') go(-1)
    if (e.key === 'ArrowRight') go(1)
  }

  return (
    <section id="gallery" className={styles.gallery} aria-labelledby="gallery-title">
      <div className="container">
        <div className={styles.head}>
          <Eyebrow>{t('gallery.eyebrow')}</Eyebrow>
          <h2 id="gallery-title" className="display h2">
            {t('gallery.title')}
          </h2>
        </div>

        <ul className={styles.grid}>
          {photos.map((photo, i) => (
            <li key={photo.id}>
              <button
                type="button"
                className={styles.tile}
                aria-label={t('gallery.enlarge', { n: i + 1 })}
                onClick={() => setCurrent(i)}
              >
                <Photo
                  src={photo.url}
                  label={t('gallery.photo', { n: i + 1 })}
                  tone={tones[i % tones.length]}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        className={styles.viewer}
        aria-label={t('gallery.viewer')}
        onClose={() => setCurrent(null)}
        onKeyDown={onKeyDown}
        onClick={(e) => e.target === e.currentTarget && setCurrent(null)}
      >
        {current !== null && (
          <>
            <IconButton
              className={styles.close}
              icon="close"
              label={t('gallery.close')}
              tone="light"
              onClick={() => setCurrent(null)}
              autoFocus
            />
            {photos.length > 1 && (
              <IconButton
                className={styles.prev}
                icon="chevronLeft"
                label={t('gallery.prev')}
                tone="light"
                onClick={() => go(-1)}
              />
            )}
            <Photo
              className={styles.big}
              src={photos[current].url}
              label={t('gallery.photo', { n: current + 1 })}
              tone={tones[current % tones.length]}
              loading="eager"
            />
            {photos.length > 1 && (
              <IconButton
                className={styles.next}
                icon="chevronRight"
                label={t('gallery.next')}
                tone="light"
                onClick={() => go(1)}
              />
            )}
            <p className={styles.count} aria-live="polite">
              {current + 1} / {photos.length}
            </p>
          </>
        )}
      </dialog>
    </section>
  )
}
