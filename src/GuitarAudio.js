const samples = [[40, 'E2'], [45, 'A2'], [48, 'C3'], [52, 'E3'], [55, 'G3'], [59, 'B3'], [62, 'D4'], [65, 'F4'], [69, 'A4'], [72, 'C5'], [74, 'D5']]

export class GuitarAudio {
  constructor(onStatus) {
    this.onStatus = onStatus
    this.buffers = new Map()
    this.voices = new Set()
  }

  async setup() {
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext
      if (!Context) throw new Error('Audio is not supported by this browser.')
      this.context = new Context()
      this.master = this.context.createGain()
      this.master.gain.value = 0.65
      this.compressor = this.context.createDynamicsCompressor()
      this.compressor.threshold.value = -12
      this.compressor.knee.value = 12
      this.compressor.ratio.value = 4
      this.compressor.attack.value = 0.003
      this.compressor.release.value = 0.2
      this.master.connect(this.compressor).connect(this.context.destination)
    }
    await this.context.resume()
    if (!this.loading) {
      this.onStatus('Loading acoustic guitar…')
      this.loading = Promise.all(samples.map(async ([midi, file]) => {
        const response = await fetch(`/audio/guitar/${file}.mp3`)
        if (!response.ok) throw new Error('Guitar audio could not load.')
        this.buffers.set(midi, await this.context.decodeAudioData(await response.arrayBuffer()))
      })).catch((error) => { this.loading = null; throw error })
    }
    await this.loading
  }

  async play(midis, strum = false) {
    try {
      await this.setup()
      const start = this.context.currentTime + 0.015
      midis.forEach((midi, index) => this.schedule(midi, start + (strum ? index * 0.045 : 0), midis.length))
      this.onStatus('Acoustic guitar ready')
    } catch (error) {
      this.onStatus('Sound could not load. Click a note to retry.')
      console.warn('Guitar playback:', error)
    }
  }

  schedule(midi, when, chordSize) {
    const [sampleMidi] = samples.reduce((nearest, sample) => Math.abs(sample[0] - midi) < Math.abs(nearest[0] - midi) ? sample : nearest)
    const source = this.context.createBufferSource()
    const gain = this.context.createGain()
    source.buffer = this.buffers.get(sampleMidi)
    source.playbackRate.value = 2 ** ((midi - sampleMidi) / 12)
    const duration = Math.min(source.buffer.duration / source.playbackRate.value, 5)
    const volume = (0.72 + Math.random() * 0.04) / Math.sqrt(Math.max(1, chordSize))
    gain.gain.setValueAtTime(0, when)
    gain.gain.linearRampToValueAtTime(volume, when + 0.004)
    gain.gain.setValueAtTime(volume, when + Math.max(0.005, duration - 0.18))
    gain.gain.linearRampToValueAtTime(0, when + duration)
    source.connect(gain).connect(this.master)
    const voice = { source, gain }
    this.voices.add(voice)
    source.onended = () => { source.disconnect(); gain.disconnect(); this.voices.delete(voice) }
    source.start(when)
    source.stop(when + duration + 0.01)
  }

  stop() {
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
