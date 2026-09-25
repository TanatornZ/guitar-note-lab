import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { GuitarAudio } from "../audio/GuitarAudio";
import { findChordMatches } from "../lib/chords";
import type { ChordMatch, PitchClass } from "../types/music";

interface ChordContextValue {
  selectedNotes: PitchClass[];
  reversed: boolean;
  audioStatus: string;
  matches: ChordMatch[];
  toggleNote: (pitch: PitchClass, midi?: number) => void;
  toggleStringOrder: () => void;
  clearSelection: () => void;
  chooseChord: (tones: PitchClass[]) => void;
  playSelectedChord: () => void;
}

const ChordContext = createContext<ChordContextValue | null>(null);

export function ChordProvider({ children }: { children: ReactNode }) {
  const [selectedNotes, setSelectedNotes] = useState<PitchClass[]>([]);
  const [reversed, setReversed] = useState(false);
  const [audioStatus, setAudioStatus] = useState("Recorded acoustic guitar · click a fret to hear it");
  const audio = useRef<GuitarAudio | null>(null);

  if (!audio.current) audio.current = new GuitarAudio(setAudioStatus);

  const matches = useMemo(() => findChordMatches(selectedNotes), [selectedNotes]);
  const toggleNote = (pitch: PitchClass, midi?: number) => {
    setSelectedNotes((notes) => notes.includes(pitch) ? notes.filter((note) => note !== pitch) : [...notes, pitch]);
    if (midi !== undefined) void audio.current?.play([midi]);
  };
  const clearSelection = () => {
    audio.current?.stop();
    setSelectedNotes([]);
  };
  const playSelectedChord = () => {
    const midis = selectedNotes.slice().sort((a, b) => a - b).map((pitch) => 48 + pitch);
    void audio.current?.play(midis, true);
  };

  return <ChordContext.Provider value={{
    selectedNotes,
    reversed,
    audioStatus,
    matches,
    toggleNote,
    toggleStringOrder: () => setReversed((value) => !value),
    clearSelection,
    chooseChord: setSelectedNotes,
    playSelectedChord,
  }}>{children}</ChordContext.Provider>;
}

export function useChordContext(): ChordContextValue {
  const context = useContext(ChordContext);
  if (!context) throw new Error("useChordContext must be used within a ChordProvider.");
  return context;
}
