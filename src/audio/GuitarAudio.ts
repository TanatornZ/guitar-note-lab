type StatusHandler = (status: string) => void

type Voice = {
  source: AudioBufferSourceNode
  gain: GainNode
}

type NoteOptions = {
  velocity?: number
  detune?: number
  brightness?: number
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
  private readonly buffers = new Map<number, AudioBuffer>()
  private readonly voices = new Set<Voice>()

  constructor(private readonly onStatus: StatusHandler) {}

  private async setup(): Promise<void> {
    if (!this.context) {
      const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextConstructor) throw new Error('Audio is not supported by this browser.')

      this.context = new AudioContextConstructor()
      this.master = this.context.createGain()
      this.master.gain.value = 0.62

      const body = this.context.createBiquadFilter()
      body.type = 'peaking'
      body.frequency.value = 185
      body.Q.value = 0.8
      body.gain.value = 1.8

      const compressor = this.context.createDynamicsCompressor()
      compressor.threshold.value = -12
      compressor.knee.value = 12
      compressor.ratio.value = 4
      compressor.attack.value = 0.003
      compressor.release.value = 0.2
      this.output = compressor

      const room = this.context.createConvolver()
      room.buffer = this.createRoomImpulse(0.72, 2.8)
      const roomGain = this.context.createGain()
      roomGain.gain.value = 0.085

      this.master.connect(body)
      body.connect(compressor)
      body.connect(room).connect(roomGain).connect(compressor)
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
    try {
      await this.setup()
      this.onStatus('Acoustic guitar ready')
      return true
    } catch (error) {
      this.onStatus('Sound could not load. Click Play to retry.')
      console.warn('Guitar playback:', error)
      return false
    }
  }

  async play(midis: number[], strum = false): Promise<void> {
    try {
      await this.setup()
      if (strum) {
        this.scheduleStrum(midis, 'down')
      } else {
        const start = this.context!.currentTime + 0.015
        midis.forEach((midi) => this.schedule(midi, start, midis.length, { velocity: 0.96 + Math.random() * 0.08, detune: (Math.random() - 0.5) * 3 }))
      }
      this.onStatus('Acoustic guitar ready')
    } catch (error) {
      this.onStatus('Sound could not load. Click a note to retry.')
      console.warn('Guitar playback:', error)
    }
  }

  async playStrum(midis: number[], direction: 'down' | 'up'): Promise<void> {
    try {
      await this.setup()
      this.scheduleStrum(midis, direction)
      this.onStatus(`${direction === 'down' ? 'Down' : 'Up'}stroke playing`)
    } catch (error) {
      this.onStatus('Sound could not load. Click Play to retry.')
      console.warn('Guitar playback:', error)
    }
  }

  async playMetronome(accent = false): Promise<void> {
    try {
      await this.setup()
      const oscillator = this.context!.createOscillator()
      const gain = this.context!.createGain()
      const start = this.context!.currentTime
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(accent ? 1280 : 860, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(accent ? 0.18 : 0.1, start + 0.003)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.055)
      oscillator.connect(gain).connect(this.output!)
      oscillator.start(start)
      oscillator.stop(start + 0.06)
    } catch (error) {
      console.warn('Metronome playback:', error)
    }
  }

  private scheduleStrum(midis: number[], direction: 'down' | 'up'): void {
    const orderedNotes = [...midis].sort((a, b) => direction === 'down' ? a - b : b - a)
    const start = this.context!.currentTime + 0.012
    const baseGap = direction === 'down' ? 0.027 : 0.023
    let offset = 0

    orderedNotes.forEach((midi, index) => {
      if (index > 0) offset += baseGap + (Math.random() - 0.5) * 0.009
      const position = orderedNotes.length > 1 ? index / (orderedNotes.length - 1) : 0
      const directionalAccent = direction === 'down' ? 1.08 - position * 0.17 : 0.91 + position * 0.16
      this.schedule(midi, start + offset, orderedNotes.length, {
        velocity: directionalAccent * (0.96 + Math.random() * 0.08),
        detune: (Math.random() - 0.5) * 7,
        brightness: direction === 'down' ? 7600 - position * 700 : 6900 + position * 650,
      })
    })
  }

  private schedule(midi: number, when: number, chordSize: number, options: NoteOptions = {}): void {
    const [sampleMidi] = SAMPLES.reduce((nearest, sample) => Math.abs(sample[0] - midi) < Math.abs(nearest[0] - midi) ? sample : nearest)
    const source = this.context!.createBufferSource()
    const gain = this.context!.createGain()
    const tone = this.context!.createBiquadFilter()
    source.buffer = this.buffers.get(sampleMidi)!
    source.playbackRate.value = 2 ** ((midi - sampleMidi) / 12)
    source.detune.value = options.detune ?? 0
    tone.type = 'lowpass'
    tone.frequency.value = options.brightness ?? 7400
    tone.Q.value = 0.28
    const duration = Math.min(source.buffer.duration / source.playbackRate.value, 5)
    const volume = ((0.7 + Math.random() * 0.045) * (options.velocity ?? 1)) / Math.sqrt(Math.max(1, chordSize))

    gain.gain.setValueAtTime(0, when)
    gain.gain.linearRampToValueAtTime(volume, when + 0.003 + Math.random() * 0.002)
    gain.gain.setValueAtTime(volume, when + Math.max(0.006, duration - 0.22))
    gain.gain.linearRampToValueAtTime(0, when + duration)
    source.connect(tone).connect(gain).connect(this.master!)

    const voice = { source, gain }
    this.voices.add(voice)
    source.onended = () => {
      source.disconnect()
      tone.disconnect()
      gain.disconnect()
      this.voices.delete(voice)
    }
    source.start(when)
    source.stop(when + duration + 0.01)
  }

  private createRoomImpulse(seconds: number, decay: number): AudioBuffer {
    const frameCount = Math.floor(this.context!.sampleRate * seconds)
    const impulse = this.context!.createBuffer(2, frameCount, this.context!.sampleRate)
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel)
      for (let frame = 0; frame < frameCount; frame += 1) {
        const envelope = (1 - frame / frameCount) ** decay
        data[frame] = (Math.random() * 2 - 1) * envelope
      }
    }
    return impulse
  }

  stop(): void {
    if (!this.context) return
    const now = this.context.currentTime
    this.voices.forEach(({ source, gain }) => {
      gain.gain.cancelAndHoldAtTime(now)
      gain.gain.linearRampToValueAtTime(0, now + 0.025)
      source.stop(now + 0.03)
    })
    this.voices.clear()
  }
}
