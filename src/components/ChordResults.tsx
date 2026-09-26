import { noteName } from '../data/music'
import type { ChordMatch, PitchClass } from '../types/music'
import { MAX_VISIBLE_CHORD_MATCHES, MIN_CHORD_PLAYBACK_NOTES } from '../constants/music'
import { useI18n, type TranslationKey } from '../i18n'

const chordTypeKeys: Record<string, TranslationKey> = {
  major: 'chord.major', minor: 'chord.minor', diminished: 'chord.diminished', augmented: 'chord.augmented',
  sus2: 'chord.suspended2', sus4: 'chord.suspended4', power: 'chord.power', sixth: 'chord.sixth',
  minorSixth: 'chord.minorSixth', dominantSeventh: 'chord.dominantSeventh', majorSeventh: 'chord.majorSeventh',
  minorSeventh: 'chord.minorSeventh', halfDiminished: 'chord.halfDiminished', diminishedSeventh: 'chord.diminishedSeventh',
  addNine: 'chord.addNine', dominantNinth: 'chord.dominantNinth',
}

interface ChordResultsProps {
  selectedNotes: PitchClass[]
  matches: ChordMatch[]
  audioStatus: string
  onToggleNote: (pitch: PitchClass) => void
  onChooseChord: (tones: PitchClass[]) => void
  onPlayChord: () => void
}

export function ChordResults({ selectedNotes, matches, audioStatus, onToggleNote, onChooseChord, onPlayChord }: ChordResultsProps) {
  const { t } = useI18n()
  return <aside className="rounded-[22px] border border-[#314267] bg-[linear-gradient(145deg,#18233eeb,#111a2eee)] p-4 shadow-[0_24px_50px_#02050f55] sm:p-6" aria-live="polite">
    <div className="font-mono text-xs font-medium tracking-[.11em] text-[#f2ae49] uppercase">{t('finder.selectedNotes')}</div>
    <div className="my-4 flex min-h-[42px] flex-wrap gap-[7px]">
      {selectedNotes.length
        ? selectedNotes.slice().sort((a, b) => a - b).map((pitch) => <button className="cursor-pointer rounded-[10px] border border-[#4a5c87] bg-[#1b2945] px-3 py-2 text-sm text-[#d8e0f4] transition hover:border-[#f2ae49]" key={pitch} onClick={() => onToggleNote(pitch)}>{noteName(pitch)} ×</button>)
        : <div className="w-full rounded-[13px] border border-dashed border-[#435377] px-4 py-6 text-center text-sm leading-relaxed text-[#aeb9d2]">{t('finder.emptyNotes')}</div>}
    </div>
    <button className="w-full cursor-pointer rounded-xl border border-[#d89233] bg-gradient-to-r from-[#f6b955] to-[#ee936a] px-3.5 py-3 font-extrabold text-[#1b2030] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40" disabled={selectedNotes.length < MIN_CHORD_PLAYBACK_NOTES} onClick={onPlayChord}>{t('finder.playChord')}</button>
    <p className="my-2.5 text-sm text-[#aeb9d2]" role="status">{audioStatus}</p>
    <div className="my-4 h-px bg-[#2b3a5c]" />
    <div className="flex items-start justify-between gap-3 text-xs text-[#aeb9d2]"><span>{t('finder.possibleChords')}</span><span className="shrink-0 font-mono text-xs font-medium text-[#77e4bf]">{selectedNotes.length ? t('finder.matchCount', { count: matches.length }) : '—'}</span></div>
    <div className="mt-3.5 grid gap-[9px]">
      {matches.length
        ? matches.slice(0, MAX_VISIBLE_CHORD_MATCHES).map((chord) => <button className={`grid w-full cursor-pointer grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-1 rounded-[13px] border px-3 py-3 text-left transition hover:border-[#f2ae49] sm:grid-cols-[auto_1fr_auto] sm:gap-y-0 ${chord.exact ? 'border-[#916a31] bg-[linear-gradient(100deg,#2a2115,#151d2e)]' : 'border-[#314262] bg-[#10192c]'}`} key={`${chord.name}-${chord.tones}`} onClick={() => onChooseChord(chord.tones)}>
          <span className="font-mono text-lg font-bold text-[#f2ae49]">{chord.name}</span><small className="min-w-0 text-[#aeb9d2]">{chord.tones.map(noteName).join(' · ')}</small><span className="col-span-2 text-xs text-[#bdd0f3] sm:col-span-1 sm:text-right">{chord.exact ? t('finder.exactSet') : t('finder.compatible')}<br />{chordTypeKeys[chord.type] ? t(chordTypeKeys[chord.type]) : chord.type}</span>
        </button>)
        : <div className="rounded-[13px] border border-dashed border-[#435377] px-4 py-6 text-center text-sm leading-relaxed text-[#aeb9d2]">{t('finder.emptyMatches')}</div>}
    </div>
    <div className="mt-[18px] flex gap-2.5 rounded-xl bg-[#0d1526] p-[13px] text-xs text-[#aeb9d2]"><b className="font-mono text-[#77e4bf]">{t('finder.tip')}</b><span>{t('finder.tipText')}</span></div>
  </aside>
}
