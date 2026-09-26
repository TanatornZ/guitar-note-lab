export const MILLISECONDS_PER_MINUTE = 60_000
export const TEMPO_BPM = { minimum: 50, maximum: 220, default: 96 } as const

// Values are the number of editable strum steps per numbered beat.
export const SUBDIVISIONS = { quarter: 1, eighth: 2, sixteenth: 4 } as const
export type Subdivision = typeof SUBDIVISIONS[keyof typeof SUBDIVISIONS]
export const DEFAULT_SUBDIVISION = SUBDIVISIONS.quarter
export const DEFAULT_TIME_SIGNATURE = { label: '4/4', beats: 4 } as const
export const TIME_SIGNATURES = [
  { label: '2/4', beats: 2 },
  { label: '3/4', beats: 3 },
  DEFAULT_TIME_SIGNATURE,
  { label: '6/8', beats: 6 },
]
export const CHORD_DURATION_BEATS = [1, 2, 3, 4, 6, 8] as const
export const DEFAULT_PROGRESSION_CHORD_IDS = ['C', 'G', 'Am', 'F'] as const
export const NO_ACTIVE_STEP = -1
export const MAX_PATTERN_COLUMNS = 4
export const ALTERNATING_STROKE_BEATS = 2
export const SIXTEENTH_STEP_LABELS = ['', 'e', '&', 'a'] as const
