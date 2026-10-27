import { useEffect } from 'react'
import { Photo } from '../../components/Photo'
import { Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import styles from './PersonalPage.module.css'

/**
 * Shown for "/" and for any link that isn't a valid invitation.
 * It reveals nothing about the wedding (no names, dates or places).
 * The message is shown once, in the chosen language, with an EN/FR switch.
 */
export function PersonalPage() {
  const { t, lang, setLang } = useT()

  useEffect(() => {
    document.title = t('personal.title')
  }, [t])

  return (
    <div className={styles.page}>
      <Photo className={styles.photo} tone="emerald" />
      <main className={styles.body}>
        <div className={styles.lang} role="group" aria-label={t('lang.label')}>
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
        </div>
        <h1 className="display h2">{t('personal.title')}</h1>
        <Rule />
        <p className={`serif-body ${styles.text}`}>{t('personal.body')}</p>
      </main>
    </div>
  )
}
