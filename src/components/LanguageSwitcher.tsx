import { SUPPORTED_LANGUAGES, useI18n, type Language } from '../i18n'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()
  return <div className="flex overflow-hidden rounded-lg border border-[#435377] text-xs font-semibold" aria-label={t('language.label')}>
    {SUPPORTED_LANGUAGES.map((option) => <button key={option} type="button" onClick={() => setLanguage(option)} aria-pressed={language === option} className={`cursor-pointer px-2.5 py-1.5 transition ${language === option ? 'bg-[#f2ae49] text-[#172033]' : 'bg-[#0e172a] text-[#aeb9d2] hover:text-white'}`}>{option === 'en' ? t('language.english') : t('language.thai')}</button>)}
  </div>
}
