import { NOTES } from '../data/music'
import type { PitchClass } from '../types/music'

interface NotePickerProps {
  selectedNotes: PitchClass[]
  onToggle: (pitch: PitchClass) => void
}

export function NotePicker({ selectedNotes, onToggle }: NotePickerProps) {
  return <div className="note-picker" aria-label="Choose notes by name">
    {NOTES.map((note, pitch) => <button
      key={note}
      className={`note ${selectedNotes.includes(pitch) ? 'selected' : ''}`}
      onClick={() => onToggle(pitch)}
    >{note}</button>)}
  </div>
}
