import { useCallback, useEffect, useRef, useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import { GuitarAudio } from '../audio/GuitarAudio'
import { STRUM_CHORDS, type StrumChord } from '../data/strumChords'
import { ANGER_PRESET, defaultPattern, type ProgressionChord, type Subdivision } from '../data/strumPresets'
import { StrumPatternEditor } from '../components/StrumPatternEditor'
import { GuitarToneControls } from '../components/GuitarToneControls'
import { SiteNavbar } from '../components/SiteNavbar'
import { useI18n, type TranslationKey } from '../i18n'
import {
  CHORD_DURATION_BEATS, DEFAULT_PROGRESSION_CHORD_IDS, DEFAULT_SUBDIVISION,
  DEFAULT_TIME_SIGNATURE, MILLISECONDS_PER_MINUTE, NO_ACTIVE_STEP,
  SUBDIVISIONS, TEMPO_BPM, TIME_SIGNATURES,
} from '../constants/studio'

const DEFAULT_PROGRESSION = DEFAULT_PROGRESSION_CHORD_IDS.map((id) => STRUM_CHORDS.find((chord) => chord.id === id)!)

export function StrumStudioPage() {
  const { t } = useI18n()
  const [progression, setProgression] = useState<ProgressionChord[]>(DEFAULT_PROGRESSION)
  const [selectedChord, setSelectedChord] = useState<StrumChord | null>(STRUM_CHORDS[0])
  const [signature, setSignature] = useState<typeof TIME_SIGNATURES[number]>(DEFAULT_TIME_SIGNATURE)
  const [bpm, setBpm] = useState<number>(TEMPO_BPM.default)
  const [pattern, setPattern] = useState(defaultPattern(DEFAULT_TIME_SIGNATURE.beats, DEFAULT_SUBDIVISION))
  const [subdivisions, setSubdivisions] = useState<Subdivision>(DEFAULT_SUBDIVISION)
  const [metronomeEnabled, setMetronomeEnabled] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeBeat, setActiveBeat] = useState(NO_ACTIVE_STEP)
  const [activeChord, setActiveChord] = useState(NO_ACTIVE_STEP)
  const [audioStatus, setAudioStatus] = useState<TranslationKey>('audio.initialStudio')
  const audio = useRef<GuitarAudio | null>(null)
  const beatRef = useRef(0)
  const chordRef = useRef(0)
  const chordStepRef = useRef(0)
  const startedRef = useRef(false)
  const playRequestRef = useRef(0)

  if (!audio.current) audio.current = new GuitarAudio(setAudioStatus)

  const tick = useCallback(() => {
    if (!progression.length) return
    const totalSteps = signature.beats * subdivisions
    const step = beatRef.current % totalSteps
    const beat = Math.floor(step / subdivisions)
    const chordIndex = chordRef.current % progression.length
    const { direction, accent } = pattern[step]
    const chord = progression[chordIndex]

    setActiveBeat(step)
    setActiveChord(chordIndex)
    if (metronomeEnabled && step % subdivisions === 0) void audio.current?.playMetronome(beat === 0)
    if (direction !== 'rest') void audio.current?.playStrum(chord.midis, direction, accent)

    beatRef.current = (step + 1) % totalSteps
    chordStepRef.current += 1
    if (chordStepRef.current >= (chord.beats ?? signature.beats) * subdivisions) {
      chordStepRef.current = 0
      chordRef.current = (chordIndex + 1) % progression.length
      if (chordRef.current === 0) beatRef.current = 0
    }
  }, [subdivisions, metronomeEnabled, pattern, progression, signature.beats])

  useEffect(() => {
    if (!isPlaying) { startedRef.current = false; return }
    if (!startedRef.current) { tick(); startedRef.current = true }
    const timer = window.setInterval(tick, MILLISECONDS_PER_MINUTE / bpm / subdivisions)
    return () => window.clearInterval(timer)
  }, [bpm, subdivisions, isPlaying, tick])

  useEffect(() => {
    if (!progression.length && isPlaying) {
      audio.current?.stop()
      setIsPlaying(false)
      setActiveBeat(NO_ACTIVE_STEP)
      setActiveChord(NO_ACTIVE_STEP)
    }
  }, [isPlaying, progression.length])

  useEffect(() => () => { playRequestRef.current += 1; audio.current?.stop() }, [])

  const startPlayback = async () => {
    if (!progression.length) {
      setAudioStatus('audio.addChordFirst')
      return
    }
    const request = ++playRequestRef.current
    const ready = await audio.current?.prepare()
    if (!ready || request !== playRequestRef.current) return
    beatRef.current = 0
    chordRef.current = 0
    chordStepRef.current = 0
    startedRef.current = false
    setIsPlaying(true)
  }

  const stopPlayback = () => {
    playRequestRef.current += 1
    audio.current?.stop()
    setIsPlaying(false)
    setActiveBeat(NO_ACTIVE_STEP)
    setActiveChord(NO_ACTIVE_STEP)
    setAudioStatus('audio.stopped')
  }

  const updateSignature = (label: string) => {
    stopPlayback()
    const selected = TIME_SIGNATURES.find((option) => option.label === label) ?? DEFAULT_TIME_SIGNATURE
    setSignature(selected)
    setPattern(defaultPattern(selected.beats, subdivisions))
    beatRef.current = 0
    setActiveBeat(NO_ACTIVE_STEP)
  }

  const updateSubdivisions = (value: Subdivision) => {
    stopPlayback()
    setSubdivisions(value)
    setPattern(defaultPattern(signature.beats, value))
    beatRef.current = 0
    setActiveBeat(NO_ACTIVE_STEP)
  }

  const updateProgression = (items: ProgressionChord[]) => {
    stopPlayback()
    setProgression(items)
  }

  const loadPreset = () => {
    stopPlayback()
    setProgression(ANGER_PRESET.progression.map((chord) => ({ ...chord })))
    setPattern(ANGER_PRESET.pattern.map((step) => ({ ...step })))
    setBpm(ANGER_PRESET.bpm)
    setSignature(ANGER_PRESET.timeSignature)
    setSubdivisions(ANGER_PRESET.subdivisions)
    setMetronomeEnabled(false)
    setAudioStatus('audio.presetLoaded')
  }

  return <main className="min-h-screen bg-[#0b1020] bg-[image:radial-gradient(circle_at_12%_0%,#203560_0,transparent_34rem),radial-gradient(circle_at_90%_90%,#17284e_0,transparent_34rem)] px-[clamp(18px,4vw,56px)] pt-7 pb-12 font-sans text-[#eff3ff]">
    <div className="mx-auto max-w-[1320px]">
      <SiteNavbar activePage="studio" />

      <section className="mb-7 mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><div className="font-mono text-xs font-medium tracking-[.11em] text-[#f2ae49] uppercase">{t('studio.eyebrow')}</div><h1 className="mt-2 text-[clamp(2rem,4.2vw,4.2rem)] leading-[1.03] font-extrabold tracking-[-0.065em]">{t('studio.titleBefore')}<em className="not-italic text-[#f2ae49]">{t('studio.titleHighlight')}</em></h1></div>
        <p className="max-w-[360px] text-sm leading-relaxed text-[#aeb9d2]">{t('studio.description')}</p>
      </section>

      <section aria-label="Song practice preset" className="mb-[18px] flex flex-col gap-4 rounded-[22px] border border-[#916a31] bg-[#251f19] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-[#77e4bf]">{t('studio.presetLabel')}</div>
          <h2 className="mt-1 text-lg font-bold text-[#f2ae49]">{ANGER_PRESET.name}</h2>
          <p className="mt-1 text-sm text-[#d8e0f4]">{t('studio.presetSummary', { bpm: ANGER_PRESET.bpm, signature: ANGER_PRESET.timeSignature.label })}</p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#aeb9d2]">{t('studio.presetDescription')}</p>
        </div>
        <button onClick={loadPreset} className="shrink-0 cursor-pointer rounded-xl border border-[#d89233] bg-[#f2ae49] px-4 py-3 font-bold text-[#1b2030] hover:brightness-105">{t('studio.loadPreset')}</button>
      </section>

      <section className="grid gap-[18px] min-[980px]:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
        <div className="space-y-[18px]">
          <section className="rounded-[22px] border border-[#314267] bg-[linear-gradient(145deg,#18233eeb,#111a2eee)] p-5 shadow-[0_24px_50px_#02050f55] sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="font-mono text-xs font-medium tracking-[.11em] text-[#f2ae49] uppercase">{t('studio.sequenceStep')}</div><h2 className="mt-2 text-lg font-bold">{t('studio.progression')}</h2></div><button className="cursor-pointer text-sm text-[#aeb9d2] hover:text-white" onClick={() => updateProgression([])}>{t('studio.clearSequence')}</button></div>
            <p className="mt-2 text-sm text-[#aeb9d2]">{t('studio.sequenceDescription')}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <Autocomplete
                id="chord-picker"
                options={STRUM_CHORDS}
                value={selectedChord}
                onChange={(_, chord) => setSelectedChord(chord)}
                getOptionLabel={(chord) => chord.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={t('studio.noChord')}
                slotProps={{
                  paper: { sx: { bgcolor: '#0e172a', color: '#eff3ff', border: '1px solid #435377', boxShadow: '0 18px 36px #02050fcc', '& .MuiAutocomplete-option': { fontFamily: 'DM Mono, ui-monospace, monospace', '&:hover': { bgcolor: '#1b2945' }, '&[aria-selected="true"]': { bgcolor: '#f2ae4922', color: '#f2ae49' } } } },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { bgcolor: '#0e172a', borderRadius: '0.75rem', color: '#eff3ff', fontFamily: 'DM Mono, ui-monospace, monospace', '& fieldset': { borderColor: '#435377' }, '&:hover fieldset': { borderColor: '#f2ae49' }, '&.Mui-focused fieldset': { borderColor: '#f2ae49' } },
                  '& .MuiInputLabel-root': { color: '#aeb9d2' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#f2ae49' },
                  '& .MuiSvgIcon-root': { color: '#aeb9d2' },
                }}
                renderInput={(params) => <TextField {...params} label={t('studio.searchChord')} placeholder={t('studio.searchPlaceholder')} />}
              />
              <button disabled={!selectedChord} className="cursor-pointer rounded-xl border border-[#d89233] bg-gradient-to-r from-[#f6b955] to-[#ee936a] px-4 py-3 font-semibold text-[#1b2030] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => selectedChord && updateProgression([...progression, selectedChord])}>{t('studio.addChord')}</button>
            </div>
            <div className="mt-5 min-h-[92px] rounded-[13px] border border-dashed border-[#435377] bg-[#0d1526]/70 p-3">
              {progression.length ? <div className="flex flex-wrap gap-2">{progression.map((chord, index) => <div aria-current={activeChord === index ? 'true' : undefined} className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 ${activeChord === index ? 'border-[#f2ae49] bg-[#f2ae4922]' : 'border-[#435377] bg-[#18233e]'}`} key={`${chord.id}-${index}`}>
                <span className="font-mono text-xs text-[#77e4bf]">{index + 1}</span><span className="font-mono font-bold text-[#f2ae49]">{chord.name}</span>
                <select aria-label={t('studio.chordDuration', { number: index + 1, name: chord.name })} value={chord.beats ?? 'bar'} onChange={(event) => updateProgression(progression.map((item, i) => i === index ? { ...item, beats: event.target.value === 'bar' ? undefined : Number(event.target.value) } : item))} className="rounded border border-[#435377] bg-[#0e172a] p-1 text-xs text-[#d8e0f4]">
                  <option value="bar">{t('studio.oneBar')}</option>{CHORD_DURATION_BEATS.map((beats) => <option key={beats} value={beats}>{t(beats === 1 ? 'studio.beat' : 'studio.beats', { count: beats })}</option>)}
                </select>
                <button className="cursor-pointer text-[#aeb9d2] hover:text-white" aria-label={t('studio.removeChord', { name: chord.name })} onClick={() => updateProgression(progression.filter((_, itemIndex) => itemIndex !== index))}>×</button>
              </div>)}</div> : <div className="grid h-[66px] place-items-center text-sm text-[#aeb9d2]">{t('studio.emptySequence')}</div>}
            </div>
          </section>

          <StrumPatternEditor pattern={pattern} subdivisions={subdivisions} activeStep={isPlaying ? activeBeat : NO_ACTIVE_STEP} onChange={setPattern} />
        </div>

        <aside className="h-fit rounded-[22px] border border-[#314267] bg-[linear-gradient(145deg,#18233eeb,#111a2eee)] p-5 shadow-[0_24px_50px_#02050f55] sm:p-6">
          <div className="font-mono text-xs font-medium tracking-[.11em] text-[#f2ae49] uppercase">{t('studio.metronomeStep')}</div><h2 className="mt-2 text-lg font-bold">{t('studio.groove')}</h2>
          <label className="mt-5 block text-sm font-semibold text-[#d8e0f4]" htmlFor="tempo">{t('studio.tempo')} <span className="float-right font-mono text-[#f2ae49]">{t('studio.bpm', { bpm })}</span></label>
          <input id="tempo" className="mt-3 w-full accent-[#f2ae49]" type="range" min={TEMPO_BPM.minimum} max={TEMPO_BPM.maximum} value={bpm} onChange={(event) => setBpm(Number(event.target.value))} />
          <div className="mt-2 flex justify-between font-mono text-xs text-[#8d9abb]"><span>{TEMPO_BPM.minimum}</span><span>{TEMPO_BPM.maximum}</span></div>
          <label className="mt-6 block text-sm font-semibold text-[#d8e0f4]" htmlFor="signature">{t('studio.timeSignature')}</label>
          <select id="signature" value={signature.label} onChange={(event) => updateSignature(event.target.value)} className="mt-2 w-full cursor-pointer rounded-xl border border-[#435377] bg-[#0e172a] px-3 py-3 text-sm text-[#eff3ff] outline-none focus:border-[#f2ae49]">{TIME_SIGNATURES.map((option) => <option key={option.label}>{option.label}</option>)}</select>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold transition ${metronomeEnabled ? 'border-[#77e4bf] bg-[#77e4bf18] text-[#77e4bf]' : 'border-[#435377] bg-[#0e172a] text-[#aeb9d2]'}`} onClick={() => setMetronomeEnabled((enabled) => !enabled)}>{metronomeEnabled ? t('studio.metronomeOn') : t('studio.metronomeOff')}</button>
            <button className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold transition ${subdivisions === SUBDIVISIONS.eighth ? 'border-[#f2ae49] bg-[#f2ae4918] text-[#f2ae49]' : 'border-[#435377] bg-[#0e172a] text-[#aeb9d2]'}`} onClick={() => updateSubdivisions(subdivisions === SUBDIVISIONS.eighth ? SUBDIVISIONS.quarter : SUBDIVISIONS.eighth)}>{subdivisions === SUBDIVISIONS.eighth ? t('studio.halfBeatsOn') : t('studio.addHalfBeats')}</button>
          </div>
          <label htmlFor="rhythm-grid" className="mt-4 block text-sm font-semibold text-[#d8e0f4]">{t('studio.rhythmGrid')}</label>
          <select id="rhythm-grid" value={subdivisions} onChange={(event) => updateSubdivisions(Number(event.target.value) as Subdivision)} className="mt-2 w-full rounded-xl border border-[#435377] bg-[#0e172a] px-3 py-3 text-sm text-[#eff3ff]">
            <option value={SUBDIVISIONS.quarter}>{t('studio.quarters')}</option><option value={SUBDIVISIONS.eighth}>{t('studio.eighths')}</option><option value={SUBDIVISIONS.sixteenth}>{t('studio.sixteenths')}</option>
          </select>
          <p className="mt-2 text-xs leading-relaxed text-[#aeb9d2]">{t('studio.gridDescription')}</p>
          <GuitarToneControls onChange={(tone) => audio.current?.setTone(tone)} />
          <div className="my-6 h-px bg-[#2b3a5c]" />
          <button className={`w-full cursor-pointer rounded-xl border px-4 py-3 font-extrabold transition ${isPlaying ? 'border-[#a65a55] bg-[#512a2a] text-[#ffd7d3] hover:bg-[#623333]' : 'border-[#d89233] bg-gradient-to-r from-[#f6b955] to-[#ee936a] text-[#1b2030] hover:brightness-105'}`} onClick={isPlaying ? stopPlayback : startPlayback}>{isPlaying ? t('studio.stop') : t('studio.play')}</button>
          <p className="mt-3 text-center text-sm text-[#aeb9d2]" role="status">{t(audioStatus)}</p>
          <div className="mt-5 rounded-xl bg-[#0d1526] p-4 text-sm leading-relaxed text-[#aeb9d2]"><span className="font-mono font-bold text-[#77e4bf]">{t('studio.howItLoops')}</span><br />{t('studio.loopDescription')}</div>
        </aside>
      </section>
      <footer className="mt-5 text-xs text-[#aeb9d2]">Guitar samples: <a className="underline underline-offset-2 hover:text-white" href="https://github.com/nbrosowsky/tonejs-instruments">N. P. Brosowsky / University of Iowa</a> · <a className="underline underline-offset-2 hover:text-white" href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a></footer>
    </div>
  </main>
}
