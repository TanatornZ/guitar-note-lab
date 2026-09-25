import type { ChordShape, GuitarString, PitchClass } from '../types/music'

export const NOTES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const

export const STANDARD_TUNING: GuitarString[] = [
  { name: 'E', midi: 40 },
  { name: 'A', midi: 45 },
  { name: 'D', midi: 50 },
  { name: 'G', midi: 55 },
  { name: 'B', midi: 59 },
  { name: 'e', midi: 64 },
]

export const CHORD_SHAPES: ChordShape[] = [
  { suffix: '', type: 'major', intervals: [0, 4, 7] },
  { suffix: 'm', type: 'minor', intervals: [0, 3, 7] },
  { suffix: 'dim', type: 'diminished', intervals: [0, 3, 6] },
  { suffix: 'aug', type: 'augmented', intervals: [0, 4, 8] },
  { suffix: 'sus2', type: 'suspended 2', intervals: [0, 2, 7] },
  { suffix: 'sus4', type: 'suspended 4', intervals: [0, 5, 7] },
  { suffix: '5', type: 'power chord', intervals: [0, 7] },
  { suffix: '6', type: 'sixth', intervals: [0, 4, 7, 9] },
  { suffix: 'm6', type: 'minor sixth', intervals: [0, 3, 7, 9] },
  { suffix: '7', type: 'dominant seventh', intervals: [0, 4, 7, 10] },
  { suffix: 'maj7', type: 'major seventh', intervals: [0, 4, 7, 11] },
  { suffix: 'm7', type: 'minor seventh', intervals: [0, 3, 7, 10] },
  { suffix: 'm7♭5', type: 'half-diminished', intervals: [0, 3, 6, 10] },
  { suffix: 'dim7', type: 'diminished seventh', intervals: [0, 3, 6, 9] },
  { suffix: 'add9', type: 'add nine', intervals: [0, 2, 4, 7] },
  { suffix: '9', type: 'dominant ninth', intervals: [0, 2, 4, 7, 10] },
]

export const noteName = (pitch: PitchClass): string => NOTES[(pitch + 120) % NOTES.length]
