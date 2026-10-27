import { useEffect } from 'react'
import { Photo } from '../../components/Photo'
import { Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { fr } from '../../i18n/fr'
import { en } from '../../i18n/en'
import styles from './PersonalPage.module.css'

/**
 * Shown for "/" and for any link that isn't a valid invitation.
 * It reveals nothing about the wedding (no names, dates or places), and
 * repeats the message in the other language in case the guest's phone
 * is set to a language they don't read.
 */
export function PersonalPage() {
  const { t, lang } = useT()
  const other = lang === 'fr' ? en : fr

  useEffect(() => {
    document.title = t('personal.title')
  }, [t])

  return (
    <div className={styles.page}>
      <Photo className={styles.photo} tone="emerald" />
      <main className={styles.body}>
        <h1 className="display h2">{t('personal.title')}</h1>
        <Rule />
        <p className={`serif-body ${styles.text}`}>{t('personal.body')}</p>
        <p
          lang={lang === 'fr' ? 'en' : 'fr'}
          className={`serif-body ${styles.text} ${styles.other}`}
        >
          {other['personal.body']}
        </p>
      </main>
    </div>
  )
}
