import { DEFAULT_GUITAR_TONE, GUITAR_TONE_BANDS, TONE_LIMIT, TONE_FILTER_Q, TONE_SMOOTHING_SECONDS, NEUTRAL_TONE_DB, type GuitarTone } from '../data/guitarTone'
import { GUITAR_OUTPUT, METRONOME, NOTE_PLAYBACK, RANDOM_MIDPOINT, ROOM_REVERB, STRUM_PLAYBACK } from '../constants/audio'
import { OCTAVE_FREQUENCY_RATIO, SEMITONES_PER_OCTAVE } from '../constants/music'

type StatusHandler = (status: string) => void

type Voice = {
  source: AudioBufferSourceNode
  gain: GainNode
  midi: number
  strummed: boolean
  releasing: boolean
}

type NoteOptions = {
  velocity?: number
  detune?: number
  brightness?: number
  strummed?: boolean
}

const SAMPLES: Array<[midi: number, file: string]> = [
  [40, 'E2'], [45, 'A2'], [48, 'C3'], [52, 'E3'], [55, 'G3'], [59, 'B3'],
  [62, 'D4'], [65, 'F4'], [69, 'A4'], [72, 'C5'], [74, 'D5'],
]

export class GuitarAudio {
  private context?: AudioContext
  private master?: GainNode
  private output?: DynamicsCompressorNode
  private loading?: Promise<void>
  private playbackGeneration = 0
  private tone: GuitarTone = { ...DEFAULT_GUITAR_TONE }
  private readonly toneFilters = new Map<keyof GuitarTone, BiquadFilterNode>()
  private readonly buffers = new Map<number, AudioBuffer>()
  private readonly voices = new Set<Voice>()

  constructor(private readonly onStatus: StatusHandler) {}

  setTone(tone: GuitarTone): void {
    for (const { key } of GUITAR_TONE_BANDS) {
      const value = Number.isFinite(tone[key]) ? Math.max(-TONE_LIMIT, Math.min(TONE_LIMIT, tone[key])) : NEUTRAL_TONE_DB
      this.tone[key] = value
      const filter = this.toneFilters.get(key)
      if (filter && this.context) {
        // Smooth live slider changes, including the sound of notes already ringing.
        filter.gain.cancelAndHoldAtTime(this.context.currentTime)
        filter.gain.setTargetAtTime(value, this.context.currentTime, TONE_SMOOTHING_SECONDS)
      }
    }
  }

  private async setup(): Promise<void> {
    if (!this.context) {
      const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextConstructor) throw new Error('Audio is not supported by this browser.')

      this.context = new AudioContextConstructor()
      this.master = this.context.createGain()
      this.master.gain.value = GUITAR_OUTPUT.masterGain

      const body = this.context.createBiquadFilter()
      body.type = 'peaking'
      body.frequency.value = GUITAR_OUTPUT.bodyFrequencyHz
      body.Q.value = GUITAR_OUTPUT.bodyQ
      body.gain.value = GUITAR_OUTPUT.bodyGainDb

      const compressor = this.context.createDynamicsCompressor()
      compressor.threshold.value = GUITAR_OUTPUT.compressorThresholdDb
      compressor.knee.value = GUITAR_OUTPUT.compressorKneeDb
      compressor.ratio.value = GUITAR_OUTPUT.compressorRatio
      compressor.attack.value = GUITAR_OUTPUT.compressorAttackSeconds
      compressor.release.value = GUITAR_OUTPUT.compressorReleaseSeconds
      this.output = compressor

      const room = this.context.createConvolver()
      room.buffer = this.createRoomImpulse(ROOM_REVERB.durationSeconds, ROOM_REVERB.decayExponent)
      const roomGain = this.context.createGain()
      roomGain.gain.value = ROOM_REVERB.wetGain

      this.master.connect(body)
      let guitarOutput = body
      for (const { key, frequency, type } of GUITAR_TONE_BANDS) {
        const filter = this.context.createBiquadFilter()
        filter.type = type
        filter.frequency.value = frequency
        filter.Q.value = TONE_FILTER_Q
        filter.gain.value = this.tone[key]
        this.toneFilters.set(key, filter)
        guitarOutput.connect(filter)
        guitarOutput = filter
      }
      // Shape both direct guitar and room sound; the metronome bypasses these filters.
      guitarOutput.connect(compressor)
      guitarOutput.connect(room).connect(roomGain).connect(compressor)
      compressor.connect(this.context.destination)
    }

    await this.context.resume()
    if (!this.loading) {
      this.onStatus('Loading acoustic guitar…')
      this.loading = Promise.all(SAMPLES.map(async ([midi, file]) => {
        const response = await fetch(`/audio/guitar/${file}.mp3`)
        if (!response.ok) throw new Error('Guitar audio could not load.')
        this.buffers.set(midi, await this.context!.decodeAudioData(await response.arrayBuffer()))
      })).then(() => undefined).catch((error: unknown) => {
        this.loading = undefined
        throw error
      })
    }
    await this.loading
  }

  async prepare(): Promise<boolean> {
    const generation = this.playbackGeneration
    try {
      await this.setup()
      if (generation !== this.playbackGeneration) return false
      this.onStatus('Acoustic guitar ready')
      return true
    } catch (error) {
      this.onStatus('Sound could not load. Click Play to retry.')
      console.warn('Guitar playback:', error)
      return false
    }
  }

  async play(midis: number[], strum = false): Promise<void> {
    const generation = this.playbackGeneration
    try {
      await this.setup()
      if (generation !== this.playbackGeneration) return
      if (strum) {
        this.scheduleStrum(midis, 'down')
      } else {
        const start = this.context!.currentTime + NOTE_PLAYBACK.startDelaySeconds
        midis.forEach((midi) => this.schedule(midi, start, midis.length, {
          velocity: NOTE_PLAYBACK.velocityMinimum + Math.random() * NOTE_PLAYBACK.velocityVariation,
          detune: (Math.random() - RANDOM_MIDPOINT) * NOTE_PLAYBACK.detuneRangeCents,
        }))
      }
      this.onStatus('Acoustic guitar ready')
    } catch (error) {
      this.onStatus('Sound could not load. Click a note to retry.')
      console.warn('Guitar playback:', error)
    }
  }

  async playStrum(midis: number[], direction: 'down' | 'up', accent = false): Promise<void> {
    const generation = this.playbackGeneration
    try {
      await this.setup()
      if (generation !== this.playbackGeneration) return
      this.scheduleStrum(midis, direction, accent)
      this.onStatus(`${direction === 'down' ? 'Down' : 'Up'}stroke playing`)
    } catch (error) {
      this.onStatus('Sound could not load. Click Play to retry.')
      console.warn('Guitar playback:', error)
    }
  }

  async playMetronome(accent = false): Promise<void> {
    const generation = this.playbackGeneration
    try {
      await this.setup()
      if (generation !== this.playbackGeneration) return
      const oscillator = this.context!.createOscillator()
      const gain = this.context!.createGain()
      const start = this.context!.currentTime
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(accent ? METRONOME.accentFrequencyHz : METRONOME.beatFrequencyHz, start)
      gain.gain.setValueAtTime(METRONOME.nearSilentGain, start)
      gain.gain.exponentialRampToValueAtTime(accent ? METRONOME.accentGain : METRONOME.beatGain, start + METRONOME.attackSeconds)
      gain.gain.exponentialRampToValueAtTime(METRONOME.nearSilentGain, start + METRONOME.decaySeconds)
      oscillator.connect(gain).connect(this.output!)
      oscillator.start(start)
      oscillator.stop(start + METRONOME.durationSeconds)
    } catch (error) {
      console.warn('Metronome playback:', error)
    }
  }

  private scheduleStrum(midis: number[], direction: 'down' | 'up', accent = false): void {
    const chord = [...midis].sort((a, b) => a - b)
    // A returning pick usually brushes the treble strings; the bass keeps ringing.
    const orderedNotes = direction === 'down' ? chord : chord.slice(-STRUM_PLAYBACK.upstrokeStringCount).reverse()
    const start = this.context!.currentTime + STRUM_PLAYBACK.startDelaySeconds
    const baseGap = direction === 'down' ? STRUM_PLAYBACK.downstrokeGapSeconds : STRUM_PLAYBACK.upstrokeGapSeconds
    const directionVelocity = direction === 'down' ? STRUM_PLAYBACK.downstrokeVelocity : STRUM_PLAYBACK.upstrokeVelocity
    const strokeVelocity = directionVelocity * (accent ? STRUM_PLAYBACK.accentMultiplier : 1)
      * (STRUM_PLAYBACK.velocityMinimum + Math.random() * STRUM_PLAYBACK.velocityVariation)
    let offset = 0

    // Release notes no longer held by the fretting hand before the new chord.
    this.voices.forEach((voice) => {
      if (voice.strummed && !voice.releasing && !chord.includes(voice.midi)) this.releaseVoice(voice, start, STRUM_PLAYBACK.chordChangeReleaseSeconds)
    })

    orderedNotes.forEach((midi, index) => {
      if (index > 0) offset += baseGap * (STRUM_PLAYBACK.gapMinimumMultiplier + Math.random() * STRUM_PLAYBACK.gapVariation)
      const position = orderedNotes.length > 1 ? index / (orderedNotes.length - 1) : 0
      const when = start + offset
      this.voices.forEach((voice) => {
        // Preserve the ringing tail beneath the next pick attack.
        if (voice.strummed && !voice.releasing && voice.midi === midi) this.releaseVoice(voice, when, STRUM_PLAYBACK.repeatedStringReleaseSeconds)
      })
      this.schedule(midi, when, chord.length, {
        velocity: strokeVelocity * (STRUM_PLAYBACK.leadingStringVelocity - position * STRUM_PLAYBACK.trailingStringVelocityReduction)
          * (STRUM_PLAYBACK.stringVelocityMinimum + Math.random() * STRUM_PLAYBACK.stringVelocityVariation),
        detune: (Math.random() - RANDOM_MIDPOINT) * STRUM_PLAYBACK.detuneRangeCents,
        brightness: STRUM_PLAYBACK.baseBrightnessHz + strokeVelocity * STRUM_PLAYBACK.velocityBrightnessHz
          - position * STRUM_PLAYBACK.trailingStringBrightnessReductionHz,
        strummed: true,
      })
    })
  }

  private schedule(midi: number, when: number, chordSize: number, options: NoteOptions = {}): void {
    const [sampleMidi] = SAMPLES.reduce((nearest, sample) => Math.abs(sample[0] - midi) < Math.abs(nearest[0] - midi) ? sample : nearest)
    const source = this.context!.createBufferSource()
    const gain = this.context!.createGain()
    const tone = this.context!.createBiquadFilter()
    source.buffer = this.buffers.get(sampleMidi)!
    source.playbackRate.value = OCTAVE_FREQUENCY_RATIO ** ((midi - sampleMidi) / SEMITONES_PER_OCTAVE)
    source.detune.value = options.detune ?? 0
    tone.type = 'lowpass'
    const brightness = options.brightness ?? NOTE_PLAYBACK.brightnessHz
    tone.frequency.setValueAtTime(brightness, when)
    // Keep the recorded pick attack, then let the bright overtones soften.
    tone.frequency.exponentialRampToValueAtTime(brightness * NOTE_PLAYBACK.sustainedBrightnessRatio, when + NOTE_PLAYBACK.brightnessDecaySeconds)
    tone.Q.value = NOTE_PLAYBACK.lowpassQ
    // The recording already contains the guitar's natural decay; do not truncate it.
    const duration = source.buffer.duration / source.playbackRate.value
    const volume = ((NOTE_PLAYBACK.gainMinimum + Math.random() * NOTE_PLAYBACK.gainVariation) * (options.velocity ?? 1)) / Math.sqrt(Math.max(1, chordSize))

    gain.gain.setValueAtTime(0, when)
    gain.gain.linearRampToValueAtTime(volume, when + NOTE_PLAYBACK.attackSeconds + Math.random() * NOTE_PLAYBACK.attackVariationSeconds)
    gain.gain.setValueAtTime(volume, when + Math.max(NOTE_PLAYBACK.minimumHoldSeconds, duration - NOTE_PLAYBACK.endFadeSeconds))
    gain.gain.linearRampToValueAtTime(0, when + duration)
    source.connect(tone).connect(gain).connect(this.master!)

    const voice = { source, gain, midi, strummed: options.strummed ?? false, releasing: false }
    this.voices.add(voice)
    source.onended = () => {
      source.disconnect()
      tone.disconnect()
      gain.disconnect()
      this.voices.delete(voice)
    }
    source.start(when)
    source.stop(when + duration + NOTE_PLAYBACK.endStopPaddingSeconds)
  }

  private releaseVoice(voice: Voice, when: number, releaseSeconds: number = NOTE_PLAYBACK.stopReleaseSeconds): void {
    voice.gain.gain.cancelAndHoldAtTime(when)
    voice.gain.gain.linearRampToValueAtTime(0, when + releaseSeconds)
    voice.source.stop(when + releaseSeconds + NOTE_PLAYBACK.releaseStopPaddingSeconds)
    // Keep fading voices tracked until onended so Stop can silence their tails too.
    voice.releasing = true
  }

  private createRoomImpulse(seconds: number, decay: number): AudioBuffer {
    const frameCount = Math.floor(this.context!.sampleRate * seconds)
    const impulse = this.context!.createBuffer(ROOM_REVERB.channels, frameCount, this.context!.sampleRate)
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel)
      for (let frame = 0; frame < frameCount; frame += 1) {
        const envelope = (1 - frame / frameCount) ** decay
        const noise = (Math.random() - RANDOM_MIDPOINT) / RANDOM_MIDPOINT
        data[frame] = noise * envelope
      }
    }
    return impulse
  }

  stop(): void {
    this.playbackGeneration += 1
    if (!this.context) return
    const now = this.context.currentTime
    this.voices.forEach((voice) => this.releaseVoice(voice, now))
  }
}
