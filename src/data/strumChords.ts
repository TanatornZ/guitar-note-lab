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
  { id: 'Bm', name: 'Bm', midis: [47, 54, 59, 62, 66] },
  { id: 'Cm', name: 'Cm', midis: [48, 51, 55, 60, 63] },
  { id: 'C7', name: 'C7', midis: [48, 52, 55, 58, 64] },
  { id: 'Cmaj7', name: 'Cmaj7', midis: [48, 52, 55, 59, 64] },
  { id: 'Cm7', name: 'Cm7', midis: [48, 51, 55, 58, 63] },
  { id: 'D7', name: 'D7', midis: [50, 54, 57, 60, 66] },
  { id: 'Dm7', name: 'Dm7', midis: [50, 53, 57, 60, 65] },
  { id: 'E7', name: 'E7', midis: [40, 47, 50, 56, 59, 64] },
  { id: 'Em7', name: 'Em7', midis: [40, 47, 50, 55, 59, 64] },
  { id: 'Fmaj7', name: 'Fmaj7', midis: [41, 48, 52, 57, 60, 65] },
  { id: 'G7', name: 'G7', midis: [43, 47, 50, 53, 59, 67] },
  { id: 'Am7', name: 'Am7', midis: [45, 52, 55, 60, 64] },
  { id: 'A7', name: 'A7', midis: [45, 52, 55, 57, 61, 64] },
  { id: 'B7', name: 'B7', midis: [47, 51, 54, 57, 63] },
]
