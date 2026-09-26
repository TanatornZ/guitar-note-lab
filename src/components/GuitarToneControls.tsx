import { useId, useState } from 'react'
import { DEFAULT_GUITAR_TONE, GUITAR_TONE_BANDS, TONE_LIMIT, TONE_STEP_DB, type GuitarTone } from '../data/guitarTone'

export function GuitarToneControls({ onChange }: { onChange: (tone: GuitarTone) => void }) {
  const [tone, setTone] = useState<GuitarTone>({ ...DEFAULT_GUITAR_TONE })
  const id = useId()
  const updateTone = (next: GuitarTone) => {
    setTone(next)
    onChange(next)
  }

  return <fieldset className="mt-6 rounded-xl border border-[#435377] bg-[#0d1526] p-4">
    <legend className="px-2 font-mono text-xs font-medium uppercase tracking-wider text-[#77e4bf]">Guitar tone</legend>
    <p className="mb-4 text-xs leading-relaxed text-[#aeb9d2]">Shape the guitar while it plays. 0 dB keeps the original tone.</p>
    <div className="space-y-4">
      {GUITAR_TONE_BANDS.map(({ key, label, description }) => <div key={key}>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={`${id}-${key}`} className="text-sm font-semibold text-[#d8e0f4]">{label}</label>
          <span className="font-mono text-xs text-[#f2ae49]">{tone[key] > 0 ? '+' : ''}{tone[key]} dB</span>
        </div>
        <input id={`${id}-${key}`} type="range" min={-TONE_LIMIT} max={TONE_LIMIT} step={TONE_STEP_DB} value={tone[key]} aria-valuetext={`${tone[key]} decibels`} aria-describedby={`${id}-${key}-hint`} onChange={(event) => updateTone({ ...tone, [key]: Number(event.target.value) })} className="mt-2 w-full cursor-pointer accent-[#f2ae49]" />
        <p id={`${id}-${key}-hint`} className="text-xs text-[#aeb9d2]">{description}</p>
      </div>)}
    </div>
    <button type="button" onClick={() => updateTone({ ...DEFAULT_GUITAR_TONE })} className="mt-4 cursor-pointer rounded-lg border border-[#435377] px-3 py-2 text-xs text-[#d8e0f4] transition hover:border-[#f2ae49]">Reset guitar tone</button>
  </fieldset>
}
