import { STRUM_CHORDS, type StrumChord } from './strumChords'

export type Subdivision = 1 | 2 | 4
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
export const ANGER_PRESET = {
  name: "Don't Look Back in Anger",
  bpm: 82,
  subdivisions: 4 as Subdivision,
  progression: ([['C', 2], ['G', 2], ['Am', 2], ['E', 2], ['F', 2], ['G', 2], ['C', 1], ['Am', 1], ['G', 2]] as const).map(([id, beats]): ProgressionChord => ({
    ...STRUM_CHORDS.find((chord) => chord.id === id)!,
    beats,
  })),
  pattern: Array.from({ length: 16 }, (_, index): StrumStep => ({
    direction: (['down', 'rest', 'down', 'up', 'rest', 'up', 'down', 'up'] as const)[index % 8],
    accent: index === 0 || index === 6 || index === 8 || index === 14,
  })),
}

export function defaultPattern(beats: number, subdivisions: Subdivision): StrumStep[] {
  return Array.from({ length: beats * subdivisions }, (_, index) => ({
    direction: index % subdivisions !== 0 ? 'rest' : Math.floor(index / subdivisions) % 2 === 0 ? 'down' : 'up',
    accent: index === 0,
  }))
}

export function stepLabel(index: number, subdivisions: Subdivision): string {
  if (index % subdivisions === 0) return `Beat ${Math.floor(index / subdivisions) + 1}`
  return subdivisions === 2 ? '&' : ['','e', '&', 'a'][index % 4]
}
