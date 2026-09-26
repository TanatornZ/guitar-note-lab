import { describe, expect, it } from 'vitest'
import { findSampleStart } from './sampleStart'

function recording(channels: Float32Array<ArrayBuffer>[], sampleRate = 1000) {
  return { sampleRate, length: channels[0].length, numberOfChannels: channels.length, getChannelData: (channel: number) => channels[channel] }
}

describe('findSampleStart', () => {
  it('removes a quiet lead-in but retains pre-roll and does not mutate the recording', () => {
    const data = new Float32Array(1000).fill(0.002)
    data.fill(0.5, 30)
    const original = data.slice()
    expect(findSampleStart(recording([data]))).toBeCloseTo(0.028)
    expect(data).toEqual(original)
  })

  it('ignores an isolated lead-in click instead of mistaking it for the note', () => {
    const data = new Float32Array(1000)
    data[8] = 0.4
    data.fill(0.5, 30)
    expect(findSampleStart(recording([data]))).toBeCloseTo(0.028)
  })

  it('keeps an immediate attack, silence, and extremely quiet recordings unchanged', () => {
    for (const level of [0, 0.0001, 0.5]) {
      expect(findSampleStart(recording([new Float32Array(1000).fill(level)]))).toBe(0)
    }
    expect(findSampleStart(recording([new Float32Array(1)]))).toBe(0)
  })

  it('does not cut an unknown late attack or a recording containing only a click', () => {
    const data = new Float32Array(1000)
    data[8] = 0.4
    expect(findSampleStart(recording([data]))).toBe(0)
    data.fill(0.5, 100)
    expect(findSampleStart(recording([data]))).toBe(0)
  })

  it('detects either stereo channel without phase cancellation', () => {
    const data = new Float32Array(1000)
    data.fill(0.5, 30)
    const silent = new Float32Array(1000)
    expect(findSampleStart(recording([silent, data]))).toBeCloseTo(0.028)
    expect(findSampleStart(recording([data, data.map(value => -value)]))).toBeCloseTo(0.028)
  })

  it.each([22050, 44100, 48000])('uses buffer time at %s Hz', (sampleRate) => {
    const data = new Float32Array(sampleRate).fill(0.001)
    data.fill(0.5, Math.round(sampleRate * 0.03))
    expect(findSampleStart(recording([data], sampleRate))).toBeCloseTo(0.028, 2)
  })
})
