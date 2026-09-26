export interface GuitarTone {
  bass: number
  middle: number
  treble: number
}

export const DEFAULT_GUITAR_TONE: GuitarTone = { bass: 0, middle: 0, treble: 0 }
export const TONE_LIMIT = 12
export const GUITAR_TONE_BANDS = [
  { key: 'bass', label: 'Bass', description: 'Warmth and low strings', frequency: 200, type: 'lowshelf' },
  { key: 'middle', label: 'Middle', description: 'Body and presence', frequency: 800, type: 'peaking' },
  { key: 'treble', label: 'Treble', description: 'Brightness and pick detail', frequency: 3200, type: 'highshelf' },
] as const
