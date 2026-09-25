import { useMemo, useRef, useState } from 'react'
import { GuitarAudio } from '../audio/GuitarAudio'
import { AppHeader } from '../components/AppHeader'
import { ChordResults } from '../components/ChordResults'
import { GuitarNeck } from '../components/GuitarNeck'
import { NotePicker } from '../components/NotePicker'
import { findChordMatches } from '../lib/chords'
import type { PitchClass } from '../types/music'

export function ChordFinderPage() {
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
  const clearSelection = () => { audio.current?.stop(); setSelectedNotes([]) }
  const playSelectedChord = () => void audio.current?.play(selectedNotes.slice().sort((a, b) => a - b).map((pitch) => 48 + pitch), true)

  return <main className="min-h-screen bg-[#0b1020] bg-[image:radial-gradient(circle_at_14%_0%,#203560_0,transparent_30rem),radial-gradient(circle_at_90%_90%,#17284e_0,transparent_34rem)] px-[clamp(18px,4vw,56px)] pt-7 pb-12 font-sans text-[#eff3ff]">
    <div className="mx-auto max-w-[1320px]">
      <AppHeader />
      <section className="grid gap-[18px] min-[900px]:grid-cols-[minmax(0,1.55fr)_minmax(330px,.8fr)]" aria-label="Chord explorer">
        <GuitarNeck selectedNotes={selectedNotes} reversed={reversed} onReverse={() => setReversed((value) => !value)} onClear={clearSelection} onFretClick={toggleNote}>
          <NotePicker selectedNotes={selectedNotes} onToggle={toggleNote} />
        </GuitarNeck>
        <ChordResults selectedNotes={selectedNotes} matches={matches} audioStatus={audioStatus} onToggleNote={toggleNote} onChooseChord={setSelectedNotes} onPlayChord={playSelectedChord} />
      </section>
      <footer className="mt-5 text-xs text-[#aeb9d2]">Guitar samples: <a className="underline underline-offset-2 hover:text-white" href="https://github.com/nbrosowsky/tonejs-instruments">N. P. Brosowsky / University of Iowa</a> · <a className="underline underline-offset-2 hover:text-white" href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a> · <a href="/audio/guitar/ATTRIBUTION.txt" className="underline underline-offset-2 hover:text-white">Audio credits</a></footer>
    </div>
  </main>
}
