import { useEffect, useState } from "react";
import { useI18n } from "../i18n";

const INSTALL_PROMPT_DISMISSED_SESSION_KEY =
  "chord-canvas-install-prompt-dismissed";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform?: string;
};

interface DeferredInstallPrompt extends Event {
  prompt: () => Promise<InstallChoice | void>;
  userChoice?: Promise<InstallChoice>;
}

type InstallMode = "native" | "ios" | null;

function isInstalled(): boolean {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isIosDevice(): boolean {
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function wasDismissedThisSession(): boolean {
  return (
    window.sessionStorage.getItem(INSTALL_PROMPT_DISMISSED_SESSION_KEY) ===
    "true"
  );
}

export function InstallPrompt() {
  const { t } = useI18n();
  const [mode, setMode] = useState<InstallMode>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<DeferredInstallPrompt | null>(null);

  useEffect(() => {
    if (isInstalled() || wasDismissedThisSession()) return;

    if (isIosDevice()) setMode("ios");

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (wasDismissedThisSession()) return;
      setDeferredPrompt(event as DeferredInstallPrompt);
      setMode("native");
    };
    const handleInstalled = () => {
      setDeferredPrompt(null);
      setMode(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = () => {
    window.sessionStorage.setItem(
      INSTALL_PROMPT_DISMISSED_SESSION_KEY,
      "true",
    );
    setDeferredPrompt(null);
    setMode(null);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    if (deferredPrompt.userChoice) await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setMode(null);
  };

  if (!mode) return null;

  return (
    <aside
      className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#916a31] bg-[linear-gradient(110deg,#2a2115,#151d2e)] p-4 shadow-[0_18px_40px_#02050f44] sm:flex-row sm:items-center sm:justify-between"
      aria-label={t("pwa.installTitle")}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-[#f2ae4922] text-xl text-[#f2ae49]"
          aria-hidden="true"
        >
          ↧
        </span>
        <div>
          <h2 className="font-bold text-[#eff3ff]">
            {t("pwa.installTitle")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#aeb9d2]">
            {t(
              mode === "ios"
                ? "pwa.iosDescription"
                : "pwa.installDescription",
            )}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          className="flex-1 cursor-pointer rounded-xl border border-[#435377] px-3 py-2 text-sm font-semibold text-[#aeb9d2] transition hover:border-[#aeb9d2] hover:text-white sm:flex-none"
          onClick={dismiss}
        >
          {mode === "ios" ? t("pwa.gotIt") : t("pwa.notNow")}
        </button>
        {mode === "native" && (
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-xl border border-[#d89233] bg-[#f2ae49] px-4 py-2 text-sm font-bold text-[#1b2030] transition hover:brightness-105 sm:flex-none"
            onClick={() => void install()}
          >
            {t("pwa.install")}
          </button>
        )}
      </div>
    </aside>
  );
}
