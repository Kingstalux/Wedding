import { useEffect } from 'react'
import { useBlocker } from 'react-router'

/** Asks before leaving the page (another studio page, or closing the tab) with unsaved edits. */
export function useUnsavedChangesWarning(dirty: boolean) {
  const blocker = useBlocker(dirty)

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm('You have unsaved changes. Leave without saving?')) blocker.proceed()
    else blocker.reset()
  }, [blocker])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
}
