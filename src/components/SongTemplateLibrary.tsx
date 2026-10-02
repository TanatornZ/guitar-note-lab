import { useMemo, useState } from 'react'
import {
  SONG_PRESETS,
  SONG_PRESET_GENRES,
  type SongPreset,
  type SongPresetGenre,
} from '../data/strumPresets'
import { useI18n, type TranslationKey } from '../i18n'

type GenreFilter = (typeof SONG_PRESET_GENRES)[number]

const genreLabels: Record<GenreFilter, TranslationKey> = {
  all: 'studio.genreAll',
  pop: 'studio.genrePop',
  rock: 'studio.genreRock',
  folk: 'studio.genreFolk',
  soul: 'studio.genreSoul',
  reggae: 'studio.genreReggae',
}

interface Props {
  loadedPresetId: string | null
  onLoad: (preset: SongPreset) => void
}

export function SongTemplateLibrary({ loadedPresetId, onLoad }: Props) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<GenreFilter>('all')
  const [templatesVisible, setTemplatesVisible] = useState(true)

  const visiblePresets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return SONG_PRESETS.filter((preset) => {
      const matchesGenre = genre === 'all' || preset.genre === genre
      const haystack = `${preset.name} ${preset.artist} ${preset.key} ${preset.decade}`.toLocaleLowerCase()
      return matchesGenre && haystack.includes(normalizedQuery)
    })
  }, [genre, query])

  return (
    <section
      aria-labelledby="song-template-title"
      className="mb-[18px] overflow-hidden rounded-[24px] border border-[#3b4c73] bg-[linear-gradient(135deg,#172541f5,#101829f5)] shadow-[0_24px_60px_#02050f66]"
    >
      <div className={`${templatesVisible ? 'border-b border-[#2d3e61]' : ''} bg-[radial-gradient(circle_at_12%_0%,#f2ae4917,transparent_22rem)] p-5 sm:p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[.11em] text-[#77e4bf]">
              <span>{t('studio.songbookEyebrow')}</span>
              <span className="rounded-full border border-[#77e4bf55] bg-[#77e4bf12] px-2 py-0.5 text-[10px] text-[#9cf0d3]">
                {t('studio.songbookCount', { count: SONG_PRESETS.length })}
              </span>
            </div>
            <h2 id="song-template-title" className="mt-2 text-2xl font-extrabold tracking-[-0.025em] sm:text-3xl">
              {t('studio.songbookTitle')}
            </h2>
          </div>
          <button
            type="button"
            aria-expanded={templatesVisible}
            aria-controls="song-template-panel"
            onClick={() => setTemplatesVisible((visible) => !visible)}
            className="shrink-0 cursor-pointer rounded-xl border border-[#435377] bg-[#0c1425] px-3 py-2 text-xs font-bold text-[#c3cce0] transition hover:border-[#f2ae49] hover:text-white"
          >
            <span aria-hidden="true">{templatesVisible ? '−' : '+'}</span>{' '}
            {templatesVisible ? t('studio.hideTemplates') : t('studio.showTemplates')}
          </button>
        </div>

        {templatesVisible && (
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-2xl text-sm leading-relaxed text-[#aeb9d2]">
              {t('studio.songbookDescription')}
            </p>
            <label className="block w-full lg:max-w-[360px]">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#aeb9d2]">
                {t('studio.searchTemplates')}
              </span>
              <span className="flex items-center gap-2 rounded-xl border border-[#435377] bg-[#0c1425] px-3 focus-within:border-[#f2ae49]">
                <span aria-hidden="true" className="text-[#7785a6]">⌕</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('studio.searchTemplatesPlaceholder')}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#eff3ff] outline-none placeholder:text-[#6f7b98]"
                />
              </span>
            </label>
          </div>
        )}

        {templatesVisible && (
          <div className="mt-5 flex flex-wrap items-center gap-2" aria-label={t('studio.genreFilter')}>
            {SONG_PRESET_GENRES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={genre === option}
                onClick={() => setGenre(option)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  genre === option
                    ? 'border-[#f2ae49] bg-[#f2ae49] text-[#172033]'
                    : 'border-[#435377] bg-[#0d1629] text-[#b9c3da] hover:border-[#7280a1] hover:text-white'
                }`}
              >
                {t(genreLabels[option])}
              </button>
            ))}
            <span className="ml-auto font-mono text-xs text-[#8f9bb8]">
              {t('studio.templatesFound', { count: visiblePresets.length })}
            </span>
          </div>
        )}
      </div>

      {templatesVisible && <div id="song-template-panel" className="max-h-[590px] overflow-y-auto p-4 sm:p-5">
        {visiblePresets.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visiblePresets.map((preset, index) => {
              const isLoaded = loadedPresetId === preset.id
              return (
                <article
                  key={preset.id}
                  className={`group relative flex min-h-[238px] flex-col overflow-hidden rounded-2xl border p-4 transition ${
                    isLoaded
                      ? 'border-[#f2ae49] bg-[#f2ae4913] shadow-[inset_0_0_0_1px_#f2ae4940]'
                      : 'border-[#344566] bg-[#0d1629cc] hover:-translate-y-0.5 hover:border-[#58698e] hover:bg-[#111d34]'
                  }`}
                >
                  <div aria-hidden="true" className="absolute -right-2 -top-4 font-mono text-[4.5rem] font-black leading-none text-[#ffffff07]">
                    {String(SONG_PRESETS.indexOf(preset) + 1).padStart(2, '0')}
                  </div>
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-[#77e4bf17] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-[#77e4bf]">
                        {t(genreLabels[preset.genre as SongPresetGenre])}
                      </span>
                      <span className="rounded-md bg-[#ffffff08] px-2 py-1 font-mono text-[10px] text-[#8f9bb8]">
                        {preset.decade}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#f2ae49]">{preset.bpm} BPM</span>
                  </div>
                  <h3 className="relative mt-4 text-lg font-extrabold leading-tight text-[#f5f7ff]">
                    {preset.name}
                  </h3>
                  <p className="relative mt-1 text-xs text-[#9da9c4]">
                    {t('studio.byArtist', { artist: preset.artist })}
                  </p>
                  <div className="relative mt-4 flex flex-wrap gap-1.5" aria-label={t('studio.chordPreview')}>
                    {preset.progression.map((chord, chordIndex) => (
                      <span
                        key={`${chord.id}-${chordIndex}`}
                        className="rounded-md border border-[#435377] bg-[#15213a] px-2 py-1 font-mono text-xs font-bold text-[#dbe3f6]"
                      >
                        {chord.name}
                      </span>
                    ))}
                  </div>
                  <div className="relative mt-auto flex items-end justify-between gap-3 pt-4">
                    <p className="font-mono text-[10px] tracking-wide text-[#7f8dab]">
                      {t('studio.templateMeta', {
                        key: preset.key,
                        signature: preset.timeSignature.label,
                      })}
                    </p>
                    <button
                      type="button"
                      aria-label={t('studio.loadTemplateName', { name: preset.name })}
                      onClick={() => onLoad(preset)}
                      className={`shrink-0 cursor-pointer rounded-lg border px-3 py-2 text-xs font-extrabold transition ${
                        isLoaded
                          ? 'border-[#77e4bf] bg-[#77e4bf18] text-[#77e4bf]'
                          : 'border-[#d89233] bg-[#f2ae49] text-[#182033] hover:brightness-110'
                      }`}
                    >
                      {isLoaded ? t('studio.templateLoaded') : t('studio.loadTemplate')}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-[#435377] bg-[#0b1424] px-5 text-center">
            <div>
              <div aria-hidden="true" className="text-3xl">♬</div>
              <p className="mt-2 font-bold text-[#dce4f7]">{t('studio.noTemplates')}</p>
              <p className="mt-1 text-sm text-[#8f9bb8]">{t('studio.noTemplatesHint')}</p>
            </div>
          </div>
        )}
      </div>}
      {templatesVisible && (
        <p className="border-t border-[#2d3e61] bg-[#0b1424aa] px-5 py-3 text-xs leading-relaxed text-[#8794b1]">
          {t('studio.simplifiedNotice')}
        </p>
      )}
    </section>
  )
}
