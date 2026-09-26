# Developing and tuning the guitar sound

This guide describes the current recorded-sample engine in [GuitarAudio.ts](../src/audio/GuitarAudio.ts). Read it before changing sustain, strumming, tone, or sample playback. The linked source files are the source of truth; update this guide when behavior or defaults change.

## How playback works

The engine loads MP3 guitar notes from [public/audio/guitar](../public/audio/guitar). At decode time it detects each sample's musical attack and caches a playback offset to skip low-level lead-in noise. For each requested MIDI note it picks the nearest recorded pitch, changes playback rate to reach the target pitch, and schedules a short attack and end fade. The recording supplies the natural decay; there is no looping oscillator sustaining the guitar indefinitely.

The default profile aims for a warm acoustic character: fuller low body resonance, a brief bright pick transient, softer sustained overtones, and a restrained room effect. It is not a sampled or physically modeled Gibson instrument. The existing recordings have no velocity layers or round-robin takes; filtering and dynamics cannot reproduce those missing articulations.

The audio connections are:

```mermaid
flowchart LR
  Sample[Recorded note] --> NoteFilter[Per-note low-pass filter]
  NoteFilter --> Envelope[Per-note gain envelope]
  Envelope --> Master[Guitar master gain]
  Master --> Body[Body resonance filter]
  Body --> Bass[Bass EQ]
  Bass --> Middle[Middle EQ]
  Middle --> Treble[Treble EQ]
  Treble --> Compressor[Shared compressor]
  Treble --> Room[Room convolution]
  Room --> Wet[Room gain]
  Wet --> Compressor
  Click[Metronome oscillator] --> ClickGain[Click envelope]
  ClickGain --> Compressor
  Compressor --> Output[Browser audio output]
```

Guitar EQ affects the direct sound and the signal sent into the room effect. The metronome bypasses guitar gain, filters, and reverb, but shares the final compressor. Changes to that compressor can therefore affect both guitar and clicks. Neutral EQ means no *additional* bass/middle/treble gain; the body filter and per-note processing still apply.

## Files and responsibilities

| File | Responsibility |
| --- | --- |
| [src/audio/GuitarAudio.ts](../src/audio/GuitarAudio.ts) | Audio graph, sample loading, scheduling, voice tracking, cancellation, and live EQ |
| [src/audio/voiceEnvelope.ts](../src/audio/voiceEnvelope.ts) | Scheduled gain evaluation and explicitly anchored release ramps, including Stop during an existing fade |
| [src/audio/sampleStart.ts](../src/audio/sampleStart.ts) | Detects a safe playback start after low-level recording lead-in; does not modify the recording or its tail |
| [src/constants/audio.ts](../src/constants/audio.ts) | Output, note, strum, room, and metronome settings |
| [src/data/guitarTone.ts](../src/data/guitarTone.ts) | EQ bands, neutral values, range, and smoothing |
| [src/components/GuitarToneControls.tsx](../src/components/GuitarToneControls.tsx) | Sliders and reset button; sends a complete tone object to `setTone` |
| [src/data/strumChords.ts](../src/data/strumChords.ts) | MIDI voicings used in Strum Studio |
| [src/data/strumPresets.ts](../src/data/strumPresets.ts) | Directions, accents, progression durations, and practice preset |
| [src/constants/studio.ts](../src/constants/studio.ts) | Tempo range, subdivisions, time signatures, and duration choices |
| [src/pages/StrumStudioPage.tsx](../src/pages/StrumStudioPage.tsx) | Sequences steps, selects the chord, and calls the audio engine |

## Units and when settings take effect

- Web Audio scheduling and envelope settings use **seconds**. The studio's interval timer uses **milliseconds**: `MILLISECONDS_PER_MINUTE / bpm / subdivisions`.
- Frequencies use **Hz**; `Db`/`DB` settings use **decibels**. Other gain/velocity values are **linear multipliers**, not percentages or dB.
- Detune uses **cents**. The current `detuneRangeCents` of 1 produces approximately -0.5 to +0.5 cents because the random value is centered before multiplication. Small variation keeps overlapping notes from sounding excessively chorused.
- `Q` controls filter resonance/bandwidth. It is not a volume setting.
- Changing `setTone` applies smoothly to already-ringing notes. Changing source constants requires a reload for a reliable comparison: master gain, body filters, compressor, and room impulse are created once per engine instance.
- Each page owns an engine. Tone controls currently keep local state and reset when the page is remounted; settings are not saved across page navigation or reloads.

## Sound settings reference

The defaults below are the values at the time of writing. Tune one related group at a time and compare at similar listening volume.

### Strumming and dynamics

These settings are in `STRUM_PLAYBACK` in [audio.ts](../src/constants/audio.ts).

| Setting | Default | Effect |
| --- | --- | --- |
| `downstrokeGapSeconds` / `upstrokeGapSeconds` | 0.009 / 0.006 | Base time between string attacks, before the sweep curve. Increase for a wider sweep; large gaps sound like an arpeggio. |
| `sweepStartGapMultiplier` / `sweepGapReduction` | 1.18 / 0.36 | Gap multiplier is `start - position * reduction`: the pick accelerates across the voicing. |
| `accentGapMultiplier` | 0.84 | Accented strokes have a faster, tighter sweep. |
| `upstrokeStringCount` | 4 | Number of highest MIDI notes brushed on an upstroke. Downstrokes use the complete voicing. |
| `downstrokeVelocity` / `upstrokeVelocity` | 1 / 0.72 | Base strength of each direction. |
| `accentMultiplier` | 1.16 | Strength multiplier when a pattern step has an accent. |
| `velocityMinimum` / `velocityVariation` | 0.94 / 0.12 | Random strength variation shared by a stroke. |
| `gapMinimumMultiplier` / `gapVariation` | 0.85 / 0.3 | Random variation around the base string gap. |
| `leadingStringVelocity` / `trailingStringVelocityReduction` | 1.05 / 0.18 | Strength falls across the stroke. |
| `stringVelocityMinimum` / `stringVelocityVariation` | 0.96 / 0.08 | Additional small variation per note. |
| `detuneRangeCents` | 1 | Tiny pitch variation; large values can make chords sound out of tune. |

`startDelaySeconds` is scheduling lead time, not the space between strings. Avoid using it as a strum-speed control. Notes are ordered by MIDI pitch, and damping is keyed by MIDI note rather than physical string identity. Adding a true string/fret model would require changing both the voicing data and voice tracking.

### Sustain, fades, and attack

| Setting | Default | Effect |
| --- | --- | --- |
| `STRUM_PLAYBACK.repeatedStringReleaseSeconds` | 0.22 | Crossfade beneath a new strike of the same pitch. Limits stacked recordings during fast rhythms; does not shorten rests or unstruck bass notes. |
| `STRUM_PLAYBACK.chordChangeReleaseSeconds` | 0.18 | Fade for notes absent from the next chord. Longer values allow more harmony overlap. |
| `NOTE_PLAYBACK.stopReleaseSeconds` | 0.025 | Short fade for an explicit Stop; keep this separate from musical sustain. |
| `NOTE_PLAYBACK.attackSeconds` / `attackVariationSeconds` | 0.008 / 0.002 | 8–10 ms fade-in softens the sharp recorded onset; the gain starts at zero before the source is connected. |
| `NOTE_PLAYBACK.endFadeSeconds` | 0.22 | Fade at the end of the available sample. This does not extend the recording. |
| `NOTE_PLAYBACK.minimumHoldSeconds` | 0.012 | Keeps the end-fade scheduling point after the normal short attack. Recheck this if lengthening attacks. |
| `NOTE_PLAYBACK.endStopPaddingSeconds` / `releaseStopPaddingSeconds` | 0.01 / 0.005 | Small scheduling gaps after fades before stopping a source. These do not add sustain. |

A `rest` pattern step is displayed as **Ring** and schedules no new guitar attack. It must not call `stop()`. A chord's beat duration controls when the sequencer moves to the next chord, not the duration of each audio buffer.

The current sample lifetime is `(buffer.duration - sampleStart) / (playbackRate * 2 ** (detuneCents / 1200))`, including the small pitch variation. There is no fixed five-second cutoff. Increasing release times cannot create a missing tail in a short recording; use a longer suitable recording if the sample itself ends too early. Avoid looping the pick attack to create sustain.

### Strum-only pre-attack tick: release automation

The repeated/changing-chord path releases old strummed voices; ordinary single-note playback does not. In Chrome, `cancelAndHoldAtTime(when)` on a constant gain plateau followed by `linearRampToValueAtTime(0, end)` did not reliably create a new ramp-start event at `when`. The new ramp reached back toward the old attack event. When scheduled while audio was already running, this abruptly lowered the ringing note at scheduling time, **before the next strum started**. This explains why smoothing the new note's attack was insufficient.

`releaseEnvelope` now cancels/holds automation, explicitly calls `setValueAtTime(heldGain, when)`, then schedules the fade to zero. `heldGain` is evaluated from the tracked envelope, not `AudioParam.value`: the requested time can be in the future, during the original attack/end fade, or during a previous release. Stop must use the partially faded level and must never restore an old voice to full volume.

Keep the stored envelope times identical to those scheduled on the gain node. Keep releasing voices tracked until `onended`. This fix is shared by `play(midis, true)` in Chord Finder and `playStrum(...)` in Strum Studio; no new EQ or sample changes are needed for the release fix.

### Removing pre-strum lead-in noise

Previously every source started at buffer time zero, and its gain reached full level before the musical attack. Decoded waveform inspection found low-level signal before the attack in all 11 supplied MP3s. Repeating that lead-in with every string can contribute a repeated pre-strum noise.

`findSampleStart` measures 2 ms RMS windows in the first 120 ms of each decoded buffer. It requires two consecutive windows at or above 10% of the peak window RMS, then retains 2 ms of pre-roll. The 8–10 ms gain fade starts at this new position to avoid a discontinuity. Silent/very quiet recordings, isolated clicks, and attacks later than 80 ms fall back to offset zero. Stereo analysis uses the strongest channel, not a phase-cancelling mono sum.

All thresholds are named in `SAMPLE_START` in [audio.ts](../src/constants/audio.ts). An absolute peak RMS below 0.003 disables trimming; this is a detection safeguard, not a playback noise gate. There is no processing of the ringing tail and no change to the distributed MP3 assets or their attribution.

The playback offset is in original buffer seconds, **not divided by playback rate** when passed to [`source.start(when, offset)`](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/start). Only the remaining playback lifetime is divided by the effective rate. Both ordinary notes and strums use the cached offset.

A local 44.1 kHz PCM inspection of the supplied recordings produced offsets of approximately 18–28 ms (E2: 27.93 ms, A2: 25.94 ms, B3: 17.95 ms). Decoder priming can differ, which is why offsets are detected from decoded data instead of hard-coded per filename. These measurements establish that the lead-in is skipped; they do not replace listening checks for the reported noise.

Trimming alone did not resolve the reported quiet tick. The onset now also starts at 35% of the note's normal low-pass cutoff and opens to full brightness over 25 ms, before the existing brightness-decay ramps. This targets brief broadband attack transients without filtering the entire note more heavily or shortening the sustain. This is transient suppression, not proof that every possible source of a tick (including device output) is eliminated.

### Brightness, EQ, body, and room

| Setting | Default | Effect |
| --- | --- | --- |
| `NOTE_PLAYBACK.brightnessHz` | 6600 | Initial low-pass cutoff for ordinary note playback. Strums provide their own cutoff. |
| `NOTE_PLAYBACK.attackBrightnessRatio` / `brightnessOpeningSeconds` | 0.35 / 0.025 | Start at this fraction of the target cutoff and open smoothly; suppresses a sharp tick at the start of the recording. Keep the opening shorter than `pickDecaySeconds`. |
| `STRUM_PLAYBACK.baseBrightnessHz` / `velocityBrightnessHz` / `trailingStringBrightnessReductionHz` | 2800 / 3400 / 500 | Strum cutoff is `base + perStringVelocity * velocityBrightness - position * trailingReduction`. Softer strings and upstrokes are darker as well as quieter. |
| `NOTE_PLAYBACK.pickBrightnessRatio` / `pickDecaySeconds` | 0.82 / 0.085 | After opening, soften the pick overtones. |
| `NOTE_PLAYBACK.sustainedBrightnessRatio` / `brightnessDecaySeconds` | 0.58 / 1.8 | Final cutoff ramp warms the ringing tail; ratios are relative to the full target cutoff and times are relative to note start. |
| `NOTE_PLAYBACK.lowpassQ` | 0.5 | Resonance of each note's low-pass filter. |
| `GUITAR_OUTPUT.bodyFrequencyHz` / `bodyGainDb` / `bodyQ` | 155 / 2.4 / 0.65 | Broad, fixed body-resonance boost before the user EQ. |
| `ROOM_REVERB.durationSeconds` / `decayExponent` / `wetGain` | 0.48 / 2.8 / 0.045 | Length, decay shape, and level of the generated room impulse. More room sound is not a substitute for string sustain. |

User EQ is configured in [guitarTone.ts](../src/data/guitarTone.ts): bass is a 200 Hz low shelf, middle is an 800 Hz peaking filter, and treble is a 3200 Hz high shelf. `TONE_LIMIT` is ±12 dB, `TONE_STEP_DB` is 1 dB, and `TONE_SMOOTHING_SECONDS` is 0.015 seconds. The smoothing value is a time constant, not a hard completion deadline. `TONE_FILTER_Q` is currently 0.8; its bandwidth effect matters for the middle peaking band.

Use `setTone` for interactive changes; it clamps excessive values and treats non-finite values as neutral. If you change the default tone, keep the engine, slider initialization, reset behavior, and UI wording consistent.

### Level and compression

`GUITAR_OUTPUT.masterGain` is 0.58. Each note also uses `NOTE_PLAYBACK.gainMinimum` (0.7) plus `gainVariation` (0.045), multiplied by velocity and divided by the square root of chord size. Upstrokes use the complete chord size for this scaling even when they strike only the higher notes.

The compressor uses a -12 dB threshold, 12 dB knee, 2.5:1 ratio, 0.018-second attack, and 0.24-second release. The gentler ratio and slower attack preserve more pick dynamics. These values live in `GUITAR_OUTPUT`. Stronger EQ boosts or longer overlapping tails can drive compression harder, so check dense chords and repeated strokes as well as isolated notes. A compressor is not a guarantee against clipping.

`METRONOME` settings affect click pitch, gain, and envelopes independently of the guitar tone. Keep `nearSilentGain` positive because the click uses exponential gain ramps.

## Practical adjustment recipes

These are starting experiments, not pre-tested replacement presets. Reset the UI EQ before comparing source-level changes.

| Goal | Try first | Listen for |
| --- | --- | --- |
| More continuous strumming | Increase `repeatedStringReleaseSeconds` slightly, for example from 0.22 to 0.28. | Smooth overlap without excessive buildup at fast tempos; leave natural rest tails uncapped. |
| Clearer chord changes | Reduce `chordChangeReleaseSeconds` slightly. | Cleaner transitions without a chopped ending. |
| Brighter guitar | Try a small treble boost in the UI; then review strum cutoff settings if the default needs changing. | Pick detail without harshness; test single notes and chords separately. |
| Warmer guitar | Try a modest bass boost or treble cut in the UI. | Body without low-end mud on six-note chords. |
| Faster, tighter strokes | Reduce the two stroke gaps slightly. | A recognizable direction rather than nearly simultaneous notes. |
| Softer upstrokes | Lower `upstrokeVelocity`. | Audible contrast without losing the rhythm. |
| Less artificial variation | Reduce velocity/gap/detune variations independently. | More consistency without removing all expressive differences. |

Changing a constant should not require edits to unrelated components. If it does, check for a remaining duplicated number before adding another setting.

## Engine API and lifecycle

| Method | Caller responsibility and behavior |
| --- | --- |
| `prepare(): Promise<boolean>` | Call from the user-triggered start workflow. Loads/resumes audio and reports whether it is ready. |
| `play(midis, strum?)` | Plays simultaneous notes by default or a downstroke when `strum` is true. |
| `playStrum(midis, direction, accent?)` | Uses a full MIDI voicing, down/up direction, and optional accent. |
| `playMetronome(accent?)` | Schedules a short click directly into the shared compressor. |
| `setTone({ bass, middle, treble })` | Accepts a complete dB setting object. It can store values before audio starts without creating an audio context. |
| `stop()` | Cancels pending playback through a generation counter and fades tracked guitar voices, including tails already releasing. |

Sample loading is cached per engine instance. Playback methods handle errors internally through status messages and console warnings; callers should use `prepare()`'s boolean result when deciding whether to start a sequence.

Keep releasing guitar voices in the tracking set until `source.onended` disconnects their nodes. Removing them when their fade begins would prevent Stop from reaching those tails. The metronome oscillator is not in that set; an already-started click finishes its short envelope. The room output may also decay briefly after Stop.

Keep one engine in a React ref rather than constructing one on every render. `StrumStudioPage` handles pending-start cancellation, clears its interval through effect cleanup, and calls `stop()` on unmount. Preserve both the page request guard and engine generation guard when changing async startup. `stop()` does not close the audio context; a future disposal API needs its own lifecycle handling.

The sequencer currently uses `window.setInterval`, then the engine schedules each stroke against `AudioContext.currentTime`. It is not a look-ahead audio transport. If investigating timing drift under UI load or in background tabs, inspect the scheduler rather than compensating with different string gaps. Current 6/8 timing uses six numbered pulses; it does not implement a separate dotted-quarter tempo interpretation.

## Adding or replacing recordings

1. Add the audio under `public/audio/guitar/` and register its MIDI pitch and filename stem in the `SAMPLES` array in `GuitarAudio.ts`. Merely placing a file in the directory does not load it.
2. Confirm that the actual recorded pitch matches its MIDI entry. Playback uses the nearest registered sample and the ratio `2 ** ((targetMidi - sampleMidi) / 12)`.
3. Check the attack, silence at the start, full decay, tuning, and relative loudness against neighboring samples. Verify `findSampleStart` preserves the pick transient for each replacement; its defaults target the current short-attack recordings, not arbitrary instruments. Pitch-shifting upward also shortens the available tail.
4. Keep asset URLs rooted at `/audio/guitar/`. Check loading in development and the production preview.
5. Preserve or update [ATTRIBUTION.txt](../public/audio/guitar/ATTRIBUTION.txt) and the visible credits when the source or license changes. Its current text says the MP3 files are redistributed unchanged; revise that statement if you modify the recordings.
6. Update the sample-loading tests and any expectations affected by the new set. Do not raise gains to compensate for a mislabeled pitch or an unsuitable recording.

For a chord-voicing change, edit `strumChords.ts` rather than the sample registry. Keep playable MIDI voicings: pitch classes alone discard octave/register information and can sound unlike a guitar chord.

## Tests and troubleshooting

[GuitarAudio.test.ts](../src/audio/GuitarAudio.test.ts) uses fake Web Audio nodes and deterministic randomness to check sample reuse, strum order, timing, damping, full remaining sample lifetime, onset-offset playback, tone routing, cancellation, and cleanup. [sampleStart.test.ts](../src/audio/sampleStart.test.ts) tests lead-in detection, isolated clicks, quiet/immediate/late attacks, stereo phase, and sample-rate independence with PCM fixtures. [StrumStudioPage.test.tsx](../src/pages/StrumStudioPage.test.tsx) checks sequence timing, rests, accents, metronome behavior, presets, and live tone controls.

Run the focused tests during audio work:

```bash
npm test -- src/audio src/pages/StrumStudioPage.test.tsx src/pages/ChordFinderPage.test.tsx
```

Then run all checks in [CONTRIBUTING.md](../CONTRIBUTING.md#verify-before-handing-off). When changing a sound default intentionally, revise affected assertions to express the intended audible behavior. Keep tests for note ordering, cancellation, cleanup, and smooth changes; changing all expectations to reference the same constants can hide regressions.

### Earlier browser check of attack softening

The “Don't Look Back in Anger” practice preset was rendered with Chrome's real `OfflineAudioContext` at 44.1 kHz, neutral EQ, metronome disabled, and deterministic randomness. One progression contains 48 strokes / 231 notes at 82 BPM. The A/B comparison changed only the onset fade/filter treatment, keeping samples, pattern, sustain, and output processing the same.

- Energy above a 4.5 kHz high-pass in the first 25 ms of each stroke fell by about 2.36 dB. This is a transient-energy metric, not a measurement of the user's perceived tick loudness.
- The 80–140 ms body window changed by about +0.08 dB; the new output peak was approximately 0.805 (below full scale).
- A separate 12.5-second normal UI Play/Stop run scheduled 245 notes, zero metronome oscillators, and zero late source starts. Stop completed normally.
- The full-preset unit regression checks the attack treatment on all 231 notes and verifies no oscillator is introduced on rests.

These are actual browser-rendering and scheduling checks, not a subjective listening verdict. Repeat the manual listening checklist on the user's playback device before declaring the tick completely eliminated.

### Real-browser release regression

Run `npm run dev`, then open `/tests/browser/audio-release.html` on that development server. This diagnostic uses the production `releaseEnvelope` helper with native `OfflineAudioContext`; it renders silently, reports PASS/FAIL, and requires no new dependency. It is not part of the production app build or the mocked Vitest suite.

The test suspends an already-running render and schedules a future release, matching the live strum lifecycle. With the old code, a constant 0.4 signal jumped to approximately 0.15958 at scheduling time (a 0.24042 discontinuity). With the explicit anchor, the measured discontinuity is zero: the signal remains at 0.4 until the release time and then fades linearly to zero. Other browsers may already handle the old sequence differently; the fixed path must pass regardless.

The 48-stroke / 231-note Anger preset was also A/B-rendered while scheduling each stroke during rendering, not all before rendering began. This is important: pre-scheduling everything can hide the instantaneous jump. The only A/B change was release anchoring. Second-difference energy in the pre-attack windows decreased by about 7.80 dB, and the fixed output peak was about 0.862 (no clipping in this test). This metric measures sharp waveform changes, not perceived tick loudness. Both public chord-playback APIs also have unit regressions for the explicit anchor; separate envelope tests cover pending notes, attacks, natural fades, repeat Stop, and already-releasing tails.

| Symptom | First checks |
| --- | --- |
| No sound or loading never finishes | User gesture, sample network responses, decode errors, browser audio support, and status messages. |
| Sustain sounds chopped | Same-note release, chord-change release, source duration, and accidental calls to Stop on ring steps. |
| Sound is muddy or pumps | Release overlap, low-frequency boosts, room level, and compressor settings. |
| Pick attack is missing | Sample leading silence, gain attack time, and per-note low-pass filtering. |
| Tick on chords but not single notes | Run the native release regression and check that every release explicitly anchors the evaluated gain before its ramp. Single-note playback does not use the strum damping path. |
| Noise on both notes and chords | Disable the metronome to isolate it, inspect the decoded recording lead-in and `SAMPLE_START` detection, and check fade-in alignment. Do not gate the entire sustain to hide onset noise. |
| Brightness change works on a fret but not a strum | Strums override `NOTE_PLAYBACK.brightnessHz`; check `STRUM_PLAYBACK` brightness settings. |
| Changing a constant has no audible effect | Reload to recreate the engine, reset UI EQ, and confirm which playback path uses the setting. |
| Loop starts after Stop or after leaving the page | Engine generation cancellation, page request guard, and effect cleanup. |

## Manual listening checks

Unit tests do not render or listen to real audio. Before handing off an audio implementation change:

1. Start with neutral EQ and a comfortable, consistent playback volume. Compare changes using the same playback device and musical settings.
2. Play isolated low and high frets. Let each ring to its natural ending; check pitch and attack. With the metronome off, listen for lead-in noise or a new click at the trimmed start, especially on repeated E2/A2 notes and C/G strums.
3. Play C, G, Am, F, and Gm in Strum Studio. Compare downstrokes, upstrokes, accented steps, and ring steps.
4. Compare slow playback with fast sixteenth notes. Check both repeated chords and chord changes, including changes inside a bar.
5. Try bass, middle, and treble cuts/boosts while a chord rings. Reset the tone and confirm that the loop continues without an extra stroke.
6. Toggle the metronome. Confirm its numbered-beat timing and that EQ changes do not directly filter the click.
7. Stop during a ringing chord and during initial loading; then restart. Load a preset while playing and verify that playback stops until explicitly started again.
8. Run a production preview and repeat a short loop to confirm the build and sample URLs work together.

In the handoff, distinguish automated results from listening results. Include the settings changed, the reason, and any browser or sound-quality limitations still observed.
