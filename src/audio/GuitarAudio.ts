type StatusHandler = (status: string) => void

type Voice = {
  source: AudioBufferSourceNode
  gain: GainNode
}

const SAMPLES: Array<[midi: number, file: string]> = [
  [40, 'E2'], [45, 'A2'], [48, 'C3'], [52, 'E3'], [55, 'G3'], [59, 'B3'],
  [62, 'D4'], [65, 'F4'], [69, 'A4'], [72, 'C5'], [74, 'D5'],
]

export class GuitarAudio {
  private context?: AudioContext
  private master?: GainNode
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
      this.master.gain.value = 0.65
      const compressor = this.context.createDynamicsCompressor()
      compressor.threshold.value = -12
      compressor.knee.value = 12
      compressor.ratio.value = 4
      compressor.attack.value = 0.003
      compressor.release.value = 0.2
      this.master.connect(compressor).connect(this.context.destination)
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
      const start = this.context!.currentTime + 0.015
      midis.forEach((midi, index) => this.schedule(midi, start + (strum ? index * 0.045 : 0), midis.length))
      this.onStatus('Acoustic guitar ready')
    } catch (error) {
      this.onStatus('Sound could not load. Click a note to retry.')
      console.warn('Guitar playback:', error)
    }
  }

  async playStrum(midis: number[], direction: 'down' | 'up'): Promise<void> {
    try {
      await this.setup()
      const orderedNotes = [...midis].sort((a, b) => direction === 'down' ? a - b : b - a)
      const start = this.context!.currentTime + 0.01
      orderedNotes.forEach((midi, index) => this.schedule(midi, start + index * 0.042, orderedNotes.length))
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
      oscillator.connect(gain).connect(this.master!)
      oscillator.start(start)
      oscillator.stop(start + 0.06)
    } catch (error) {
      console.warn('Metronome playback:', error)
    }
  }

  private schedule(midi: number, when: number, chordSize: number): void {
    const [sampleMidi] = SAMPLES.reduce((nearest, sample) => Math.abs(sample[0] - midi) < Math.abs(nearest[0] - midi) ? sample : nearest)
    const source = this.context!.createBufferSource()
    const gain = this.context!.createGain()
    source.buffer = this.buffers.get(sampleMidi)!
    source.playbackRate.value = 2 ** ((midi - sampleMidi) / 12)
    const duration = Math.min(source.buffer.duration / source.playbackRate.value, 5)
    const volume = (0.72 + Math.random() * 0.04) / Math.sqrt(Math.max(1, chordSize))

    gain.gain.setValueAtTime(0, when)
    gain.gain.linearRampToValueAtTime(volume, when + 0.004)
    gain.gain.setValueAtTime(volume, when + Math.max(0.005, duration - 0.18))
    gain.gain.linearRampToValueAtTime(0, when + duration)
    source.connect(gain).connect(this.master!)

    const voice = { source, gain }
    this.voices.add(voice)
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
      this.voices.delete(voice)
    }
    source.start(when)
    source.stop(when + duration + 0.01)
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
