import type { ReactNode } from 'react'
import { STANDARD_TUNING, noteName } from '../data/music'
import type { PitchClass } from '../types/music'

interface GuitarNeckProps {
  selectedNotes: PitchClass[]
  reversed: boolean
  onReverse: () => void
  onClear: () => void
  onFretClick: (pitch: PitchClass, midi: number) => void
  children: ReactNode
}

export function GuitarNeck({ selectedNotes, reversed, onReverse, onClear, onFretClick, children }: GuitarNeckProps) {
  const strings = reversed ? [...STANDARD_TUNING].reverse() : STANDARD_TUNING

  return <section className="rounded-[22px] border border-[#314267] bg-[linear-gradient(145deg,#18233eeb,#111a2eee)] p-4 shadow-[0_24px_50px_#02050f55] sm:p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:gap-5">
      <div><div className="font-mono text-xs font-medium tracking-[.11em] text-[#f2ae49] uppercase">Standard tuning · E A D G B E</div><h2 className="mt-2 text-lg font-bold">Guitar neck</h2></div>
      <div className="flex flex-wrap justify-end gap-2">
        <button className="cursor-pointer rounded-[10px] border border-[#2b3a5c] bg-[#0e172a] px-3 py-2 text-sm text-[#d8e0f4] transition hover:border-[#f2ae49]" onClick={onReverse} aria-pressed={reversed}>{reversed ? 'Normal strings' : 'Reverse strings'}</button>
        <button className="cursor-pointer rounded-[10px] border border-[#2b3a5c] bg-[#0e172a] px-3 py-2 text-sm text-[#d8e0f4] transition hover:border-[#f2ae49]" onClick={onClear}>Clear selection</button>
      </div>
    </div>
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[680px] overflow-hidden rounded-[13px] border border-[#966039] bg-[#51311d]">
        {strings.map((string) => <div className="grid h-[49px] grid-cols-[48px_repeat(12,minmax(0,1fr))]" key={string.name}>
          <span className="grid place-items-center border-r-2 border-[#d6a46d] bg-[#17100a] font-mono text-xs font-medium text-[#d9b488]">{string.name}</span>
          {Array.from({ length: 12 }, (_, index) => {
            const fret = index + 1
            const midi = string.midi + fret
            const pitch = midi % 12
            const selected = selectedNotes.includes(pitch)
            return <button
              className={`cursor-pointer border-r-2 border-[#c3a3749c] bg-[linear-gradient(transparent_48%,#ded0ae_48%,#ded0ae_52%,transparent_52%)] text-[#f8ead3] ${selected ? 'font-semibold' : ''}`}
              key={fret}
              onClick={() => onFretClick(pitch, midi)}
              aria-label={`${string.name} string, fret ${fret}, ${noteName(pitch)}`}
            ><span className={`mx-auto grid size-[30px] place-items-center rounded-full font-mono text-xs ${selected ? 'bg-[#f2ae49] text-[#182033] shadow-[0_0_0_4px_#f2ae4930]' : ''}`}>{noteName(pitch)}</span></button>
          })}
        </div>)}
      </div>
      <div className="mt-2 grid min-w-[680px] grid-cols-[48px_repeat(12,minmax(0,1fr))] text-center font-mono text-[.65rem] font-medium text-[#8d9abb]"><span />{Array.from({ length: 12 }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
    </div>
    {children}
  </section>
}
