import { useEffect } from 'react'
import { useBlocker } from 'react-router'
import { useConfirm } from '../../components/Confirm'

/** Asks before leaving the page (another studio page, or closing the tab) with unsaved edits. */
export function useUnsavedChangesWarning(dirty: boolean) {
  const blocker = useBlocker(dirty)
  const confirm = useConfirm()

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    confirm({
      title: 'Leave without saving?',
      message: 'You have unsaved changes on this page. They will be lost.',
      confirmLabel: 'Leave',
      cancelLabel: 'Stay',
      danger: true,
    }).then((leave) => (leave ? blocker.proceed() : blocker.reset()))
  }, [blocker, confirm])

  // Closing or reloading the tab: browsers only allow their own built-in prompt here.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
}
