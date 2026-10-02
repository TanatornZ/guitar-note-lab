import { describe, expect, it } from 'vitest'
import { SONG_PRESETS } from './strumPresets'

describe('song practice presets', () => {
  it('provides 20 unique and playable templates', () => {
    expect(SONG_PRESETS).toHaveLength(20)
    expect(new Set(SONG_PRESETS.map(({ id }) => id)).size).toBe(20)

    for (const preset of SONG_PRESETS) {
      expect(preset.progression.length).toBeGreaterThan(0)
      expect(preset.pattern).toHaveLength(
        preset.timeSignature.beats * preset.subdivisions,
      )
      expect(preset.pattern.some(({ direction }) => direction !== 'rest')).toBe(
        true,
      )
      expect(preset.pattern.some(({ accent }) => accent)).toBe(true)
    }
  })
})
