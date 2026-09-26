import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "../i18n";

type Page = "studio" | "finder";

interface SiteNavbarProps {
  activePage: Page;
}

export function SiteNavbar({ activePage }: SiteNavbarProps) {
  const { t } = useI18n();
  const linkClass = (page: Page) =>
    `w-full rounded-lg border px-3 py-2 text-center text-sm font-semibold transition sm:w-auto sm:py-1.5 ${
      activePage === page
        ? "border-[#d89233] bg-[#f2ae4918] text-[#f2ae49]"
        : "border-transparent text-[#aeb9d2] hover:border-[#435377] hover:text-white"
    }`;

  return (
    <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4 relative">
      <a
        href="/"
        className="flex items-center gap-3 text-xl font-extrabold tracking-[-0.04em]"
      >
        <span className="grid size-[38px] place-items-center rounded-xl bg-gradient-to-br from-[#f2ae49] to-[#f8755e] text-[#14203a]">
          ♬
        </span>
        Chord Canvas
      </a>
      <nav
        className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-1.5"
        aria-label={t("nav.primary")}
      >
        <a
          href="/"
          aria-current={activePage === "studio" ? "page" : undefined}
          className={linkClass("studio")}
        >
          {t("nav.studio")}
        </a>
        <a
          href="/finder"
          aria-current={activePage === "finder" ? "page" : undefined}
          className={linkClass("finder")}
        >
          {t("nav.finder")}
        </a>
      </nav>
      <div className="col-span-2 justify-self-center sm:contents absolute top-1 right-1">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
