# Chord Canvas

Chord Canvas is a browser-based guitar chord finder and strumming practice tool. Select notes on the guitar neck to discover compatible chords, then build a progression and play it with recorded acoustic-guitar samples.

## Features

- Interactive 12-fret guitar neck in standard tuning
- Note picker and chord matching for major, minor, seventh, suspended, diminished, augmented, and extended chords
- Reverse string order and select a chord result to show its notes on the neck
- Recorded acoustic-guitar playback with natural downstrokes, lighter upstrokes, string sustain, and chord damping
- Bass, middle, and treble tone controls with live adjustment from -12 dB to +12 dB
- Strum Studio for chord sequences, tempo, time signatures, metronome, and editable down/up/ring patterns
- Quarter-, eighth-, and sixteenth-note rhythm grids
- Adjustable chord duration so chord changes can happen inside a bar
- A simplified “Don't Look Back in Anger” song-inspired acoustic practice preset
- English and Thai interface support, with the selected language remembered in the browser

## Run locally

Use Node.js 24.x with npm for compatibility with the current development and test dependencies.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Strum Studio is the default page; the Chord Finder is available at `/finder`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run check` | Run the TypeScript check |
| `npm test` | Run unit tests once |
| `npm run coverage` | Run tests with the 80% line-coverage requirement |
| `npm run build` | Create the production build in `dist/` |
| `npm run preview` | Preview the production build |

## Using Strum Studio

1. Add chords to the sequence and choose each chord's duration.
2. Set tempo, time signature, and the rhythm grid.
3. Click pattern steps to cycle through downstroke, upstroke, and ring. A ring step lets the previous chord sustain.
4. Turn an accent on for stronger strokes.
5. Use bass, middle, and treble to shape the guitar sound, then press **Play performance**.

To start with the built-in song-inspired practice loop, choose **Load practice preset**. It loads an editable 82 BPM, 4/4, C-major acoustic pattern; it does not reproduce the original recording.

## Audio

Audio playback uses the browser Web Audio API and begins only after a click or other user action. The guitar samples come from the `tonejs-instruments` collection by N. P. Brosowsky, based on University of Iowa Musical Instrument Samples, under CC BY 3.0. See [ATTRIBUTION.txt](public/audio/guitar/ATTRIBUTION.txt) for the full attribution.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- MUI Autocomplete
- i18next + react-i18next
- Vitest and Testing Library
- Web Audio API

## Project structure

```text
src/audio/        Recorded-sample playback and live EQ
src/components/   Reusable interface components
src/constants/    Named audio, music, and studio settings
src/context/      Shared chord-selection state
src/data/         Notes, chord voicings, presets, and tone definitions
src/i18n/         i18next resources and language helpers
src/lib/          Chord matching logic
src/pages/        Chord Finder and Strum Studio screens
public/audio/     Guitar sample files and attribution
```

For contributor conventions and verification requirements, see [AGENTS.md](AGENTS.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for developer setup, the change workflow, and required checks. The [guitar audio development guide](docs/GUITAR_AUDIO.md) explains the signal path, sound settings, sustain, strumming, EQ, sample replacement, and listening checks for future audio work.

## Maintaining numeric settings

Behavior-controlling values have descriptive names and are grouped by purpose:

| File | Settings |
| --- | --- |
| [src/constants/audio.ts](src/constants/audio.ts) | Note envelopes, strum spacing, sustain releases, compressor, room sound, and metronome clicks |
| [src/constants/music.ts](src/constants/music.ts) | Semitones per octave, chord-preview register, fret count, and chord-result limits |
| [src/constants/studio.ts](src/constants/studio.ts) | Tempo range/default, time signatures, rhythm subdivisions, and chord durations |
| [src/data/guitarTone.ts](src/data/guitarTone.ts) | EQ frequencies, gain limits, slider step, and smoothing |

Names include units where needed, such as `repeatedStringReleaseSeconds`, `bodyFrequencyHz`, and `CHORD_PREVIEW_BASE_MIDI`. For example, adjust `TEMPO_BPM.maximum` to change both the tempo slider limit and its displayed label. Fretboard notes and columns share `GUITAR_FRET_COUNT`.

Keep distinct meanings separate even when their values match: twelve frets and twelve semitones per octave are independent settings. Musical datasets, normal index/count arithmetic, and Tailwind styling remain literal where their meaning is already clear.

## Languages

Use the **English / ไทย** switch in the header to choose the interface language. The selection is stored in the browser under `chord-canvas-language`; Thai is selected automatically for a Thai browser locale when no saved choice exists.

Translations are managed with `i18next` and `react-i18next`; setup is in [src/i18n/index.tsx](src/i18n/index.tsx), while the separate [English](src/i18n/locales/en.ts) and [Thai](src/i18n/locales/th.ts) resources live in `src/i18n/locales/`. Add every new user-facing string to both files, use `t('namespace.key')` in components, and keep music symbols, chord names, and technical labels unchanged when that makes them easier to recognize.
