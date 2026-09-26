import { SAMPLE_START } from '../constants/audio'

type SampleData = Pick<AudioBuffer, 'sampleRate' | 'length' | 'numberOfChannels' | 'getChannelData'>

/** Skip only the low-level lead-in, never gate or shorten a ringing tail. */
export function findSampleStart(buffer: SampleData): number {
  const windowFrames = Math.max(1, Math.round(buffer.sampleRate * SAMPLE_START.windowSeconds))
  const searchFrames = Math.min(buffer.length, Math.floor(buffer.sampleRate * SAMPLE_START.searchSeconds))
  const levels = new Float32Array(Math.floor(searchFrames / windowFrames))

  // Use the strongest channel, avoiding cancellation in stereo recordings.
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let window = 0; window < levels.length; window += 1) {
      let energy = 0
      const start = window * windowFrames
      for (let frame = start; frame < start + windowFrames; frame += 1) energy += data[frame] ** 2
      levels[window] = Math.max(levels[window], Math.sqrt(energy / windowFrames))
    }
  }

  const peak = levels.reduce((maximum, level) => Math.max(maximum, level), 0)
  if (peak < SAMPLE_START.minimumPeakRms) return 0
  const threshold = peak * SAMPLE_START.relativeRmsThreshold
  let consecutive = 0
  for (let window = 0; window < levels.length; window += 1) {
    consecutive = levels[window] >= threshold ? consecutive + 1 : 0
    if (consecutive < SAMPLE_START.confirmationWindows) continue
    const onset = (window - consecutive + 1) * windowFrames / buffer.sampleRate
    // Unfamiliar slow-attack recordings should remain untouched, not be
    // arbitrarily cut at the maximum search/trim boundary.
    if (onset > SAMPLE_START.maximumTrimSeconds) return 0
    return Math.max(0, onset - SAMPLE_START.prerollSeconds)
  }
  return 0
}
