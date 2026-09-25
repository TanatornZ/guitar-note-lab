import { useMemo, useRef, useState } from 'react'
import { GuitarAudio } from './audio/GuitarAudio'
import { AppHeader } from './components/AppHeader'
import { ChordResults } from './components/ChordResults'
import { GuitarNeck } from './components/GuitarNeck'
import { NotePicker } from './components/NotePicker'
import { findChordMatches } from './lib/chords'
import type { PitchClass } from './types/music'

export default function App() {
  const [selectedNotes, setSelectedNotes] = useState<PitchClass[]>([])
  const [reversed, setReversed] = useState(false)
  const [audioStatus, setAudioStatus] = useState('Recorded acoustic guitar · click a fret to hear it')
  const audio = useRef<GuitarAudio | null>(null)

  if (!audio.current) audio.current = new GuitarAudio(setAudioStatus)

  const matches = useMemo(() => findChordMatches(selectedNotes), [selectedNotes])

  const toggleNote = (pitch: PitchClass, midi?: number) => {
    setSelectedNotes((notes) => notes.includes(pitch) ? notes.filter((note) => note !== pitch) : [...notes, pitch])
    if (midi !== undefined) void audio.current?.play([midi])
  }

  const clearSelection = () => {
    audio.current?.stop()
    setSelectedNotes([])
  }

  const playSelectedChord = () => {
    const midis = selectedNotes.slice().sort((a, b) => a - b).map((pitch) => 48 + pitch)
    void audio.current?.play(midis, true)
  }

  return <main className="shell">
    <AppHeader />
    <section className="workspace" aria-label="Chord explorer">
      <GuitarNeck
        selectedNotes={selectedNotes}
        reversed={reversed}
        onReverse={() => setReversed((value) => !value)}
        onClear={clearSelection}
        onFretClick={toggleNote}
      ><NotePicker selectedNotes={selectedNotes} onToggle={toggleNote} /></GuitarNeck>
      <ChordResults
        selectedNotes={selectedNotes}
        matches={matches}
        audioStatus={audioStatus}
        onToggleNote={toggleNote}
        onChooseChord={setSelectedNotes}
        onPlayChord={playSelectedChord}
      />
    </section>
    <footer>Guitar samples: <a href="https://github.com/nbrosowsky/tonejs-instruments">N. P. Brosowsky / University of Iowa</a> · <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a> · <a href="/audio/guitar/ATTRIBUTION.txt">Audio credits</a></footer>
  </main>
}
