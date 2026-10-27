import { useEffect, useRef, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import styles from './Dialog.module.css'
import { IconButton } from './IconButton'

/**
 * A modal window using the browser's <dialog>: it keeps keyboard focus
 * inside, closes on Escape, and puts focus back where it was afterwards.
 */
export function Dialog({
  open,
  title,
  onClose,
  wide,
  locked,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  wide?: boolean
  /** While true (e.g. during an upload), Escape and the close button do nothing. */
  locked?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, wide && styles.wide)}
      aria-label={title}
      onCancel={(e) => locked && e.preventDefault()}
      onClose={onClose}
    >
      {open && (
        <>
          <div className={styles.head}>
            <h2>{title}</h2>
            <IconButton icon="close" size="sm" label="Close" onClick={onClose} disabled={locked} />
          </div>
          <div className={styles.body}>{children}</div>
        </>
      )}
    </dialog>
  )
}

/** Buttons row at the bottom of a dialog. */
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}
