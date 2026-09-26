// Web Audio times are seconds, frequencies are Hz, gains are linear unless marked Db.
// Keep settings grouped by the behavior they control, even when values happen to match.
export const GUITAR_OUTPUT = {
  masterGain: 0.58,
  bodyFrequencyHz: 155,
  bodyQ: 0.65,
  bodyGainDb: 2.4,
  compressorThresholdDb: -12,
  compressorKneeDb: 12,
  compressorRatio: 2.5,
  compressorAttackSeconds: 0.018,
  compressorReleaseSeconds: 0.24,
} as const

export const ROOM_REVERB = {
  durationSeconds: 0.48,
  decayExponent: 2.8,
  wetGain: 0.045,
  channels: 2,
} as const

// Detect the musical attack after the recording/MP3 pre-echo, once at load time.
export const SAMPLE_START = {
  searchSeconds: 0.12,
  maximumTrimSeconds: 0.08,
  windowSeconds: 0.002,
  relativeRmsThreshold: 0.1,
  minimumPeakRms: 0.003,
  confirmationWindows: 2,
  prerollSeconds: 0.002,
} as const

export const NOTE_PLAYBACK = {
  startDelaySeconds: 0.015,
  velocityMinimum: 0.96,
  velocityVariation: 0.08,
  detuneRangeCents: 1,
  brightnessHz: 6600,
  // Suppress the recording's brief pick click, then restore normal brightness.
  attackBrightnessRatio: 0.35,
  brightnessOpeningSeconds: 0.025,
  pickBrightnessRatio: 0.82,
  pickDecaySeconds: 0.085,
  sustainedBrightnessRatio: 0.58,
  brightnessDecaySeconds: 1.8,
  lowpassQ: 0.5,
  gainMinimum: 0.7,
  gainVariation: 0.045,
  attackSeconds: 0.008,
  attackVariationSeconds: 0.002,
  minimumHoldSeconds: 0.012,
  endFadeSeconds: 0.22,
  endStopPaddingSeconds: 0.01,
  stopReleaseSeconds: 0.025,
  releaseStopPaddingSeconds: 0.005,
} as const

export const STRUM_PLAYBACK = {
  upstrokeStringCount: 4,
  startDelaySeconds: 0.012,
  downstrokeGapSeconds: 0.009,
  upstrokeGapSeconds: 0.006,
  // A stronger stroke moves through the strings faster; later gaps narrow.
  accentGapMultiplier: 0.84,
  sweepStartGapMultiplier: 1.18,
  sweepGapReduction: 0.36,
  downstrokeVelocity: 1,
  upstrokeVelocity: 0.72,
  accentMultiplier: 1.16,
  velocityMinimum: 0.94,
  velocityVariation: 0.12,
  gapMinimumMultiplier: 0.85,
  gapVariation: 0.3,
  leadingStringVelocity: 1.05,
  trailingStringVelocityReduction: 0.18,
  stringVelocityMinimum: 0.96,
  stringVelocityVariation: 0.08,
  detuneRangeCents: 1,
  baseBrightnessHz: 2800,
  velocityBrightnessHz: 3400,
  trailingStringBrightnessReductionHz: 500,
  chordChangeReleaseSeconds: 0.18,
  // Crossfade a re-picked string without stacking multiple long recordings.
  repeatedStringReleaseSeconds: 0.22,
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
