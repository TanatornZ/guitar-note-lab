import { noteName } from '../data/music'
import type { ChordMatch, PitchClass } from '../types/music'

interface ChordResultsProps {
  selectedNotes: PitchClass[]
  matches: ChordMatch[]
  audioStatus: string
  onToggleNote: (pitch: PitchClass) => void
  onChooseChord: (tones: PitchClass[]) => void
  onPlayChord: () => void
}

export function ChordResults({ selectedNotes, matches, audioStatus, onToggleNote, onChooseChord, onPlayChord }: ChordResultsProps) {
  return <aside className="card result-card" aria-live="polite">
    <div className="eyebrow">Selected notes</div>
    <div className="selection">
      {selectedNotes.length
        ? selectedNotes.slice().sort((a, b) => a - b).map((pitch) => <button className="chip" key={pitch} onClick={() => onToggleNote(pitch)}>{noteName(pitch)} ×</button>)
        : <div className="empty">Choose one or more notes to explore possible chords.</div>}
    </div>
    <button className="play-chord" disabled={selectedNotes.length < 2} onClick={onPlayChord}>▶ Play selected chord</button>
    <p className="audio-status" role="status">{audioStatus}</p>
    <div className="rule" />
    <div className="subhead"><span>Possible chord names · click to show notes</span><span>{selectedNotes.length ? `${matches.length} matches` : '—'}</span></div>
    <div className="matches">
      {matches.length
        ? matches.slice(0, 24).map((chord) => <button className={`match ${chord.exact ? 'exact' : ''}`} key={`${chord.name}-${chord.tones}`} onClick={() => onChooseChord(chord.tones)}>
          <span className="chord-name">{chord.name}</span><small>{chord.tones.map(noteName).join(' · ')}</small><span className="type">{chord.exact ? 'exact set' : 'compatible'}<br />{chord.type}</span>
        </button>)
        : <div className="empty">Chord matches will appear here.</div>}
    </div>
    <div className="tip"><b>TIP</b><span>Gold cards are exact note sets. Other cards show tones you can add.</span></div>
  </aside>
}
