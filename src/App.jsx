import { useMemo, useRef, useState } from 'react'
import { GuitarAudio } from './GuitarAudio.js'

const NOTES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']
const STRINGS = [{ name: 'E', midi: 40 }, { name: 'A', midi: 45 }, { name: 'D', midi: 50 }, { name: 'G', midi: 55 }, { name: 'B', midi: 59 }, { name: 'e', midi: 64 }]
const SHAPES = [
  ['', 'major', [0, 4, 7]], ['m', 'minor', [0, 3, 7]], ['dim', 'diminished', [0, 3, 6]], ['aug', 'augmented', [0, 4, 8]],
  ['sus2', 'suspended 2', [0, 2, 7]], ['sus4', 'suspended 4', [0, 5, 7]], ['5', 'power chord', [0, 7]],
  ['6', 'sixth', [0, 4, 7, 9]], ['m6', 'minor sixth', [0, 3, 7, 9]], ['7', 'dominant seventh', [0, 4, 7, 10]],
  ['maj7', 'major seventh', [0, 4, 7, 11]], ['m7', 'minor seventh', [0, 3, 7, 10]], ['m7♭5', 'half-diminished', [0, 3, 6, 10]],
  ['dim7', 'diminished seventh', [0, 3, 6, 9]], ['add9', 'add nine', [0, 2, 4, 7]], ['9', 'dominant ninth', [0, 2, 4, 7, 10]],
]
const noteName = (pitch) => NOTES[(pitch + 120) % 12]

export default function App() {
  const [selected, setSelected] = useState([])
  const [reversed, setReversed] = useState(false)
  const [audioStatus, setAudioStatus] = useState('Recorded acoustic guitar · click a fret to hear it')
  const audio = useRef()
  if (!audio.current) audio.current = new GuitarAudio(setAudioStatus)

  const matches = useMemo(() => {
    if (!selected.length) return []
    return Array.from({ length: 12 }, (_, root) => SHAPES.map(([suffix, type, steps]) => {
      const tones = steps.map((step) => (root + step) % 12)
      return { name: noteName(root) + suffix, type, tones, exact: tones.length === selected.length && selected.every((note) => tones.includes(note)) }
    })).flat().filter((chord) => selected.every((note) => chord.tones.includes(note)))
      .sort((a, b) => Number(b.exact) - Number(a.exact) || a.tones.length - b.tones.length || a.name.localeCompare(b.name))
  }, [selected])

  const toggle = (pitch, midi) => {
    setSelected((notes) => notes.includes(pitch) ? notes.filter((note) => note !== pitch) : [...notes, pitch])
    if (midi !== undefined) audio.current.play([midi])
  }
  const chooseChord = (tones) => setSelected(tones)
  const clear = () => { audio.current.stop(); setSelected([]) }
  const displayStrings = reversed ? [...STRINGS].reverse() : STRINGS

  return <main className="shell">
    <header><div className="brand"><span className="mark">♬</span>Chord Canvas</div><span className="hint">Click a fret to hear and select its note</span></header>
    <section className="intro"><h1>Find the harmony inside <em>your notes.</em></h1><p>Choose notes from the neck or the note row. We’ll surface chords that can contain them.</p></section>
    <section className="workspace" aria-label="Chord explorer">
      <section className="card board-card">
        <div className="panel-head"><div><div className="eyebrow">Standard tuning · E A D G B E</div><h2>Guitar neck</h2></div><div className="actions"><button className="quiet" onClick={() => setReversed(!reversed)} aria-pressed={reversed}>{reversed ? 'Normal strings' : 'Reverse strings'}</button><button className="quiet" onClick={clear}>Clear selection</button></div></div>
        <div className="fret-wrap"><div className="fretboard">{displayStrings.map((string) => <div className="string-row" key={string.name}><span className="string-name">{string.name}</span>{Array.from({ length: 12 }, (_, index) => { const fret = index + 1; const midi = string.midi + fret; const pitch = midi % 12; const active = selected.includes(pitch); return <button className={`fret ${active ? 'selected' : ''}`} key={fret} onClick={() => toggle(pitch, midi)} aria-label={`${string.name} string, fret ${fret}, ${noteName(pitch)}`}><span>{noteName(pitch)}</span></button> })}</div>)}</div><div className="fret-numbers"><span></span>{Array.from({ length: 12 }, (_, index) => <span key={index}>{index + 1}</span>)}</div></div>
        <div className="note-picker" aria-label="Choose notes by name">{NOTES.map((note, pitch) => <button key={note} className={`note ${selected.includes(pitch) ? 'selected' : ''}`} onClick={() => toggle(pitch)}>{note}</button>)}</div>
      </section>
      <aside className="card result-card" aria-live="polite">
        <div className="eyebrow">Selected notes</div>
        <div className="selection">{selected.length ? selected.slice().sort((a, b) => a - b).map((pitch) => <button className="chip" key={pitch} onClick={() => toggle(pitch)}>{noteName(pitch)} ×</button>) : <div className="empty">Choose one or more notes to explore possible chords.</div>}</div>
        <button className="play-chord" disabled={selected.length < 2} onClick={() => audio.current.play(selected.slice().sort((a, b) => a - b).map((pitch) => 48 + pitch), true)}>▶ Play selected chord</button>
        <p className="audio-status" role="status">{audioStatus}</p>
        <div className="rule" />
        <div className="subhead"><span>Possible chord names · click to show notes</span><span>{selected.length ? `${matches.length} matches` : '—'}</span></div>
        <div className="matches">{matches.length ? matches.slice(0, 24).map((chord) => <button className={`match ${chord.exact ? 'exact' : ''}`} key={`${chord.name}-${chord.tones}`} onClick={() => chooseChord(chord.tones)}><span className="chord-name">{chord.name}</span><small>{chord.tones.map(noteName).join(' · ')}</small><span className="type">{chord.exact ? 'exact set' : 'compatible'}<br />{chord.type}</span></button>) : <div className="empty">Chord matches will appear here.</div>}</div>
        <div className="tip"><b>TIP</b><span>Gold cards are exact note sets. Other cards show tones you can add.</span></div>
      </aside>
    </section>
    <footer>Guitar samples: <a href="https://github.com/nbrosowsky/tonejs-instruments">N. P. Brosowsky / University of Iowa</a> · <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a> · <a href="/audio/guitar/ATTRIBUTION.txt">Audio credits</a></footer>
  </main>
}
