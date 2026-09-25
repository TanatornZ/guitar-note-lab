import { useCallback, useEffect, useRef, useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import { GuitarAudio } from '../audio/GuitarAudio'
import { STRUM_CHORDS, type StrumChord } from '../data/strumChords'

type StrumDirection = 'down' | 'up' | 'rest'

const TIME_SIGNATURES = [
  { label: '2/4', beats: 2 },
  { label: '3/4', beats: 3 },
  { label: '4/4', beats: 4 },
  { label: '6/8', beats: 6 },
]

const directionLabel: Record<StrumDirection, string> = {
  down: '↓ Down',
  up: '↑ Up',
  rest: '— Rest',
}

function defaultPattern(beats: number, halfBeats = false): StrumDirection[] {
  const subdivisions = halfBeats ? 2 : 1
  return Array.from({ length: beats * subdivisions }, (_, index) => {
    if (halfBeats && index % 2 === 1) return 'rest'
    const beat = Math.floor(index / subdivisions)
    return beat === 0 || beat % 2 === 0 ? 'down' : 'up'
  })
}

function nextDirection(direction: StrumDirection): StrumDirection {
  return direction === 'down' ? 'up' : direction === 'up' ? 'rest' : 'down'
}

export function StrumStudioPage() {
  const [progression, setProgression] = useState<StrumChord[]>([STRUM_CHORDS[0], STRUM_CHORDS[1], STRUM_CHORDS[2], STRUM_CHORDS[3]])
  const [selectedChord, setSelectedChord] = useState<StrumChord | null>(STRUM_CHORDS[0])
  const [signature, setSignature] = useState(TIME_SIGNATURES[2])
  const [bpm, setBpm] = useState(96)
  const [pattern, setPattern] = useState<StrumDirection[]>(defaultPattern(TIME_SIGNATURES[2].beats))
  const [halfBeats, setHalfBeats] = useState(false)
  const [metronomeEnabled, setMetronomeEnabled] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeBeat, setActiveBeat] = useState(-1)
  const [activeChord, setActiveChord] = useState(-1)
  const [audioStatus, setAudioStatus] = useState('Choose a progression, then press Play to load the acoustic guitar.')
  const audio = useRef<GuitarAudio | null>(null)
  const beatRef = useRef(0)
  const chordRef = useRef(0)

  if (!audio.current) audio.current = new GuitarAudio(setAudioStatus)

  const tick = useCallback(() => {
    if (!progression.length) return
    const subdivisions = halfBeats ? 2 : 1
    const totalSteps = signature.beats * subdivisions
    const step = beatRef.current % totalSteps
    const beat = Math.floor(step / subdivisions)
    const chordIndex = chordRef.current % progression.length
    const direction = pattern[step] ?? 'rest'
    const chord = progression[chordIndex]

    setActiveBeat(step)
    setActiveChord(chordIndex)
    if (metronomeEnabled && step % subdivisions === 0) void audio.current?.playMetronome(beat === 0)
    if (direction !== 'rest') void audio.current?.playStrum(chord.midis, direction)

    beatRef.current = step + 1
    if (beatRef.current >= totalSteps) {
      beatRef.current = 0
      chordRef.current = (chordIndex + 1) % progression.length
    }
  }, [halfBeats, metronomeEnabled, pattern, progression, signature.beats])

  useEffect(() => {
    if (!isPlaying) return
    tick()
    const timer = window.setInterval(tick, 60000 / bpm / (halfBeats ? 2 : 1))
    return () => window.clearInterval(timer)
  }, [bpm, halfBeats, isPlaying, tick])

  useEffect(() => {
    if (!progression.length && isPlaying) {
      audio.current?.stop()
      setIsPlaying(false)
      setActiveBeat(-1)
      setActiveChord(-1)
    }
  }, [isPlaying, progression.length])

  useEffect(() => () => audio.current?.stop(), [])

  const startPlayback = async () => {
    if (!progression.length) {
      setAudioStatus('Add at least one chord to your sequence.')
      return
    }
    const ready = await audio.current?.prepare()
    if (!ready) return
    beatRef.current = 0
    chordRef.current = 0
    setIsPlaying(true)
  }

  const stopPlayback = () => {
    audio.current?.stop()
    setIsPlaying(false)
    setActiveBeat(-1)
    setActiveChord(-1)
    setAudioStatus('Stopped. Adjust your groove and press Play when ready.')
  }

  const updateSignature = (label: string) => {
    const selected = TIME_SIGNATURES.find((option) => option.label === label) ?? TIME_SIGNATURES[2]
    setSignature(selected)
    setPattern(defaultPattern(selected.beats, halfBeats))
    beatRef.current = 0
    setActiveBeat(-1)
  }

  const toggleHalfBeats = () => {
    const nextValue = !halfBeats
    setHalfBeats(nextValue)
    setPattern(defaultPattern(signature.beats, nextValue))
    beatRef.current = 0
    setActiveBeat(-1)
  }

  return <main className="min-h-screen bg-[#0b1020] bg-[image:radial-gradient(circle_at_12%_0%,#203560_0,transparent_34rem),radial-gradient(circle_at_90%_90%,#17284e_0,transparent_34rem)] px-[clamp(18px,4vw,56px)] pt-7 pb-12 font-sans text-[#eff3ff]">
    <div className="mx-auto max-w-[1320px]">
      <header className="flex items-center justify-between gap-5">
        <a href="#/" className="flex items-center gap-3 text-xl font-extrabold tracking-[-0.04em]"><span className="grid size-[38px] place-items-center rounded-xl bg-gradient-to-br from-[#f2ae49] to-[#f8755e] text-[#14203a]">♬</span>Chord Canvas</a>
        <a className="rounded-lg border border-[#d89233] px-3 py-1.5 text-sm font-semibold text-[#f2ae49] transition hover:bg-[#f2ae4918]" href="#/">← Chord finder</a>
      </header>

      <section className="mb-7 mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><div className="font-mono text-xs font-medium tracking-[.11em] text-[#f2ae49] uppercase">New performance page</div><h1 className="mt-2 text-[clamp(2rem,4.2vw,4.2rem)] leading-[1.03] font-extrabold tracking-[-0.065em]">Strum <em className="not-italic text-[#f2ae49]">Studio.</em></h1></div>
        <p className="max-w-[360px] text-sm leading-relaxed text-[#aeb9d2]">Build a chord loop, set the pulse, and place downstrokes or upstrokes on every beat.</p>
      </section>

      <section className="grid gap-[18px] min-[980px]:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
        <div className="space-y-[18px]">
          <section className="rounded-[22px] border border-[#314267] bg-[linear-gradient(145deg,#18233eeb,#111a2eee)] p-5 shadow-[0_24px_50px_#02050f55] sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="font-mono text-xs font-medium tracking-[.11em] text-[#f2ae49] uppercase">1 · Chord sequence</div><h2 className="mt-2 text-lg font-bold">Your progression</h2></div><button className="cursor-pointer text-sm text-[#aeb9d2] hover:text-white" onClick={() => setProgression([])}>Clear sequence</button></div>
            <p className="mt-2 text-sm text-[#aeb9d2]">Search for a chord, then add it to your sequence. Each chord lasts one bar before the progression loops.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <Autocomplete
                id="chord-picker"
                options={STRUM_CHORDS}
                value={selectedChord}
                onChange={(_, chord) => setSelectedChord(chord)}
                getOptionLabel={(chord) => chord.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText="No matching chord"
                slotProps={{
                  paper: { sx: { bgcolor: '#0e172a', color: '#eff3ff', border: '1px solid #435377', boxShadow: '0 18px 36px #02050fcc', '& .MuiAutocomplete-option': { fontFamily: 'DM Mono, ui-monospace, monospace', '&:hover': { bgcolor: '#1b2945' }, '&[aria-selected="true"]': { bgcolor: '#f2ae4922', color: '#f2ae49' } } } },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { bgcolor: '#0e172a', borderRadius: '0.75rem', color: '#eff3ff', fontFamily: 'DM Mono, ui-monospace, monospace', '& fieldset': { borderColor: '#435377' }, '&:hover fieldset': { borderColor: '#f2ae49' }, '&.Mui-focused fieldset': { borderColor: '#f2ae49' } },
                  '& .MuiInputLabel-root': { color: '#aeb9d2' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#f2ae49' },
                  '& .MuiSvgIcon-root': { color: '#aeb9d2' },
                }}
                renderInput={(params) => <TextField {...params} label="Search a chord" placeholder="Try Cmaj7 or Am7" />}
              />
              <button disabled={!selectedChord} className="cursor-pointer rounded-xl border border-[#d89233] bg-gradient-to-r from-[#f6b955] to-[#ee936a] px-4 py-3 font-semibold text-[#1b2030] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => selectedChord && setProgression((items) => [...items, selectedChord])}>+ Add chord</button>
            </div>
            <div className="mt-5 min-h-[92px] rounded-[13px] border border-dashed border-[#435377] bg-[#0d1526]/70 p-3">
              {progression.length ? <div className="flex flex-wrap gap-2">{progression.map((chord, index) => <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${activeChord === index ? 'border-[#f2ae49] bg-[#f2ae4922]' : 'border-[#435377] bg-[#18233e]'}`} key={`${chord.id}-${index}`}><span className="font-mono text-xs text-[#77e4bf]">{index + 1}</span><span className="font-mono font-bold text-[#f2ae49]">{chord.name}</span><button className="cursor-pointer text-[#aeb9d2] hover:text-white" aria-label={`Remove ${chord.name}`} onClick={() => setProgression((items) => items.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}</div> : <div className="grid h-[66px] place-items-center text-sm text-[#aeb9d2]">Choose chords above to create your loop.</div>}
            </div>
          </section>

          <section className="rounded-[22px] border border-[#314267] bg-[linear-gradient(145deg,#18233eeb,#111a2eee)] p-5 shadow-[0_24px_50px_#02050f55] sm:p-6">
            <div className="font-mono text-xs font-medium tracking-[.11em] text-[#f2ae49] uppercase">3 · Strum pattern</div><h2 className="mt-2 text-lg font-bold">Choose the direction on each beat</h2>
            <p className="mt-2 text-sm text-[#aeb9d2]">Click a step to cycle through downstroke, upstroke, and rest. Half-beat mode adds an “&” step between every numbered beat.</p>
            <div className="mt-5 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(pattern.length, 4)}, minmax(0, 1fr))` }}>
              {pattern.map((direction, index) => <button key={index} onClick={() => setPattern((steps) => steps.map((step, stepIndex) => stepIndex === index ? nextDirection(step) : step))} className={`min-h-[94px] cursor-pointer rounded-[13px] border p-3 text-center transition ${activeBeat === index && isPlaying ? 'border-[#f2ae49] bg-[#f2ae4922] shadow-[0_0_0_3px_#f2ae4920]' : 'border-[#435377] bg-[#0e172a] hover:border-[#f2ae49]'}`}><span className="block font-mono text-xs text-[#77e4bf]">{halfBeats ? (index % 2 === 0 ? `Beat ${index / 2 + 1}` : '&') : `Beat ${index + 1}`}</span><span className="mt-2 block text-lg font-bold text-[#f2ae49]">{directionLabel[direction]}</span></button>)}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-[22px] border border-[#314267] bg-[linear-gradient(145deg,#18233eeb,#111a2eee)] p-5 shadow-[0_24px_50px_#02050f55] sm:p-6">
          <div className="font-mono text-xs font-medium tracking-[.11em] text-[#f2ae49] uppercase">2 · Metronome</div><h2 className="mt-2 text-lg font-bold">Set the groove</h2>
          <label className="mt-5 block text-sm font-semibold text-[#d8e0f4]" htmlFor="tempo">Tempo <span className="float-right font-mono text-[#f2ae49]">{bpm} BPM</span></label>
          <input id="tempo" className="mt-3 w-full accent-[#f2ae49]" type="range" min="50" max="220" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} />
          <div className="mt-2 flex justify-between font-mono text-xs text-[#8d9abb]"><span>50</span><span>220</span></div>
          <label className="mt-6 block text-sm font-semibold text-[#d8e0f4]" htmlFor="signature">Time signature</label>
          <select id="signature" value={signature.label} onChange={(event) => updateSignature(event.target.value)} className="mt-2 w-full cursor-pointer rounded-xl border border-[#435377] bg-[#0e172a] px-3 py-3 text-sm text-[#eff3ff] outline-none focus:border-[#f2ae49]">{TIME_SIGNATURES.map((option) => <option key={option.label}>{option.label}</option>)}</select>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold transition ${metronomeEnabled ? 'border-[#77e4bf] bg-[#77e4bf18] text-[#77e4bf]' : 'border-[#435377] bg-[#0e172a] text-[#aeb9d2]'}`} onClick={() => setMetronomeEnabled((enabled) => !enabled)}>{metronomeEnabled ? '● Metronome on' : '○ Metronome off'}</button>
            <button className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold transition ${halfBeats ? 'border-[#f2ae49] bg-[#f2ae4918] text-[#f2ae49]' : 'border-[#435377] bg-[#0e172a] text-[#aeb9d2]'}`} onClick={toggleHalfBeats}>{halfBeats ? '½ Half-beats on' : '½ Add half-beats'}</button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#aeb9d2]">The first numbered beat is accented. {halfBeats ? 'Each “&” is halfway between regular beats.' : 'Turn on half-beats to add an editable “&” step between every beat.'}</p>
          <div className="my-6 h-px bg-[#2b3a5c]" />
          <button className={`w-full cursor-pointer rounded-xl border px-4 py-3 font-extrabold transition ${isPlaying ? 'border-[#a65a55] bg-[#512a2a] text-[#ffd7d3] hover:bg-[#623333]' : 'border-[#d89233] bg-gradient-to-r from-[#f6b955] to-[#ee936a] text-[#1b2030] hover:brightness-105'}`} onClick={isPlaying ? stopPlayback : startPlayback}>{isPlaying ? '■ Stop performance' : '▶ Play performance'}</button>
          <p className="mt-3 text-center text-sm text-[#aeb9d2]" role="status">{audioStatus}</p>
          <div className="mt-5 rounded-xl bg-[#0d1526] p-4 text-sm leading-relaxed text-[#aeb9d2]"><span className="font-mono font-bold text-[#77e4bf]">HOW IT LOOPS</span><br />Each row chord plays for one full bar. The strum pattern repeats inside that bar, then moves to the next chord.</div>
        </aside>
      </section>
      <footer className="mt-5 text-xs text-[#aeb9d2]">Guitar samples: <a className="underline underline-offset-2 hover:text-white" href="https://github.com/nbrosowsky/tonejs-instruments">N. P. Brosowsky / University of Iowa</a> · <a className="underline underline-offset-2 hover:text-white" href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a></footer>
    </div>
  </main>
}
