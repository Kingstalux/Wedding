import { Button } from '../../components/Button'
import styles from '../studio.module.css'
import { useUnsavedChangesWarning } from './useUnsavedChangesWarning'

/** Sticky bar at the bottom of an editable page. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  label = 'Save changes',
}: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  onDiscard: () => void
  label?: string
}) {
  useUnsavedChangesWarning(dirty)
  return (
    <div className={styles.saveBar}>
      <p className={dirty ? styles.dirty : undefined} role="status">
        {dirty
          ? 'You have unsaved changes.'
          : 'All changes saved · they go live as soon as you save.'}
      </p>
      <div className={styles.row}>
        {dirty && (
          <Button variant="ghost" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
        )}
        <Button onClick={onSave} loading={saving} disabled={!dirty}>
          {label}
        </Button>
      </div>
    </div>
  )
}
