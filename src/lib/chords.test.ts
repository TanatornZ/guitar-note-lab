import { describe, expect, it } from 'vitest'
import { noteName } from '../data/music'
import { findChordMatches } from './chords'

describe('music helpers', () => {
  it('wraps pitch classes to their display names', () => {
    expect(noteName(0)).toBe('C')
    expect(noteName(-1)).toBe('B')
    expect(noteName(13)).toBe('C♯')
  })

  it('returns no chord when no notes are selected', () => {
    expect(findChordMatches([])).toEqual([])
  })

  it('finds and prioritizes an exact C major set', () => {
    const matches = findChordMatches([0, 4, 7])

    expect(matches[0]).toMatchObject({ name: 'C', tones: [0, 4, 7], exact: true })
    expect(matches.some((match) => match.name === 'Am7' && !match.exact)).toBe(true)
  })

  it('only suggests chords containing every selected note', () => {
    const matches = findChordMatches([0, 3])

    expect(matches.length).toBeGreaterThan(0)
    expect(matches.every((match) => match.tones.includes(0) && match.tones.includes(3))).toBe(true)
    expect(matches.some((match) => match.name === 'Cm')).toBe(true)
  })
})
