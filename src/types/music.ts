export type PitchClass = number

export interface GuitarString {
  name: string
  midi: number
}

export interface ChordShape {
  suffix: string
  type: string
  intervals: PitchClass[]
}

export interface ChordMatch {
  name: string
  type: string
  tones: PitchClass[]
  exact: boolean
}
