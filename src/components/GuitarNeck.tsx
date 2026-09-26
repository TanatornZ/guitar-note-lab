import type { ReactNode } from 'react'
import { STANDARD_TUNING, noteName } from '../data/music'
import type { PitchClass } from '../types/music'
import { FIRST_PLAYABLE_FRET, GUITAR_FRET_COUNT, SEMITONES_PER_OCTAVE } from '../constants/music'
import { useI18n } from '../i18n'

// Share the fret count between notes, labels, and the CSS grid.
const FRET_GRID_COLUMNS = `48px repeat(${GUITAR_FRET_COUNT}, minmax(0, 1fr))`

interface GuitarNeckProps {
  selectedNotes: PitchClass[]
  reversed: boolean
  onReverse: () => void
  onClear: () => void
  onFretClick: (pitch: PitchClass, midi: number) => void
  children: ReactNode
}

export function GuitarNeck({ selectedNotes, reversed, onReverse, onClear, onFretClick, children }: GuitarNeckProps) {
  const { t } = useI18n()
  const strings = reversed ? [...STANDARD_TUNING].reverse() : STANDARD_TUNING

  return <section className="rounded-[22px] border border-[#314267] bg-[linear-gradient(145deg,#18233eeb,#111a2eee)] p-4 shadow-[0_24px_50px_#02050f55] sm:p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:gap-5">
      <div><div className="font-mono text-xs font-medium tracking-[.11em] text-[#f2ae49] uppercase">{t('finder.tuning')}</div><h2 className="mt-2 text-lg font-bold">{t('finder.neck')}</h2></div>
      <div className="flex flex-wrap justify-end gap-2">
        <button className="cursor-pointer rounded-[10px] border border-[#2b3a5c] bg-[#0e172a] px-3 py-2 text-sm text-[#d8e0f4] transition hover:border-[#f2ae49]" onClick={onReverse} aria-pressed={reversed}>{reversed ? t('finder.normalStrings') : t('finder.reverseStrings')}</button>
        <button className="cursor-pointer rounded-[10px] border border-[#2b3a5c] bg-[#0e172a] px-3 py-2 text-sm text-[#d8e0f4] transition hover:border-[#f2ae49]" onClick={onClear}>{t('finder.clearSelection')}</button>
      </div>
    </div>
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[680px] overflow-hidden rounded-[13px] border border-[#966039] bg-[#51311d]">
        {strings.map((string) => <div className="grid h-[49px]" style={{ gridTemplateColumns: FRET_GRID_COLUMNS }} key={string.name}>
          <span className="grid place-items-center border-r-2 border-[#d6a46d] bg-[#17100a] font-mono text-xs font-medium text-[#d9b488]">{string.name}</span>
          {Array.from({ length: GUITAR_FRET_COUNT }, (_, index) => {
            const fret = index + FIRST_PLAYABLE_FRET
            const midi = string.midi + fret
            const pitch = midi % SEMITONES_PER_OCTAVE
            const selected = selectedNotes.includes(pitch)
            return <button
              className={`cursor-pointer border-r-2 border-[#c3a3749c] bg-[linear-gradient(transparent_48%,#ded0ae_48%,#ded0ae_52%,transparent_52%)] text-[#f8ead3] ${selected ? 'font-semibold' : ''}`}
              key={fret}
              onClick={() => onFretClick(pitch, midi)}
              aria-label={t('finder.fretLabel', { string: string.name, fret, note: noteName(pitch) })}
            ><span className={`mx-auto grid size-[30px] place-items-center rounded-full font-mono text-xs ${selected ? 'bg-[#f2ae49] text-[#182033] shadow-[0_0_0_4px_#f2ae4930]' : ''}`}>{noteName(pitch)}</span></button>
          })}
        </div>)}
      </div>
      <div className="mt-2 grid min-w-[680px] text-center font-mono text-[.65rem] font-medium text-[#8d9abb]" style={{ gridTemplateColumns: FRET_GRID_COLUMNS }}><span />{Array.from({ length: GUITAR_FRET_COUNT }, (_, index) => <span key={index}>{index + FIRST_PLAYABLE_FRET}</span>)}</div>
    </div>
    {children}
  </section>
}
