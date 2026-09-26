export interface GuitarTone {
  bass: number
  middle: number
  treble: number
}

export const NEUTRAL_TONE_DB = 0
export const DEFAULT_GUITAR_TONE: GuitarTone = { bass: NEUTRAL_TONE_DB, middle: NEUTRAL_TONE_DB, treble: NEUTRAL_TONE_DB }
// Slider limits/step are dB; smoothing is a Web Audio time constant in seconds.
export const TONE_LIMIT = 12
export const TONE_STEP_DB = 1
export const TONE_SMOOTHING_SECONDS = 0.015
export const TONE_FILTER_Q = 0.8
export const GUITAR_TONE_BANDS = [
  { key: 'bass', frequency: 200, type: 'lowshelf' },
  { key: 'middle', frequency: 800, type: 'peaking' },
  { key: 'treble', frequency: 3200, type: 'highshelf' },
] as const
