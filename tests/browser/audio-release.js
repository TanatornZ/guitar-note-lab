import { releaseEnvelope } from '../../src/audio/voiceEnvelope.ts'

const SAMPLE_RATE = 44100
const LEVEL = 0.4
const ATTACK_START = 0.01
const ATTACK_END = 0.019
const FADE_START = 0.9
const NATURAL_END = 0.99
const SCHEDULE_TIME = 0.38
const RELEASE_TIME = 0.4
const RELEASE_SECONDS = 0.22
const STOP_PADDING = 0.005
const TOLERANCE = 0.00001

async function render(legacy) {
  const context = new OfflineAudioContext(1, SAMPLE_RATE, SAMPLE_RATE)
  const source = context.createConstantSource()
  const gain = context.createGain()
  source.offset.value = 1
  gain.gain.value = 0
  gain.gain.setValueAtTime(0, ATTACK_START)
  gain.gain.linearRampToValueAtTime(LEVEL, ATTACK_END)
  gain.gain.setValueAtTime(LEVEL, FADE_START)
  gain.gain.linearRampToValueAtTime(0, NATURAL_END)
  source.connect(gain).connect(context.destination)
  source.start(ATTACK_START)
  source.stop(NATURAL_END)
  let scheduleFrame
  // Schedule while already rendering, as a real repeated strum does. Scheduling
  // everything before startRendering hides the instantaneous audible jump.
  const suspension = context.suspend(SCHEDULE_TIME).then(async () => {
    scheduleFrame = Math.round(context.currentTime * SAMPLE_RATE)
    if (legacy) {
      gain.gain.cancelAndHoldAtTime(RELEASE_TIME)
      gain.gain.linearRampToValueAtTime(0, RELEASE_TIME + RELEASE_SECONDS)
    } else {
      releaseEnvelope(gain.gain, {
        startTime: ATTACK_START, attackEndTime: ATTACK_END,
        fadeStartTime: FADE_START, endTime: NATURAL_END, peakGain: LEVEL,
      }, RELEASE_TIME, RELEASE_SECONDS)
    }
    source.stop(RELEASE_TIME + RELEASE_SECONDS + STOP_PADDING)
    await context.resume()
  })
  const output = await context.startRendering()
  await suspension
  const data = output.getChannelData(0)
  const releaseFrame = Math.round(RELEASE_TIME * SAMPLE_RATE)
  return {
    schedulingJump: Math.abs(data[scheduleFrame] - data[scheduleFrame - 1]),
    gainBeforeRelease: data[releaseFrame - 1],
    gainAtRelease: data[releaseFrame],
    midpointGain: data[Math.round((RELEASE_TIME + RELEASE_SECONDS / 2) * SAMPLE_RATE)],
    endGain: data[Math.round((RELEASE_TIME + RELEASE_SECONDS) * SAMPLE_RATE)],
  }
}

window.audioReleaseCheck = (async () => {
  const legacy = await render(true)
  const fixed = await render(false)
  const passed = fixed.schedulingJump < TOLERANCE
    && Math.abs(fixed.gainBeforeRelease - LEVEL) < TOLERANCE
    && Math.abs(fixed.gainAtRelease - LEVEL) < TOLERANCE
    && Math.abs(fixed.midpointGain - LEVEL / 2) < TOLERANCE
    && Math.abs(fixed.endGain) < TOLERANCE
  const result = { passed, legacy, fixed }
  document.querySelector('#result').textContent = JSON.stringify(result, null, 2)
  document.title = `${passed ? 'PASS' : 'FAIL'} — Guitar release regression`
  if (!passed) throw Error('Release envelope introduced an audio discontinuity')
  return result
})()
window.audioReleaseCheck.catch(error => { document.querySelector('#result').textContent = error.stack })
