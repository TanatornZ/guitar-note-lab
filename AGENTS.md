# Chord Canvas contributor guide

## Stack

- React + TypeScript, built with Vite
- Tailwind CSS v4 through `@tailwindcss/vite`
- MUI for the searchable chord autocomplete control
- Browser Web Audio API with recorded guitar samples

## Commands

- `npm install` — install dependencies
- `npm run dev` — start the Vite development server
- `npm run check` — run the strict TypeScript check
- `npm test` — run the Vitest unit test suite
- `npm run coverage` — run tests with the enforced 80% line-coverage threshold
- `npm run build` — create the deployable site in `dist/`
- `npm run preview` — serve the production build locally

Before handing off a change, run `npm run check`, `npm test`, `npm run coverage`, and `npm run build`.

## Version control

- Do not create Git commits after making code changes. Leave changes uncommitted for the user to review and commit unless the user explicitly asks for a commit.

## Project layout

- `src/App.tsx` composes the application screen.
- `src/pages/` contains path-routed screens, including the chord finder and Strum Studio.
- `src/components/` contains presentational UI components.
- `src/i18n/index.tsx` configures i18next. Translation resources live in `src/i18n/locales/`; use `useI18n().t(...)` for user-facing copy and add both-language entries together.
- `src/constants/` contains named music, audio, and studio configuration values. Include units in names where relevant (seconds, Hz, dB, BPM, MIDI).
- `src/data/music.ts` contains note names, standard tuning, and chord shapes.
- `src/data/strumChords.ts` contains playable guitar voicings for the Strum Studio chord palette.
- `src/lib/chords.ts` derives compatible chord names from selected pitch classes.
- `src/types/music.ts` contains the shared music-domain TypeScript types.
- `src/audio/GuitarAudio.ts` loads, pitches, strums, and stops the recorded guitar samples.
- `public/audio/guitar/` contains source audio assets and their required attribution.
- `public/site.webmanifest` and the PWA icons describe the installable app; `vite.config.js` generates its offline service worker.
- `dist/` is generated Vite output; rebuild it rather than editing it manually.

## UI and state conventions

- Use meaningful constants for behavior-controlling numbers instead of unexplained numeric literals. Keep constants grouped by purpose; equal numbers with different meanings must not share a constant. Ordinary loop counters, musical data (chord intervals and MIDI voicings), and Tailwind classes can remain literal.
- Use Tailwind utility classes for UI styling. Keep `src/styles.css` limited to Tailwind setup, theme tokens, and external font imports.
- Use MUI `Autocomplete` for the Strum Studio chord picker; keep its `sx` styling aligned with the existing dark theme.
- Preserve the existing dark Chord Canvas design: layered navy background, amber highlights, wood fretboard, and responsive two-column layout from 900px up.
- Keep musical notes as pitch classes (`0`–`11`) and use `noteName()` for display.
- A selected pitch class highlights every matching note on the neck.
- Clicking a chord result must replace the selected set with the chord tones.
- Keep Strum Studio at the root route (`/`) and the Chord Finder at `/finder`; static hosting must serve `index.html` for both routes.
- In the Strum Studio, a progression item defaults to one complete bar or uses its explicit beat duration. Chord changes may occur inside a bar while the strum pattern continues. Pattern steps must align with the selected time signature.
- Half-beat mode adds an offbeat `&` step after each numbered beat. It doubles the pattern timing while metronome clicks remain on the numbered beats only.
- The rhythm grid supports 1, 2, or 4 steps per beat; sixteenth notes count `1 e & a`. Accents are editable per step, and rests let notes ring.
- Song-inspired presets in `src/data/strumPresets.ts` are simplified practice arrangements. Loading a preset stops playback and replaces the sequence, pattern, tempo, and meter without auto-playing.

## Audio and attribution

- Before changing guitar sound, read [docs/GUITAR_AUDIO.md](docs/GUITAR_AUDIO.md) for the audio graph, tuning settings, lifecycle constraints, and listening checks. See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow. Keep these documents aligned when audio defaults or behavior change.
- Audio setup must occur after a user action; browsers block automatic Web Audio playback.
- Bass, middle, and treble controls are shared UI in `GuitarToneControls`; use `GuitarAudio.setTone` for smooth live EQ. Neutral is 0 dB; clamp bands to ±12 dB and keep the metronome outside the EQ path.
- Keep sample requests rooted at `/audio/guitar/` so they work in Vite development and production.
- Do not remove or alter `public/audio/guitar/ATTRIBUTION.txt` without replacing the samples and updating the visible credits.

## Deployment

- The hosting configuration in `.openai/hosting.json` publishes `dist/`.
- Always build before deployment so `dist/` matches the source change.
- Preserve the PWA navigation fallback and guitar-sample precache when changing routes or asset paths. Service workers require HTTPS in production (localhost is allowed for development).
