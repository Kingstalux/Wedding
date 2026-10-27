import {
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { Button } from '../../../components/Button'
import {
  CENTERED,
  MAX_ZOOM,
  MIN_ZOOM,
  cropRect,
  normalizeCrop,
  panCrop,
  rectStyle,
  type Crop,
  type Rect,
  type Size,
} from '../../../lib/crop'
import styles from './Cropper.module.css'

/** Shows a given rectangle of the photo filling a frame of the same shape. */
export function CropPreview({
  url,
  size,
  rect,
  className,
  style,
  children,
}: {
  url: string
  size: Size
  rect: Rect
  className?: string
  style?: CSSProperties
  /** Drawn on top of the photo (e.g. the names, for the landing photo preview). */
  children?: ReactNode
}) {
  return (
    <div
      className={`${styles.frame} ${className ?? ''}`}
      style={{ aspectRatio: `${rect.sw} / ${rect.sh}`, ...style }}
    >
      <img src={url} alt="" style={rectStyle(size, rect)} />
      {children}
    </div>
  )
}

/**
 * The photo inside a frame of the final shape. Drag to move it, use the
 * slider (or the mouse wheel / + and − keys) to zoom. Arrow keys move it too.
 */
export function Cropper({
  url,
  size,
  aspect,
  crop,
  onChange,
}: {
  url: string
  size: Size
  aspect: number
  crop: Crop
  onChange: (crop: Crop) => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const rect = cropRect(size, aspect, crop)

  const zoomTo = (zoom: number) => onChange(normalizeCrop(size, aspect, { ...crop, zoom }))

  function onPointerDown(e: PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY }
  }
  function onPointerMove(e: PointerEvent) {
    if (!drag.current || !frameRef.current) return
    const box = frameRef.current.getBoundingClientRect()
    const dx = (e.clientX - drag.current.x) / box.width
    const dy = (e.clientY - drag.current.y) / box.height
    drag.current = { x: e.clientX, y: e.clientY }
    onChange(panCrop(size, aspect, crop, dx, dy))
  }
  function onKeyDown(e: KeyboardEvent) {
    const step = 0.03
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    }
    if (moves[e.key]) {
      e.preventDefault()
      onChange(panCrop(size, aspect, crop, ...moves[e.key]))
    } else if (e.key === '+' || e.key === '=') zoomTo(crop.zoom + 0.1)
    else if (e.key === '-') zoomTo(crop.zoom - 0.1)
  }

  return (
    <div>
      <div
        ref={frameRef}
        className={`${styles.frame} ${styles.interactive}`}
        // Tall frames (phone photos) are capped so the whole editor fits on screen.
        style={{ aspectRatio: String(aspect), width: `min(100%, calc(60dvh * ${aspect}))` }}
        tabIndex={0}
        role="application"
        aria-label="Photo position. Drag, or use the arrow keys to move it and + or − to zoom."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onWheel={(e) => zoomTo(crop.zoom - e.deltaY * 0.0015)}
        onKeyDown={onKeyDown}
      >
        <img src={url} alt="" style={rectStyle(size, rect)} draggable={false} />
        <div className={styles.grid} aria-hidden="true" />
      </div>
      <div className={styles.controls}>
        <label htmlFor="crop-zoom">Zoom</label>
        <input
          id="crop-zoom"
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={crop.zoom}
          onChange={(e) => zoomTo(Number(e.target.value))}
        />
        <Button size="sm" variant="ghost" onClick={() => onChange(CENTERED)}>
          Reset
        </Button>
      </div>
      <p className={styles.hint}>Drag the photo to choose what stays in the frame.</p>
    </div>
  )
}
