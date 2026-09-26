# Contributing to Chord Canvas

Start with [AGENTS.md](AGENTS.md) for project conventions. For changes to guitar sound, read [the guitar audio development guide](docs/GUITAR_AUDIO.md): it maps each sound characteristic to the code and settings that control it.

## Set up the project

Use Node.js 24.x with npm. This is compatible with the versions of Vite, Vitest, and jsdom in the current lockfile. The test tools have stricter Node.js requirements than the development server.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. Use `/` for Strum Studio and `/finder` for the Chord Finder. Click a fret or Play to initialize browser audio.

Use `npm ci` for a repeatable install from `package-lock.json`. When intentionally adding or updating dependencies, use `npm install` and include the resulting lockfile changes for review.

## Find the right code

| Change | Starting point |
| --- | --- |
| Guitar tone, sustain, timing, or effects | [Audio development guide](docs/GUITAR_AUDIO.md) |
| Guitar playback implementation | [GuitarAudio.ts](src/audio/GuitarAudio.ts) |
| Numeric audio settings | [audio.ts](src/constants/audio.ts) |
| Tempo, rhythm grids, and duration choices | [studio.ts](src/constants/studio.ts) |
| Chord voicings or practice presets | [strumChords.ts](src/data/strumChords.ts), [strumPresets.ts](src/data/strumPresets.ts) |
| Fretboard and chord matching | [music.ts](src/constants/music.ts), [chords.ts](src/lib/chords.ts) |
| English/Thai user-facing copy | [locales](src/i18n/locales/) |
| PWA manifest and offline caching | [site.webmanifest](public/site.webmanifest), [vite.config.js](vite.config.js) |
| Page behavior | [ChordFinderPage.tsx](src/pages/ChordFinderPage.tsx), [StrumStudioPage.tsx](src/pages/StrumStudioPage.tsx) |

The pages currently create their own audio engine instances. The chord context also contains an engine for its consumers; editing that context alone will not update either page's playback integration.

## Make a change

1. Reproduce the behavior and write down the desired outcome. For sound changes, compare the same chords, tempo, pattern, EQ settings, and playback volume before and after.
2. Prefer changing a named setting in `src/constants/` or `src/data/guitarTone.ts` when the existing engine already supports the behavior. Keep units explicit in names.
3. Preserve the recorded-sample attribution and user-triggered audio initialization. Keep the UI aligned with the existing Tailwind/MUI design.
4. Update relevant behavior tests when implementation changes. Keep expected outcomes independent enough to catch regressions; do not make a test pass just by repeating the changed constant in its expectation.
5. Update documentation when defaults, units, sample sources, public methods, or playback behavior change.
6. For a user-facing string, add matching English and Thai resources in `src/i18n/locales/` and use `useI18n().t(...)`. Keep chord symbols and note names recognizable across both languages.

## Verify before handing off

```bash
npm run check
npm test
npm run coverage
npm run build
```

Coverage enforces a minimum of 80% lines. Use `npm run test:watch` while developing. Sound changes also require the [manual listening checks](docs/GUITAR_AUDIO.md#manual-listening-checks); mocked Web Audio tests cannot establish whether a guitar sounds natural.

To check production behavior, run `npm run preview` after building. Confirm that the guitar samples load there as well as in development. `dist/` is generated output; do not edit its contents by hand. Building locally does not deploy the website.

For PWA changes, also confirm `dist/sw.js` exists after building and that its precache includes `index.html`, the navigation fallback for `/finder`, icons, and every file in `public/audio/guitar/`. Test offline mode only after one online load has installed the service worker and completed its initial cache.

## Hand off the work

Summarize what changed, which settings were adjusted and why, the checks performed, and any remaining limitations. Leave changes uncommitted unless the user explicitly requests a Git commit. Preserve unrelated work already present in the workspace.
