import {
  stepLabel,
  type StrumDirection,
  type StrumStep,
  type Subdivision,
} from "../data/strumPresets";
import type { CSSProperties } from "react";
import { MAX_PATTERN_COLUMNS } from "../constants/studio";
import { useI18n, type TranslationKey } from "../i18n";

const directionLabel: Record<StrumDirection, TranslationKey> = {
  down: "studio.down",
  up: "studio.up",
  rest: "studio.ring",
};
const nextDirection: Record<StrumDirection, StrumDirection> = {
  down: "up",
  up: "rest",
  rest: "down",
};

interface Props {
  pattern: StrumStep[];
  subdivisions: Subdivision;
  activeStep: number;
  onChange: (pattern: StrumStep[]) => void;
}

export function StrumPatternEditor({
  pattern,
  subdivisions,
  activeStep,
  onChange,
}: Props) {
  const { t } = useI18n();
  const desktopColumnCount = Math.min(pattern.length, MAX_PATTERN_COLUMNS);
  const patternGridStyle = {
    "--pattern-columns": desktopColumnCount,
  } as CSSProperties;
  return (
    <section className="rounded-[22px] border border-[#314267] bg-[linear-gradient(145deg,#18233eeb,#111a2eee)] p-5 shadow-[0_24px_50px_#02050f55] sm:p-6">
      <div className="font-mono text-xs font-medium tracking-[.11em] text-[#f2ae49] uppercase">
        {t("studio.patternStep")}
      </div>
      <h2 className="mt-2 text-lg font-bold">{t("studio.patternTitle")}</h2>
      <p className="mt-2 text-sm text-[#aeb9d2]">
        {t("studio.patternDescription")}
      </p>
      <div
        className="mt-5 grid grid-cols-2 gap-3 md:[grid-template-columns:repeat(var(--pattern-columns),minmax(0,1fr))]"
        style={patternGridStyle}
      >
        {pattern.map((step, index) => (
          <div
            key={index}
            className={`overflow-hidden rounded-[13px] border ${activeStep === index ? "border-[#f2ae49] bg-[#f2ae4922]" : "border-[#435377] bg-[#0e172a]"}`}
          >
            <button
              aria-current={activeStep === index ? "step" : undefined}
              onClick={() =>
                onChange(
                  pattern.map((item, i) =>
                    i === index
                      ? { ...item, direction: nextDirection[item.direction] }
                      : item,
                  ),
                )
              }
              className="min-h-[84px] w-full cursor-pointer p-3 text-center hover:bg-[#f2ae4910]"
            >
              <span className="block font-mono text-xs text-[#77e4bf]">
                {index % subdivisions === 0
                  ? t("studio.beatLabel", {
                      number: stepLabel(index, subdivisions),
                    })
                  : stepLabel(index, subdivisions)}
              </span>
              <span className="mt-2 block text-lg font-bold text-[#f2ae49]">
                {t(directionLabel[step.direction])}
              </span>
            </button>
            <button
              aria-label={t("studio.accentStep", { number: index + 1 })}
              aria-pressed={step.accent}
              disabled={step.direction === "rest"}
              onClick={() =>
                onChange(
                  pattern.map((item, i) =>
                    i === index ? { ...item, accent: !item.accent } : item,
                  ),
                )
              }
              className={`w-full cursor-pointer border-t border-[#435377] px-1 py-2 text-xs disabled:cursor-default disabled:opacity-30 ${step.accent ? "text-[#f2ae49]" : "text-[#aeb9d2]"}`}
            >
              {step.accent ? t("studio.accentOn") : t("studio.accentOff")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
