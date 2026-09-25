import { STANDARD_TUNING, noteName } from '../data/music'
import type { ReactNode } from 'react'
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

  return <section className="card board-card">
    <div className="panel-head">
      <div><div className="eyebrow">Standard tuning · E A D G B E</div><h2>Guitar neck</h2></div>
      <div className="actions">
        <button className="quiet" onClick={onReverse} aria-pressed={reversed}>{reversed ? 'Normal strings' : 'Reverse strings'}</button>
        <button className="quiet" onClick={onClear}>Clear selection</button>
      </div>
    </div>
    <div className="fret-wrap">
      <div className="fretboard">
        {strings.map((string) => <div className="string-row" key={string.name}>
          <span className="string-name">{string.name}</span>
          {Array.from({ length: 12 }, (_, index) => {
            const fret = index + 1
            const midi = string.midi + fret
            const pitch = midi % 12
            return <button
              className={`fret ${selectedNotes.includes(pitch) ? 'selected' : ''}`}
              key={fret}
              onClick={() => onFretClick(pitch, midi)}
              aria-label={`${string.name} string, fret ${fret}, ${noteName(pitch)}`}
            ><span>{noteName(pitch)}</span></button>
          })}
        </div>)}
      </div>
      <div className="fret-numbers"><span />{Array.from({ length: 12 }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
    </div>
    {children}
  </section>
}
