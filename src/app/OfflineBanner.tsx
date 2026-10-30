import { useSyncExternalStore } from 'react'
import { useT } from '../i18n/LanguageProvider'
import styles from './OfflineBanner.module.css'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** A small bar at the bottom of the screen while the device has no connection. */
export function OfflineBanner() {
  const { t } = useT()
  const online = useSyncExternalStore(subscribe, () => navigator.onLine)
  if (online) return null
  return (
    <div className={styles.banner} role="status">
      {t('offline.banner')}
    </div>
  )
}
