import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuitarAudio } from './GuitarAudio'
import { ANGER_PRESET } from '../data/strumPresets'

class FakeParam {
  value = 0
  setValueAtTime = vi.fn()
  linearRampToValueAtTime = vi.fn()
  exponentialRampToValueAtTime = vi.fn()
  cancelAndHoldAtTime = vi.fn()
  setTargetAtTime = vi.fn()
}

class FakeNode {
  connect = vi.fn((destination: FakeNode) => destination)
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
  filters: FakeFilter[] = []
  oscillators: FakeOscillator[] = []
  resume = vi.fn().mockResolvedValue(undefined)
  createGain = vi.fn(() => {
    const gain = new FakeGain()
    this.gains.push(gain)
    return gain
  })
  createBiquadFilter = vi.fn(() => {
    const filter = new FakeFilter()
    this.filters.push(filter)
    return filter
  })
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
  decodeAudioData = vi.fn().mockImplementation(async () => ({
    duration: 1.25,
    sampleRate: 1000,
    length: 1250,
    numberOfChannels: 1,
    getChannelData: () => new Float32Array(1250),
  }))

  constructor() { FakeAudioContext.instance = this }
}

describe('GuitarAudio', () => {
  const statuses: string[] = []

  beforeEach(() => {
    statuses.length = 0
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
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
    expect(statuses).toContain('audio.loading')
    expect(statuses.at(-1)).toBe('audio.ready')
  })

  it.each(['finder', 'studio'] as const)('anchors ringing notes before a repeated %s chord fades', async (page) => {
    const guitar = new GuitarAudio(() => undefined)
    const play = () => page === 'finder' ? guitar.play([48, 52, 55], true) : guitar.playStrum([48, 52, 55], 'down')
    await play()
    const context = FakeAudioContext.instance
    const ringing = context.sources.slice()
    context.currentTime += 0.3
    await play()
    ringing.forEach((source, index) => {
      const filter = source.connect.mock.results[0].value as FakeFilter
      const gain = filter.connect.mock.results[0].value as FakeGain
      const volume = gain.gain.linearRampToValueAtTime.mock.calls[0][0]
      const nextAttack = context.sources[index + ringing.length].start.mock.calls[0][0]
      expect(gain.gain.cancelAndHoldAtTime).toHaveBeenLastCalledWith(nextAttack)
      expect(gain.gain.setValueAtTime).toHaveBeenLastCalledWith(volume, nextAttack)
      expect(gain.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, nextAttack + 0.22)
    })
  })

  it('de-clicks every attack in the full Anger preset without adding sounds on rests', async () => {
    const guitar = new GuitarAudio(() => undefined)
    await guitar.prepare()
    const context = FakeAudioContext.instance
    let step = 0
    let strokes = 0
    for (const chord of ANGER_PRESET.progression) {
      for (let index = 0; index < chord.beats! * ANGER_PRESET.subdivisions; index++, step++) {
        context.currentTime = 4 + step * 60 / ANGER_PRESET.bpm / ANGER_PRESET.subdivisions
        const pattern = ANGER_PRESET.pattern[step % ANGER_PRESET.pattern.length]
        if (pattern.direction === 'rest') continue
        await guitar.playStrum(chord.midis, pattern.direction, pattern.accent)
        strokes++
      }
    }
    expect(strokes).toBe(48)
    expect(context.sources).toHaveLength(231)
    expect(context.oscillators).toHaveLength(0)
    context.sources.forEach((source) => {
      const when = source.start.mock.calls[0][0]
      const filter = source.connect.mock.results[0].value as FakeFilter
      const gain = filter.connect.mock.results[0].value as FakeGain
      const opening = filter.frequency.exponentialRampToValueAtTime.mock.calls[0]
      expect(filter.frequency.setValueAtTime.mock.calls[0][0]).toBeCloseTo(opening[0] * 0.35)
      expect(opening[1] - when).toBeCloseTo(0.025)
      expect(gain.gain.value).toBe(0)
      expect(gain.gain.linearRampToValueAtTime.mock.calls[0][1] - when).toBeCloseTo(0.009)
      expect(source.stop.mock.calls[0][0] - when).toBeCloseTo(1.25 / source.playbackRate.value + 0.01)
    })
    guitar.stop()
    expect(context.sources.every(source => Math.abs(source.stop.mock.lastCall![0] - context.currentTime - 0.03) < 0.0001)).toBe(true)
  })

  it('skips the noisy lead-in on every strike and preserves the transposed tail', async () => {
    const guitar = new GuitarAudio(() => undefined)
    const pending = guitar.prepare()
    const context = FakeAudioContext.instance
    const data = new Float32Array(1250).fill(0.001)
    data.fill(0.5, 30)
    context.decodeAudioData.mockImplementation(async () => ({
      duration: 1.25, sampleRate: 1000, length: data.length, numberOfChannels: 1,
      getChannelData: () => data,
    }))
    await pending
    await guitar.playStrum([40, 41], 'down')
    context.currentTime += 0.3
    await guitar.playStrum([40, 41], 'up')
    await guitar.play([40])
    for (const source of context.sources) {
      const [when, offset] = source.start.mock.calls[0]
      expect(offset).toBeCloseTo(0.028)
      expect(source.stop.mock.calls[0][0]).toBeCloseTo(when + (1.25 - offset) / source.playbackRate.value + 0.01)
      const gain = source.connect.mock.results[0].value.connect.mock.results[0].value as FakeGain
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, when)
      expect(gain.gain.value).toBe(0)
      expect(gain.gain.linearRampToValueAtTime.mock.calls[0][1]).toBeCloseTo(when + 0.009)
    }
    expect(context.decodeAudioData).toHaveBeenCalledTimes(11)
  })

  it('stores tone before audio starts and connects all three bands to the guitar path', async () => {
    const guitar = new GuitarAudio(() => undefined)
    guitar.setTone({ bass: 6, middle: -3, treble: 4 })
    expect(fetch).not.toHaveBeenCalled()
    await guitar.prepare()
    const context = FakeAudioContext.instance
    const [body, bass, middle, treble] = context.filters
    expect([bass.type, middle.type, treble.type]).toEqual(['lowshelf', 'peaking', 'highshelf'])
    expect([bass.frequency.value, middle.frequency.value, treble.frequency.value]).toEqual([200, 800, 3200])
    expect([bass.gain.value, middle.gain.value, treble.gain.value]).toEqual([6, -3, 4])
    expect(body.connect).toHaveBeenCalledWith(bass)
    expect(bass.connect).toHaveBeenCalledWith(middle)
    expect(middle.connect).toHaveBeenCalledWith(treble)
    const compressor = context.createDynamicsCompressor.mock.results[0].value
    expect(treble.connect).toHaveBeenCalledWith(compressor)
    await guitar.playMetronome()
    expect(context.gains.at(-1)!.connect).toHaveBeenCalledWith(compressor)
  })

  it('smoothly adjusts and resets ringing guitar tone without restarting notes', async () => {
    const guitar = new GuitarAudio(() => undefined)
    await guitar.playStrum([48, 52, 55], 'down')
    const context = FakeAudioContext.instance
    const filters = context.filters.slice(1, 4)
    expect(filters.map((filter) => filter.gain.value)).toEqual([0, 0, 0])
    guitar.setTone({ bass: 5, middle: -2, treble: 8 })
    filters.forEach((filter, index) => {
      expect(filter.gain.cancelAndHoldAtTime).toHaveBeenCalledWith(4)
      expect(filter.gain.setTargetAtTime).toHaveBeenLastCalledWith([5, -2, 8][index], 4, 0.015)
    })
    expect(context.sources).toHaveLength(3)
    expect(context.sources.every((source) => source.stop.mock.calls.length === 1)).toBe(true)
    guitar.setTone({ bass: 0, middle: 0, treble: 0 })
    filters.forEach((filter) => expect(filter.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 4, 0.015))
  })

  it('clamps excessive EQ gain and replaces non-finite values with neutral gain', async () => {
    const guitar = new GuitarAudio(() => undefined)
    guitar.setTone({ bass: 100, middle: -100, treble: NaN })
    await guitar.prepare()
    expect(FakeAudioContext.instance.filters.slice(1, 4).map((filter) => filter.gain.value)).toEqual([12, -12, 0])
  })

  it('plays individual notes and direction-aware strums using sample voices', async () => {
    const guitar = new GuitarAudio((status) => statuses.push(status))
    await guitar.play([48, 52])
    await guitar.playStrum([52, 48, 55], 'down')
    await guitar.playStrum([52, 48, 55], 'up')

    const sources = FakeAudioContext.instance.sources
    expect(sources).toHaveLength(8)
    expect(sources.every((source) => source.start.mock.calls.length === 1 && source.stop.mock.calls.length >= 1)).toBe(true)
    expect(statuses).toContain('audio.downstroke')
    expect(statuses).toContain('audio.upstroke')
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
    expect(FakeAudioContext.instance.sources[0].stop.mock.lastCall![0]).toBeCloseTo(4.03)
    expect(FakeAudioContext.instance.gains.some((gain) => gain.gain.cancelAndHoldAtTime.mock.calls.some(([time]) => time === 4))).toBe(true)
  })

  it('returns a helpful status when browser audio or samples are unavailable', async () => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined })
    const unsupported = new GuitarAudio((status) => statuses.push(status))
    await expect(unsupported.prepare()).resolves.toBe(false)
    expect(statuses.at(-1)).toBe('audio.loadFailedRetry')

    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, arrayBuffer: vi.fn() }))
    const unavailable = new GuitarAudio((status) => statuses.push(status))
    await unavailable.play([48])
    expect(statuses).toContain('audio.loadFailedNote')
  })

  it('can stop safely before an audio context exists', () => {
    const guitar = new GuitarAudio((status) => statuses.push(status))
    expect(() => guitar.stop()).not.toThrow()
  })

  it('sweeps down through the chord quickly and returns more softly on the treble strings', async () => {
    const guitar = new GuitarAudio(() => undefined)
    const chord = [40, 45, 48, 52, 55, 59]
    await guitar.playStrum(chord, 'down')
    const context = FakeAudioContext.instance
    const down = context.sources.slice()
    const downGains = context.gains.slice(-6)
    const downTimes = down.map((source) => source.start.mock.calls[0][0] as number)
    expect(downTimes.every((time, index) => index === 0 || time > downTimes[index - 1])).toBe(true)
    expect(downTimes.at(-1)! - downTimes[0]).toBeLessThan(0.07)
    expect(down.every((source) => source.playbackRate.value === 1)).toBe(true)

    context.currentTime += 0.3
    await guitar.playStrum(chord, 'up')
    const up = context.sources.slice(6)
    expect(up).toHaveLength(4)
    expect(up.map((source) => source.buffer)).toEqual(down.slice(2).reverse().map((source) => source.buffer))
    const upTimes = up.map((source) => source.start.mock.calls[0][0] as number)
    expect(upTimes.every((time, index) => index === 0 || time > upTimes[index - 1])).toBe(true)
    expect(upTimes.at(-1)! - upTimes[0]).toBeLessThan(0.04)
    const downVolume = downGains[0].gain.linearRampToValueAtTime.mock.calls[0][0]
    const upVolume = context.gains.at(-4)!.gain.linearRampToValueAtTime.mock.calls[0][0]
    expect(upVolume).toBeLessThan(downVolume)
    // Bass strings sustain and treble tails overlap the new pick attacks.
    expect(down.slice(0, 2).every((source) => source.stop.mock.calls.length === 1)).toBe(true)
    expect(down.slice(2).every((source) => source.stop.mock.calls.length === 2)).toBe(true)
    down.slice(2).reverse().forEach((source, index) => {
      expect(source.stop.mock.lastCall![0]).toBeCloseTo(upTimes[index] + 0.225)
    })
  })

  it('damps the previous chord and does not let repeated strokes accumulate voices', async () => {
    const guitar = new GuitarAudio(() => undefined)
    await guitar.playStrum([48, 52, 55], 'down')
    const context = FakeAudioContext.instance
    const first = context.sources.slice()
    context.currentTime += 0.4
    await guitar.playStrum([45, 52, 57], 'down')
    expect(first.every((source) => source.stop.mock.calls.length === 2)).toBe(true)
    expect(first[0].stop.mock.lastCall![0]).toBeCloseTo(4.4 + 0.012 + 0.185)
    context.currentTime += 0.4
    await guitar.playStrum([45, 52, 57], 'down')
    expect(first.every((source) => source.stop.mock.calls.length === 2)).toBe(true)
    guitar.stop()
    expect(context.sources.every((source) => Math.abs(source.stop.mock.lastCall![0] - (context.currentTime + 0.03)) < 0.0001)).toBe(true)
  })

  it('accents a stroke and softens its overtones after the pick attack', async () => {
    const guitar = new GuitarAudio(() => undefined)
    await guitar.playStrum([48], 'down')
    const context = FakeAudioContext.instance
    const normal = context.gains.at(-1)!.gain.linearRampToValueAtTime.mock.calls[0][0]
    context.currentTime += 0.4
    await guitar.playStrum([48], 'down', true)
    const accented = context.gains.at(-1)!.gain.linearRampToValueAtTime.mock.calls[0][0]
    expect(accented).toBeGreaterThan(normal)
    const frequency = context.filters.at(-1)!.frequency
    const [opening, pick, sustain] = frequency.exponentialRampToValueAtTime.mock.calls
    expect(opening[1]).toBeCloseTo(4.4 + 0.012 + 0.025)
    expect(frequency.setValueAtTime.mock.calls[0][0]).toBeCloseTo(opening[0] * 0.35)
    expect(pick[0]).toBeLessThan(opening[0])
    expect(pick[1]).toBeCloseTo(4.4 + 0.012 + 0.085)
    expect(sustain[1]).toBeCloseTo(4.4 + 0.012 + 1.8)
    expect(sustain[0]).toBeLessThan(pick[0])
  })

  it('accelerates the pick sweep and makes accented strokes tighter and brighter', async () => {
    const guitar = new GuitarAudio(() => undefined)
    const chord = [40, 45, 52, 55, 59, 65]
    await guitar.playStrum(chord, 'down')
    const context = FakeAudioContext.instance
    const times = context.sources.map((source) => source.start.mock.calls[0][0] as number)
    const gaps = times.slice(1).map((time, index) => time - times[index])
    expect(gaps.every((gap, index) => index === 0 || gap < gaps[index - 1])).toBe(true)
    expect(times.at(-1)! - times[0]).toBeGreaterThan(0.025)
    expect(times.at(-1)! - times[0]).toBeLessThan(0.06)
    const normalBrightness = context.filters.at(-6)!.frequency.setValueAtTime.mock.calls[0][0]
    expect(context.filters.at(-1)!.frequency.setValueAtTime.mock.calls[0][0]).toBeLessThan(normalBrightness)

    context.currentTime += 0.3
    await guitar.playStrum(chord, 'down', true)
    const accentTimes = context.sources.slice(6).map((source) => source.start.mock.calls[0][0] as number)
    expect(accentTimes.at(-1)! - accentTimes[0]).toBeLessThan(times.at(-1)! - times[0])
    expect(context.filters.at(-6)!.frequency.setValueAtTime.mock.calls[0][0]).toBeGreaterThan(normalBrightness)

    context.currentTime += 0.3
    await guitar.playStrum(chord, 'up')
    expect(context.filters.at(-4)!.frequency.setValueAtTime.mock.calls[0][0]).toBeLessThan(normalBrightness)
  })

  it('uses gentle compression and a restrained room level to preserve pick dynamics', async () => {
    const guitar = new GuitarAudio(() => undefined)
    await guitar.prepare()
    const context = FakeAudioContext.instance
    const compressor = context.createDynamicsCompressor.mock.results[0].value
    expect(compressor.ratio.value).toBe(2.5)
    expect(compressor.attack.value).toBe(0.018)
    expect(context.gains[1].gain.value).toBe(0.045)
    expect(context.filters[0].frequency.value).toBe(155)
  })

  it.each([0, 0.999])('keeps randomized sweeps ordered and accounts for detune in the natural tail (%s)', async (random) => {
    const guitar = new GuitarAudio(() => undefined)
    await guitar.prepare()
    vi.mocked(Math.random).mockReturnValue(random)
    await guitar.playStrum([40, 45, 52, 55, 59, 65], 'down')
    const context = FakeAudioContext.instance
    const times = context.sources.map((source) => source.start.mock.calls[0][0] as number)
    expect(times.every((time, index) => index === 0 || time > times[index - 1])).toBe(true)
    expect(times.at(-1)! - times[0]).toBeLessThan(0.07)
    for (const source of context.sources) {
      expect(Math.abs(source.detune.value)).toBeLessThanOrEqual(0.5)
      const rate = source.playbackRate.value * 2 ** (source.detune.value / 1200)
      expect(source.stop.mock.lastCall![0] - source.start.mock.calls[0][0]).toBeCloseTo(1.25 / rate + 0.01, 8)
    }
  })

  it('cancels playback requested before Stop, even if samples are still loading', async () => {
    const guitar = new GuitarAudio(() => undefined)
    const pending = [guitar.playStrum([48], 'down'), guitar.play([52], true), guitar.playMetronome(), guitar.prepare()]
    guitar.stop()
    const results = await Promise.all(pending)
    expect(results[3]).toBe(false)
    expect(FakeAudioContext.instance.sources).toHaveLength(0)
    expect(FakeAudioContext.instance.oscillators).toHaveLength(0)
    await guitar.play([48], true)
    expect(FakeAudioContext.instance.sources).toHaveLength(1)
  })

  it('lets long recordings ring for their full duration, accounting for transposition', async () => {
    const guitar = new GuitarAudio(() => undefined)
    await guitar.prepare()
    const context = FakeAudioContext.instance
    // Model a long bass-string recording such as the supplied E2 sample.
    const decoded = await context.decodeAudioData.mock.results[0].value
    decoded.duration = 10.8
    await guitar.play([40, 41])
    const [original, transposed] = context.sources
    const originalStart = original.start.mock.calls[0][0]
    const transposedStart = transposed.start.mock.calls[0][0]
    expect(original.stop.mock.lastCall![0] - originalStart).toBeCloseTo(10.81)
    expect(transposed.stop.mock.lastCall![0] - transposedStart).toBeCloseTo(10.8 / 2 ** (1 / 12) + 0.01)
  })

  it('keeps a rest ringing and promptly stops both new notes and overlapping tails', async () => {
    const guitar = new GuitarAudio(() => undefined)
    await guitar.playStrum([48], 'down')
    const context = FakeAudioContext.instance
    const first = context.sources[0]
    const naturalEnd = first.stop.mock.lastCall![0]
    context.currentTime += 0.3
    // No strum on a rest: the original natural end remains scheduled.
    expect(first.stop).toHaveBeenCalledTimes(1)
    expect(first.stop.mock.lastCall![0]).toBe(naturalEnd)
    await guitar.playStrum([48], 'up')
    expect(first.stop.mock.lastCall![0]).toBeGreaterThan(context.currentTime + 0.2)
    expect(first.stop.mock.lastCall![0]).toBeLessThan(context.currentTime + 0.3)
    guitar.stop()
    context.sources.forEach((source) => {
      expect(source.stop.mock.lastCall![0]).toBeCloseTo(context.currentTime + 0.03)
      source.onended?.()
      expect(source.disconnect).toHaveBeenCalledTimes(1)
    })
    const calls = first.stop.mock.calls.length
    guitar.stop()
    expect(first.stop).toHaveBeenCalledTimes(calls)
  })
})
