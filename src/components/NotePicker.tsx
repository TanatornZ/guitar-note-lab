import { NOTES } from '../data/music'
import type { PitchClass } from '../types/music'

interface NotePickerProps {
  selectedNotes: PitchClass[]
  onToggle: (pitch: PitchClass) => void
}

export function NotePicker({ selectedNotes, onToggle }: NotePickerProps) {
  return <div className="mt-[18px] flex flex-wrap gap-[7px]" aria-label="Choose notes by name">
    {NOTES.map((note, pitch) => <button
      key={note}
      className={`size-[43px] cursor-pointer rounded-[10px] border text-sm transition ${selectedNotes.includes(pitch) ? 'border-[#f2ae49] bg-[#f2ae49] font-semibold text-[#172033]' : 'border-[#2b3a5c] bg-[#0e172a] text-[#d8e0f4] hover:border-[#f2ae49]'}`}
      onClick={() => onToggle(pitch)}
    >{note}</button>)}
  </div>
}
