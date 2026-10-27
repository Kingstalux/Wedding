import { useT } from '../../i18n/LanguageProvider'

/** Shown while an invitation loads. Emerald like the opening screen, so there's no flash. */
export function LoadingScreen() {
  const { t } = useT()
  return (
    <div
      role="status"
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--primary)',
        color: 'var(--on-dark-soft)',
        fontSize: 12,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
      }}
    >
      {t('common.loading')}
    </div>
  )
}
