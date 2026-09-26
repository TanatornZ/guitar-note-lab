// Web Audio times are seconds, frequencies are Hz, gains are linear unless marked Db.
// Keep settings grouped by the behavior they control, even when values happen to match.
export const GUITAR_OUTPUT = {
  masterGain: 0.62,
  bodyFrequencyHz: 185,
  bodyQ: 0.8,
  bodyGainDb: 1.8,
  compressorThresholdDb: -12,
  compressorKneeDb: 12,
  compressorRatio: 4,
  compressorAttackSeconds: 0.003,
  compressorReleaseSeconds: 0.2,
} as const

export const ROOM_REVERB = {
  durationSeconds: 0.72,
  decayExponent: 2.8,
  wetGain: 0.085,
  channels: 2,
} as const

export const NOTE_PLAYBACK = {
  startDelaySeconds: 0.015,
  velocityMinimum: 0.96,
  velocityVariation: 0.08,
  detuneRangeCents: 3,
  brightnessHz: 7400,
  sustainedBrightnessRatio: 0.78,
  brightnessDecaySeconds: 1.4,
  lowpassQ: 0.28,
  gainMinimum: 0.7,
  gainVariation: 0.045,
  attackSeconds: 0.003,
  attackVariationSeconds: 0.002,
  minimumHoldSeconds: 0.006,
  endFadeSeconds: 0.22,
  endStopPaddingSeconds: 0.01,
  stopReleaseSeconds: 0.025,
  releaseStopPaddingSeconds: 0.005,
} as const

export const STRUM_PLAYBACK = {
  upstrokeStringCount: 4,
  startDelaySeconds: 0.012,
  downstrokeGapSeconds: 0.011,
  upstrokeGapSeconds: 0.008,
  downstrokeVelocity: 1,
  upstrokeVelocity: 0.76,
  accentMultiplier: 1.12,
  velocityMinimum: 0.96,
  velocityVariation: 0.08,
  gapMinimumMultiplier: 0.85,
  gapVariation: 0.3,
  leadingStringVelocity: 1.05,
  trailingStringVelocityReduction: 0.12,
  stringVelocityMinimum: 0.97,
  stringVelocityVariation: 0.06,
  detuneRangeCents: 3,
  baseBrightnessHz: 5400,
  velocityBrightnessHz: 2200,
  trailingStringBrightnessReductionHz: 500,
  chordChangeReleaseSeconds: 0.18,
  repeatedStringReleaseSeconds: 0.65,
} as const

export const METRONOME = {
  accentFrequencyHz: 1280,
  beatFrequencyHz: 860,
  accentGain: 0.18,
  beatGain: 0.1,
  // Exponential gain ramps require a positive target, not absolute silence.
  nearSilentGain: 0.0001,
  attackSeconds: 0.003,
  decaySeconds: 0.055,
  durationSeconds: 0.06,
} as const

// Center a uniform random value around zero for detune and room noise.
export const RANDOM_MIDPOINT = 0.5
