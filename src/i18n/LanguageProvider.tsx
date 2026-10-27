import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fill } from '../lib/template'
import type { Lang } from '../lib/time'
import { en, type MessageKey } from './en'
import { fr } from './fr'

const dictionaries = { en, fr }
const STORAGE_KEY = 'wedding-lang'

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Interface text: t('rsvp.lede', { name: 'Ama', date: '10 December 2026' }) */
  t: (key: MessageKey, values?: Record<string, string | number>) => string
  /** Picks the right version of a couple-written text: pick(event.title_en, event.title_fr) */
  pick: (enText: string | null | undefined, frText: string | null | undefined) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

/** The guest's earlier choice, else French if the phone is set to French, else English. */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'fr') return saved
  } catch {
    // Private browsing can block localStorage; fall through to the browser language.
  }
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language]
  return preferred.some((l) => l?.toLowerCase().startsWith('fr')) ? 'fr' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not saved, but the switch still works for this visit.
    }
  }, [])

  // Keep <html lang> in sync so screen readers pronounce the text correctly.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<LanguageContextValue>(() => {
    const dict = dictionaries[lang]
    return {
      lang,
      setLang,
      t: (key, values) => {
        const text = dict[key] ?? en[key] ?? key
        if (!values) return text
        return fill(
          text,
          Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])),
        )
      },
      pick: (enText, frText) => (lang === 'fr' ? frText || enText : enText || frText) ?? '',
    }
  }, [lang, setLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react/only-export-components -- hook belongs with its provider
export function useT(): LanguageContextValue {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useT must be used inside <LanguageProvider>')
  return value
}
