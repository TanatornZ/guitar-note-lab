import { STRUM_CHORDS, type StrumChord } from './strumChords'
import {
  ALTERNATING_STROKE_BEATS,
  DEFAULT_TIME_SIGNATURE,
  SIXTEENTH_STEP_LABELS,
  SUBDIVISIONS,
  TIME_SIGNATURES,
  type Subdivision,
} from '../constants/studio'

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

export const SONG_PRESET_GENRES = ['all', 'pop', 'rock', 'folk', 'soul', 'reggae'] as const
export type SongPresetGenre = Exclude<(typeof SONG_PRESET_GENRES)[number], 'all'>

export interface SongPreset {
  id: string
  name: string
  artist: string
  decade: string
  genre: SongPresetGenre
  key: string
  bpm: number
  timeSignature: (typeof TIME_SIGNATURES)[number]
  subdivisions: Subdivision
  progression: ProgressionChord[]
  pattern: StrumStep[]
}

type ChordSpec = string | readonly [id: string, beats: number]

const THREE_FOUR = TIME_SIGNATURES.find(({ label }) => label === '3/4')!
const SIX_EIGHT = TIME_SIGNATURES.find(({ label }) => label === '6/8')!

const POP_EIGHTH = ['down', 'rest', 'down', 'up', 'rest', 'up', 'down', 'up'] as const
const ROCK_EIGHTH = ['down', 'rest', 'down', 'up', 'down', 'up', 'down', 'up'] as const
const GENTLE_EIGHTH = ['down', 'rest', 'rest', 'up', 'down', 'rest', 'up', 'rest'] as const
const REGGAE_EIGHTH = ['rest', 'up', 'rest', 'up', 'rest', 'up', 'rest', 'up'] as const
const SIXTEENTH_FLOW = [
  'down', 'rest', 'down', 'up', 'rest', 'up', 'down', 'up',
  'down', 'rest', 'down', 'up', 'rest', 'up', 'down', 'up',
] as const
const WALTZ_EIGHTH = [
  'down', 'rest', 'rest', 'up', 'down', 'up',
  'down', 'rest', 'rest', 'up', 'down', 'up',
] as const

function progression(specs: readonly ChordSpec[]): ProgressionChord[] {
  return specs.map((spec) => {
    const [id, beats] = typeof spec === 'string' ? [spec, undefined] : spec
    return { ...STRUM_CHORDS.find((chord) => chord.id === id)!, beats }
  })
}

function presetPattern(
  beats: number,
  subdivisions: Subdivision,
  phrase: readonly StrumDirection[],
  accentSteps: readonly number[],
): StrumStep[] {
  return Array.from({ length: beats * subdivisions }, (_, index) => ({
    direction: phrase[index % phrase.length],
    accent: accentSteps.includes(index),
  }))
}

function createPreset({
  progression: chordSpecs,
  phrase,
  accentSteps,
  timeSignature = DEFAULT_TIME_SIGNATURE,
  subdivisions = SUBDIVISIONS.eighth,
  ...metadata
}: Omit<SongPreset, 'progression' | 'pattern' | 'timeSignature' | 'subdivisions'> & {
  progression: readonly ChordSpec[]
  phrase: readonly StrumDirection[]
  accentSteps: readonly number[]
  timeSignature?: SongPreset['timeSignature']
  subdivisions?: Subdivision
}): SongPreset {
  return {
    ...metadata,
    timeSignature,
    subdivisions,
    progression: progression(chordSpecs),
    pattern: presetPattern(timeSignature.beats, subdivisions, phrase, accentSteps),
  }
}

// These are simplified, transposed practice loops rather than transcriptions of the recordings.
export const SONG_PRESETS: SongPreset[] = [
  createPreset({
    id: 'dont-look-back-in-anger', name: "Don't Look Back in Anger", artist: 'Oasis', decade: '1990s', genre: 'rock', key: 'C', bpm: 82,
    progression: [['C', 2], ['G', 2], ['Am', 2], ['E', 2], ['F', 2], ['G', 2], ['C', 1], ['Am', 1], ['G', 2]],
    subdivisions: SUBDIVISIONS.sixteenth, phrase: SIXTEENTH_FLOW, accentSteps: [0, 6, 8, 14],
  }),
  createPreset({
    id: 'stand-by-me', name: 'Stand by Me', artist: 'Ben E. King', decade: '1960s', genre: 'soul', key: 'G', bpm: 118,
    progression: ['G', 'Em', 'C', 'D'], phrase: POP_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'let-it-be', name: 'Let It Be', artist: 'The Beatles', decade: '1970s', genre: 'pop', key: 'C', bpm: 72,
    progression: ['C', 'G', 'Am', 'F'], phrase: GENTLE_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'im-yours', name: "I'm Yours", artist: 'Jason Mraz', decade: '2000s', genre: 'pop', key: 'G', bpm: 76,
    progression: ['G', 'D', 'Em', 'C'], phrase: POP_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'perfect', name: 'Perfect', artist: 'Ed Sheeran', decade: '2010s', genre: 'pop', key: 'G', bpm: 95,
    progression: ['G', 'Em', 'C', 'D'], timeSignature: SIX_EIGHT, phrase: WALTZ_EIGHTH, accentSteps: [0, 6],
  }),
  createPreset({
    id: 'riptide', name: 'Riptide', artist: 'Vance Joy', decade: '2010s', genre: 'folk', key: 'Am', bpm: 102,
    progression: ['Am', 'G', 'C', 'C'], phrase: ROCK_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'knockin-on-heavens-door', name: "Knockin' on Heaven's Door", artist: 'Bob Dylan', decade: '1970s', genre: 'folk', key: 'G', bpm: 70,
    progression: ['G', 'D', 'Am', 'Am', 'G', 'D', 'C', 'C'], phrase: GENTLE_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'zombie', name: 'Zombie', artist: 'The Cranberries', decade: '1990s', genre: 'rock', key: 'Em', bpm: 84,
    progression: ['Em', 'C', 'G', 'D'], phrase: ROCK_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'country-roads', name: 'Take Me Home, Country Roads', artist: 'John Denver', decade: '1970s', genre: 'folk', key: 'G', bpm: 82,
    progression: ['G', 'Em', 'D', 'C'], phrase: POP_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'love-me-do', name: 'Love Me Do', artist: 'The Beatles', decade: '1960s', genre: 'pop', key: 'G', bpm: 74,
    progression: ['G', 'C', 'G', 'D'], phrase: GENTLE_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'three-little-birds', name: 'Three Little Birds', artist: 'Bob Marley & The Wailers', decade: '1970s', genre: 'reggae', key: 'A', bpm: 74,
    progression: ['A', 'D', 'A', 'E'], phrase: REGGAE_EIGHTH, accentSteps: [1, 5],
  }),
  createPreset({
    id: 'brown-eyed-girl', name: 'Brown Eyed Girl', artist: 'Van Morrison', decade: '1960s', genre: 'rock', key: 'G', bpm: 150,
    progression: ['G', 'C', 'G', 'D'], phrase: ROCK_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'sweet-home-alabama', name: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd', decade: '1970s', genre: 'rock', key: 'D', bpm: 98,
    progression: ['D', 'C', 'G', 'G'], phrase: ROCK_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'wonderwall', name: 'Wonderwall', artist: 'Oasis', decade: '1990s', genre: 'rock', key: 'Em', bpm: 87,
    progression: ['Em7', 'G', 'D', 'A7'], subdivisions: SUBDIVISIONS.sixteenth, phrase: SIXTEENTH_FLOW, accentSteps: [0, 6, 8, 14],
  }),
  createPreset({
    id: 'hey-soul-sister', name: 'Hey, Soul Sister', artist: 'Train', decade: '2000s', genre: 'pop', key: 'C', bpm: 97,
    progression: ['C', 'G', 'Am', 'F'], phrase: POP_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'counting-stars', name: 'Counting Stars', artist: 'OneRepublic', decade: '2010s', genre: 'pop', key: 'Am', bpm: 122,
    progression: ['Am', 'C', 'G', 'F'], phrase: ROCK_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'no-woman-no-cry', name: 'No Woman, No Cry', artist: 'Bob Marley & The Wailers', decade: '1970s', genre: 'reggae', key: 'C', bpm: 78,
    progression: ['C', 'G', 'Am', 'F'], phrase: REGGAE_EIGHTH, accentSteps: [1, 5],
  }),
  createPreset({
    id: 'someone-like-you', name: 'Someone Like You', artist: 'Adele', decade: '2010s', genre: 'soul', key: 'A', bpm: 67,
    progression: ['A', 'E', 'F#m', 'D'], phrase: GENTLE_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'with-or-without-you', name: 'With or Without You', artist: 'U2', decade: '1980s', genre: 'rock', key: 'D', bpm: 110,
    progression: ['D', 'A', 'Bm', 'G'], phrase: ROCK_EIGHTH, accentSteps: [0, 4],
  }),
  createPreset({
    id: 'hallelujah', name: 'Hallelujah', artist: 'Leonard Cohen', decade: '1980s', genre: 'folk', key: 'C', bpm: 56,
    progression: ['C', 'Am', 'C', 'Am', 'F', 'G', 'C', 'G'], timeSignature: THREE_FOUR, phrase: GENTLE_EIGHTH, accentSteps: [0, 3],
  }),
]

export const ANGER_PRESET = SONG_PRESETS[0]

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
