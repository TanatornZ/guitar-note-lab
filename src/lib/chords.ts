import { CHORD_SHAPES, noteName } from '../data/music'
import type { ChordMatch, PitchClass } from '../types/music'

export function findChordMatches(selected: PitchClass[]): ChordMatch[] {
  if (!selected.length) return []

  return Array.from({ length: 12 }, (_, root) => CHORD_SHAPES.map(({ suffix, type, intervals }) => {
    const tones = intervals.map((interval) => (root + interval) % 12)
    return {
      name: noteName(root) + suffix,
      type,
      tones,
      exact: tones.length === selected.length && selected.every((note) => tones.includes(note)),
    }
  }))
    .flat()
    .filter((chord) => selected.every((note) => chord.tones.includes(note)))
    .sort((a, b) => Number(b.exact) - Number(a.exact) || a.tones.length - b.tones.length || a.name.localeCompare(b.name))
}
