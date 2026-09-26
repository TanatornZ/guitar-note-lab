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

## Project layout

- `src/App.tsx` composes the application screen.
- `src/pages/` contains hash-routed screens, including the chord finder and Strum Studio.
- `src/components/` contains presentational UI components.
- `src/data/music.ts` contains note names, standard tuning, and chord shapes.
- `src/data/strumChords.ts` contains playable guitar voicings for the Strum Studio chord palette.
- `src/lib/chords.ts` derives compatible chord names from selected pitch classes.
- `src/types/music.ts` contains the shared music-domain TypeScript types.
- `src/audio/GuitarAudio.ts` loads, pitches, strums, and stops the recorded guitar samples.
- `public/audio/guitar/` contains source audio assets and their required attribution.
- `dist/` is generated Vite output; rebuild it rather than editing it manually.

## UI and state conventions

- Use Tailwind utility classes for UI styling. Keep `src/styles.css` limited to Tailwind setup, theme tokens, and external font imports.
- Use MUI `Autocomplete` for the Strum Studio chord picker; keep its `sx` styling aligned with the existing dark theme.
- Preserve the existing dark Chord Canvas design: layered navy background, amber highlights, wood fretboard, and responsive two-column layout from 900px up.
- Keep musical notes as pitch classes (`0`–`11`) and use `noteName()` for display.
- A selected pitch class highlights every matching note on the neck.
- Clicking a chord result must replace the selected set with the chord tones.
- Keep the Strum Studio route at `#/strum` so it works on static hosting.
- In the Strum Studio, a progression item defaults to one complete bar or uses its explicit beat duration. Chord changes may occur inside a bar while the strum pattern continues. Pattern steps must align with the selected time signature.
- Half-beat mode adds an offbeat `&` step after each numbered beat. It doubles the pattern timing while metronome clicks remain on the numbered beats only.
- The rhythm grid supports 1, 2, or 4 steps per beat; sixteenth notes count `1 e & a`. Accents are editable per step, and rests let notes ring.
- Song-inspired presets in `src/data/strumPresets.ts` are simplified practice arrangements. Loading a preset stops playback and replaces the sequence, pattern, tempo, and meter without auto-playing.

## Audio and attribution

- Audio setup must occur after a user action; browsers block automatic Web Audio playback.
- Keep sample requests rooted at `/audio/guitar/` so they work in Vite development and production.
- Do not remove or alter `public/audio/guitar/ATTRIBUTION.txt` without replacing the samples and updating the visible credits.

## Deployment

- The hosting configuration in `.openai/hosting.json` publishes `dist/`.
- Always build before deployment so `dist/` matches the source change.
