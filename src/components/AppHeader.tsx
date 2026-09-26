import { useI18n } from '../i18n'
import { SiteNavbar } from './SiteNavbar'

export function AppHeader() {
  const { t } = useI18n()
  return <>
    <SiteNavbar activePage="finder" />
    <section className="mb-[22px] mt-8 flex flex-col gap-4 md:mt-0 md:flex-row md:items-end md:justify-between md:gap-5">
      <h1 className="max-w-[690px] text-[clamp(2rem,4.2vw,4.2rem)] leading-[1.03] font-extrabold tracking-[-0.065em]">{t('finder.hero.before')}<em className="not-italic text-[#f2ae49]">{t('finder.hero.highlight')}</em></h1>
      <p className="max-w-[315px] text-sm leading-relaxed text-[#aeb9d2]">{t('finder.hero.description')}</p>
    </section>
  </>
}
