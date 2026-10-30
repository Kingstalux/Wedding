import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import { Button } from '../components/Button'
import { Rule } from '../components/Typography'
import { useT } from '../i18n/LanguageProvider'

/**
 * Shown instead of a blank screen when a page crashes, or when a part of the
 * site can't be downloaded (e.g. after we deploy an update while the page was
 * open). Reloading fetches the latest version, which fixes both cases.
 */
export function ErrorPage() {
  const { t } = useT()
  const error = useRouteError()

  useEffect(() => {
    console.error(error)
    document.title = t('error.crashTitle')
  }, [error, t])

  return (
    <main
      className="center"
      style={{ minHeight: '100dvh', display: 'grid', placeContent: 'center', padding: 24 }}
    >
      <h1 className="display h2">{t('error.crashTitle')}</h1>
      <Rule center />
      <p className="serif-body" style={{ maxWidth: 440, margin: '0 auto 28px' }} role="alert">
        {t('error.crashBody')}
      </p>
      <div>
        <Button onClick={() => window.location.reload()}>{t('error.reload')}</Button>
      </div>
    </main>
  )
}
