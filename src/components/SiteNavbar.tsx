import { LanguageSwitcher } from './LanguageSwitcher'
import { useI18n } from '../i18n'

type Page = 'studio' | 'finder'

interface SiteNavbarProps {
  activePage: Page
}

export function SiteNavbar({ activePage }: SiteNavbarProps) {
  const { t } = useI18n()
  const linkClass = (page: Page) => `rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${activePage === page
    ? 'border-[#d89233] bg-[#f2ae4918] text-[#f2ae49]'
    : 'border-transparent text-[#aeb9d2] hover:border-[#435377] hover:text-white'}`

  return <header className="flex flex-wrap items-center justify-between gap-4">
    <a href="/" className="flex items-center gap-3 text-xl font-extrabold tracking-[-0.04em]">
      <span className="grid size-[38px] place-items-center rounded-xl bg-gradient-to-br from-[#f2ae49] to-[#f8755e] text-[#14203a]">♬</span>
      Chord Canvas
    </a>
    <nav className="flex flex-wrap items-center justify-end gap-1.5" aria-label={t('nav.primary')}>
      <a href="/" aria-current={activePage === 'studio' ? 'page' : undefined} className={linkClass('studio')}>{t('nav.studio')}</a>
      <a href="/finder" aria-current={activePage === 'finder' ? 'page' : undefined} className={linkClass('finder')}>{t('nav.finder')}</a>
      <LanguageSwitcher />
    </nav>
  </header>
}
