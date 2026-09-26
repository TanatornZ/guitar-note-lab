import { describe, expect, it, vi } from 'vitest'
import { envelopeGainAt, releaseEnvelope, type VoiceEnvelope } from './voiceEnvelope'

const envelope = (): VoiceEnvelope => ({ startTime: 1, attackEndTime: 1.01, fadeStartTime: 3, endTime: 3.2, peakGain: 0.4 })
const parameter = () => ({ cancelAndHoldAtTime: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() })

describe('voice envelope', () => {
  it.each([[0.9, 0], [1, 0], [1.005, 0.2], [1.01, 0.4], [2, 0.4], [3, 0.4], [3.1, 0.2], [3.2, 0], [4, 0]])('evaluates the scheduled gain at %s', (time, expected) => {
    expect(envelopeGainAt(envelope(), time)).toBeCloseTo(expected)
  })

  it('anchors a release after cancellation and before the new fade', () => {
    const gain = parameter(), state = envelope()
    releaseEnvelope(gain as unknown as AudioParam, state, 2, 0.22)
    expect(gain.cancelAndHoldAtTime).toHaveBeenCalledWith(2)
    expect(gain.setValueAtTime).toHaveBeenCalledWith(0.4, 2)
    expect(gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 2.22)
    expect(gain.cancelAndHoldAtTime.mock.invocationCallOrder[0]).toBeLessThan(gain.setValueAtTime.mock.invocationCallOrder[0])
    expect(gain.setValueAtTime.mock.invocationCallOrder[0]).toBeLessThan(gain.linearRampToValueAtTime.mock.invocationCallOrder[0])
    expect(envelopeGainAt(state, 1.9)).toBe(0.4)
    expect(envelopeGainAt(state, 2.11)).toBeCloseTo(0.2)
    expect(envelopeGainAt(state, 2.3)).toBe(0)
  })

  it('stops an already releasing tail from its current level, without reviving it', () => {
    const gain = parameter(), state = envelope()
    releaseEnvelope(gain as unknown as AudioParam, state, 2, 0.2)
    releaseEnvelope(gain as unknown as AudioParam, state, 2.1, 0.025)
    expect(gain.setValueAtTime.mock.lastCall![0]).toBeCloseTo(0.2)
    expect(envelopeGainAt(state, 2.1125)).toBeCloseTo(0.1)
    releaseEnvelope(gain as unknown as AudioParam, state, 2.2, 0.025)
    expect(gain.setValueAtTime.mock.lastCall![0]).toBe(0)
  })

  it.each([0.9, 1.005, 3.1])('anchors the actual gain during a pending start, attack or end fade (%s)', time => {
    const gain = parameter(), state = envelope(), expected = envelopeGainAt(state, time)
    releaseEnvelope(gain as unknown as AudioParam, state, time, 0.025)
    expect(gain.setValueAtTime).toHaveBeenCalledWith(expected, time)
  })

  it('can stop before a previously scheduled future release begins', () => {
    const gain = parameter(), state = envelope()
    releaseEnvelope(gain as unknown as AudioParam, state, 2, 0.22)
    releaseEnvelope(gain as unknown as AudioParam, state, 1.5, 0.025)
    expect(gain.setValueAtTime).toHaveBeenLastCalledWith(0.4, 1.5)
    expect(envelopeGainAt(state, 1.525)).toBe(0)
  })
})
