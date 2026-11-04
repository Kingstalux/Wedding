import { useEffect } from 'react'
import { Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import styles from './PersonalPage.module.css'

/**
 * Shown for "/" and for any link that isn't a valid invitation.
 * It reveals nothing about the wedding: no names, dates, places or photos.
 */
export function PersonalPage() {
  const { t, lang, setLang } = useT()

  useEffect(() => {
    document.title = t('personal.title')
  }, [t])

  return (
    <div className={`on-dark ${styles.page}`}>
      <nav className={styles.lang} aria-label={t('lang.label')}>
        {(['en', 'fr'] as const).map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={lang === code}
            onClick={() => setLang(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </nav>
      <main className={styles.card}>
        <span className={styles.ornament} aria-hidden="true" />
        <h1 className="display h2">{t('personal.title')}</h1>
        <Rule center />
        <p className={`serif-body ${styles.text}`}>{t('personal.body')}</p>
      </main>
    </div>
  )
}
