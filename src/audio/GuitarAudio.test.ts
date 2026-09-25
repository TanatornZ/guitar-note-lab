import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuitarAudio } from './GuitarAudio'

class FakeParam {
  value = 0
  setValueAtTime = vi.fn()
  linearRampToValueAtTime = vi.fn()
  exponentialRampToValueAtTime = vi.fn()
  cancelAndHoldAtTime = vi.fn()
}

class FakeNode {
  connect = vi.fn(() => this)
  disconnect = vi.fn()
}

class FakeSource extends FakeNode {
  buffer: AudioBuffer | null = null
  playbackRate = new FakeParam()
  detune = new FakeParam()
  start = vi.fn()
  stop = vi.fn()
  onended: (() => void) | null = null
}

class FakeGain extends FakeNode { gain = new FakeParam() }
class FakeFilter extends FakeNode {
  type = ''
  frequency = new FakeParam()
  Q = new FakeParam()
  gain = new FakeParam()
}
class FakeCompressor extends FakeNode {
  threshold = new FakeParam()
  knee = new FakeParam()
  ratio = new FakeParam()
  attack = new FakeParam()
  release = new FakeParam()
}
class FakeOscillator extends FakeNode {
  type = ''
  frequency = new FakeParam()
  start = vi.fn()
  stop = vi.fn()
}

class FakeAudioContext {
  static instance: FakeAudioContext
  currentTime = 4
  sampleRate = 12
  destination = new FakeNode()
  gains: FakeGain[] = []
  sources: FakeSource[] = []
  oscillators: FakeOscillator[] = []
  resume = vi.fn().mockResolvedValue(undefined)
  createGain = vi.fn(() => {
    const gain = new FakeGain()
    this.gains.push(gain)
    return gain
  })
  createBiquadFilter = vi.fn(() => new FakeFilter())
  createDynamicsCompressor = vi.fn(() => new FakeCompressor())
  createConvolver = vi.fn(() => new FakeNode())
  createBuffer = vi.fn((_channels: number, frames: number) => ({
    duration: 1.25,
    numberOfChannels: 2,
    getChannelData: vi.fn(() => new Float32Array(frames)),
  }))
  createBufferSource = vi.fn(() => {
    const source = new FakeSource()
    this.sources.push(source)
    return source
  })
  createOscillator = vi.fn(() => {
    const oscillator = new FakeOscillator()
    this.oscillators.push(oscillator)
    return oscillator
  })
  decodeAudioData = vi.fn().mockResolvedValue({ duration: 1.25 })

  constructor() { FakeAudioContext.instance = this }
}

describe('GuitarAudio', () => {
  const statuses: string[] = []

  beforeEach(() => {
    statuses.length = 0
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(2)) }))
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: undefined })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('loads recorded samples once and reports readiness', async () => {
    const guitar = new GuitarAudio((status) => statuses.push(status))

    await expect(guitar.prepare()).resolves.toBe(true)
    await expect(guitar.prepare()).resolves.toBe(true)

    expect(fetch).toHaveBeenCalledTimes(11)
    expect(FakeAudioContext.instance.decodeAudioData).toHaveBeenCalledTimes(11)
    expect(statuses).toContain('Loading acoustic guitar…')
    expect(statuses.at(-1)).toBe('Acoustic guitar ready')
  })

  it('plays individual notes and direction-aware strums using sample voices', async () => {
    const guitar = new GuitarAudio((status) => statuses.push(status))
    await guitar.play([48, 52])
    await guitar.playStrum([52, 48, 55], 'down')
    await guitar.playStrum([52, 48, 55], 'up')

    const sources = FakeAudioContext.instance.sources
    expect(sources).toHaveLength(8)
    expect(sources.every((source) => source.start.mock.calls.length === 1 && source.stop.mock.calls.length === 1)).toBe(true)
    expect(statuses).toContain('Downstroke playing')
    expect(statuses).toContain('Upstroke playing')
    sources[0].onended?.()
    expect(sources[0].disconnect).toHaveBeenCalled()
  })

  it('makes a metronome click and fades active voices when stopped', async () => {
    const guitar = new GuitarAudio((status) => statuses.push(status))
    await guitar.play([48])
    await guitar.playMetronome(true)
    guitar.stop()

    expect(FakeAudioContext.instance.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(1280, 4)
    expect(FakeAudioContext.instance.oscillators[0].stop).toHaveBeenCalledWith(4.06)
    expect(FakeAudioContext.instance.sources[0].stop).toHaveBeenLastCalledWith(4.03)
    expect(FakeAudioContext.instance.gains.some((gain) => gain.gain.cancelAndHoldAtTime.mock.calls.some(([time]) => time === 4))).toBe(true)
  })

  it('returns a helpful status when browser audio or samples are unavailable', async () => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined })
    const unsupported = new GuitarAudio((status) => statuses.push(status))
    await expect(unsupported.prepare()).resolves.toBe(false)
    expect(statuses.at(-1)).toBe('Sound could not load. Click Play to retry.')

    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, arrayBuffer: vi.fn() }))
    const unavailable = new GuitarAudio((status) => statuses.push(status))
    await unavailable.play([48])
    expect(statuses).toContain('Sound could not load. Click a note to retry.')
  })

  it('can stop safely before an audio context exists', () => {
    const guitar = new GuitarAudio((status) => statuses.push(status))
    expect(() => guitar.stop()).not.toThrow()
  })
})
