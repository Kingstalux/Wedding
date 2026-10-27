import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import { Dialog, DialogActions } from './Dialog'

/*
 * A styled replacement for window.confirm():
 *
 *   const confirm = useConfirm()
 *   if (await confirm({ title: 'Delete this photo?', confirmLabel: 'Delete', danger: true })) …
 *
 * It returns a promise that resolves to true (confirmed) or false (cancelled,
 * Escape, or closed), so it reads like the browser's version.
 */

export type ConfirmOptions = {
  title: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Destructive action: the confirm button is styled as a warning. */
  danger?: boolean
}

type Ask = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<Ask | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((answer: boolean) => void) | null>(null)

  const ask = useCallback<Ask>((next) => {
    resolver.current?.(false) // a new question cancels any open one
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const answer = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <Dialog open={Boolean(options)} title={options?.title ?? ''} onClose={() => answer(false)}>
        {options?.message && <div className="muted">{options.message}</div>}
        <DialogActions>
          <Button variant="ghost" onClick={() => answer(false)}>
            {options?.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            variant={options?.danger ? 'destructive' : 'primary'}
            onClick={() => answer(true)}
            autoFocus
          >
            {options?.confirmLabel ?? 'OK'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components -- hook belongs with its provider
export function useConfirm(): Ask {
  const ask = useContext(ConfirmContext)
  if (!ask) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ask
}
