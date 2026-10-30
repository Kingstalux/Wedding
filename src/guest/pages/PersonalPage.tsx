import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Photo } from '../../components/Photo'
import { Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { mediaUrl } from '../../lib/media'
import { supabase } from '../../lib/supabase'
import styles from './PersonalPage.module.css'

/**
 * Shown for "/" and for any link that isn't a valid invitation.
 * Besides the couple photo (get_cover_photo), it reveals nothing about the
 * wedding: no names, dates or places.
 */
export function PersonalPage() {
  const { t, lang, setLang } = useT()

  const cover = useQuery({
    queryKey: ['cover-photo'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase.rpc('get_cover_photo')
      return mediaUrl(data)
    },
  })

  useEffect(() => {
    document.title = t('personal.title')
  }, [t])

  return (
    <div className={styles.page}>
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
      <Photo className={styles.photo} src={cover.data} tone="emerald" loading="eager" />
      <main className={styles.body}>
        <h1 className="display h2">{t('personal.title')}</h1>
        <Rule />
        <p className={`serif-body ${styles.text}`}>{t('personal.body')}</p>
      </main>
    </div>
  )
}
