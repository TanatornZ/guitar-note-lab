export interface StrumChord {
  id: string
  name: string
  midis: number[]
}

export const STRUM_CHORDS: StrumChord[] = [
  { id: 'C', name: 'C', midis: [48, 52, 55, 60, 64] },
  { id: 'G', name: 'G', midis: [43, 47, 50, 55, 59, 67] },
  { id: 'Am', name: 'Am', midis: [45, 52, 57, 60, 64] },
  { id: 'F', name: 'F', midis: [41, 48, 53, 57, 60, 65] },
  { id: 'Dm', name: 'Dm', midis: [50, 57, 62, 65] },
  { id: 'Em', name: 'Em', midis: [40, 47, 52, 55, 59, 64] },
  { id: 'D', name: 'D', midis: [50, 57, 62, 66] },
  { id: 'E', name: 'E', midis: [40, 47, 52, 56, 59, 64] },
  { id: 'A', name: 'A', midis: [45, 52, 57, 61, 64] },
]
