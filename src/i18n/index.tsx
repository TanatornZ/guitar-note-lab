import { useEffect, type ReactNode } from 'react'
import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import { en, type TranslationKey } from './locales/en'
import { th } from './locales/th'

export const SUPPORTED_LANGUAGES = ['en', 'th'] as const
export type Language = typeof SUPPORTED_LANGUAGES[number]
export type { TranslationKey }

type Variables = Record<string, string | number>
export type Translate = (key: TranslationKey, variables?: Variables) => string

const LANGUAGE_STORAGE_KEY = 'chord-canvas-language'

function preferredLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (saved === 'en' || saved === 'th') return saved
  return window.navigator.language.toLowerCase().startsWith('th') ? 'th' : 'en'
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      th: { translation: th },
    },
    lng: preferredLanguage(),
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    keySeparator: false,
  })

export function translate(language: Language, key: TranslationKey, variables: Variables = {}): string {
  return String(i18n.getFixedT(language)(key, variables))
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { i18n: instance } = useTranslation()
  useEffect(() => {
    const language = instance.resolvedLanguage as Language
    document.documentElement.lang = language
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [instance, instance.resolvedLanguage])
  return <>{children}</>
}

export function useI18n(): { language: Language; setLanguage: (language: Language) => void; t: Translate } {
  const { i18n: instance, t: translateKey } = useTranslation()
  const language = (instance.resolvedLanguage ?? instance.language) as Language
  return {
    language,
    setLanguage: (nextLanguage) => { void instance.changeLanguage(nextLanguage) },
    t: (key, variables) => String(translateKey(key, variables)),
  }
}
