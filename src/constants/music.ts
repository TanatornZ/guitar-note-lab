// Equal-tempered pitch conversion and the register used by chord preview playback.
export const SEMITONES_PER_OCTAVE = 12
export const OCTAVE_FREQUENCY_RATIO = 2
export const CHORD_PREVIEW_BASE_MIDI = 48 // C3
export const PITCH_NAME_WRAP_OFFSET = 120 // Preserve negative-pitch wrapping across ten octaves.

// These are display/playback choices, independent of the number of pitch classes.
export const GUITAR_FRET_COUNT = 12
export const FIRST_PLAYABLE_FRET = 1
export const MIN_CHORD_PLAYBACK_NOTES = 2
export const MAX_VISIBLE_CHORD_MATCHES = 24
