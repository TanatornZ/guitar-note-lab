import { STRUM_CHORDS, type StrumChord } from './strumChords'
import { ALTERNATING_STROKE_BEATS, DEFAULT_TIME_SIGNATURE, SIXTEENTH_STEP_LABELS, SUBDIVISIONS, type Subdivision } from '../constants/studio'

export type { Subdivision } from '../constants/studio'
export type StrumDirection = 'down' | 'up' | 'rest'
export interface StrumStep {
  direction: StrumDirection
  accent: boolean
}
export interface ProgressionChord extends StrumChord {
  // Undefined follows the current time signature (one full bar).
  beats?: number
}

// A simplified acoustic practice arrangement, not a transcription of the recording.
// Tempo reference: https://drumscore.com/sheet-music/browse-by-artist/score/6764-oasis-dont-look-back-in-anger-drum-sheet-music-tab
const ANGER_STRUM_PHRASE = ['down', 'rest', 'down', 'up', 'rest', 'up', 'down', 'up'] as const
const ANGER_PHRASE_ACCENT_STEPS: readonly number[] = [0, 6]
export const ANGER_PRESET = {
  name: "Don't Look Back in Anger",
  bpm: 82,
  timeSignature: DEFAULT_TIME_SIGNATURE,
  subdivisions: SUBDIVISIONS.sixteenth,
  progression: ([['C', 2], ['G', 2], ['Am', 2], ['E', 2], ['F', 2], ['G', 2], ['C', 1], ['Am', 1], ['G', 2]] as const).map(([id, beats]): ProgressionChord => ({
    ...STRUM_CHORDS.find((chord) => chord.id === id)!,
    beats,
  })),
  pattern: Array.from({ length: DEFAULT_TIME_SIGNATURE.beats * SUBDIVISIONS.sixteenth }, (_, index): StrumStep => ({
    direction: ANGER_STRUM_PHRASE[index % ANGER_STRUM_PHRASE.length],
    accent: ANGER_PHRASE_ACCENT_STEPS.includes(index % ANGER_STRUM_PHRASE.length),
  })),
}

export function defaultPattern(beats: number, subdivisions: Subdivision): StrumStep[] {
  return Array.from({ length: beats * subdivisions }, (_, index) => ({
    direction: index % subdivisions !== 0 ? 'rest' : Math.floor(index / subdivisions) % ALTERNATING_STROKE_BEATS === 0 ? 'down' : 'up',
    accent: index === 0,
  }))
}

export function stepLabel(index: number, subdivisions: Subdivision): string {
  if (index % subdivisions === 0) return String(Math.floor(index / subdivisions) + 1)
  return subdivisions === SUBDIVISIONS.eighth ? '&' : SIXTEENTH_STEP_LABELS[index % SUBDIVISIONS.sixteenth]
}
