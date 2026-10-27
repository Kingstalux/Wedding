import { Button } from '../../components/Button'
import { Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { errorMessageKey } from '../api'

/** The invitation couldn't load (usually no internet). Offers a retry. */
export function LoadErrorScreen({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useT()
  return (
    <main
      className="center"
      style={{ minHeight: '100dvh', display: 'grid', placeContent: 'center', padding: 24 }}
    >
      <h1 className="display h2">{t('error.loadTitle')}</h1>
      <Rule center />
      <p className="serif-body" style={{ maxWidth: 440, margin: '0 auto 28px' }} role="alert">
        {t(errorMessageKey(error))}
      </p>
      <div>
        <Button onClick={retry}>{t('error.retry')}</Button>
      </div>
    </main>
  )
}
