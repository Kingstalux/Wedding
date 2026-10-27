import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import styles from './Toast.module.css'

type Kind = 'success' | 'error'
type ToastItem = { id: number; message: string; kind: Kind }
type ShowToast = (message: string, kind?: Kind) => void

const ToastContext = createContext<ShowToast | null>(null)

/**
 * Short confirmation messages ("Saved", "Link copied").
 * Wrap the app once in <ToastProvider>, then call useToast() anywhere.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const show = useCallback<ShowToast>((message, kind = 'success') => {
    const id = Date.now() + Math.random()
    setItems((list) => [...list, { id, message, kind }])
    setTimeout(
      () => setItems((list) => list.filter((t) => t.id !== id)),
      kind === 'error' ? 5000 : 2500,
    )
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* role="status" makes screen readers announce new messages politely */}
      <div className={styles.region} role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx(styles.toast, styles[t.kind])}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components -- hook belongs with its provider
export function useToast(): ShowToast {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
