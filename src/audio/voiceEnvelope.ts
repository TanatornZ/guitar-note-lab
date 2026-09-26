export interface VoiceEnvelope {
  startTime: number
  attackEndTime: number
  fadeStartTime: number
  endTime: number
  peakGain: number
  release?: { startTime: number; endTime: number; startGain: number }
}

/** Evaluate the scheduled envelope, not AudioParam.value at the current time. */
export function envelopeGainAt(envelope: VoiceEnvelope, time: number): number {
  const { startTime, attackEndTime, fadeStartTime, endTime, peakGain, release } = envelope
  if (release && time >= release.startTime) {
    return release.startGain * Math.max(0, (release.endTime - time) / (release.endTime - release.startTime))
  }
  if (time <= startTime || time >= endTime) return 0
  if (time < attackEndTime) return peakGain * (time - startTime) / (attackEndTime - startTime)
  if (time <= fadeStartTime) return peakGain
  return peakGain * (endTime - time) / (endTime - fadeStartTime)
}

export function releaseEnvelope(gain: AudioParam, envelope: VoiceEnvelope, when: number, seconds: number): void {
  const startGain = envelopeGainAt(envelope, when)
  gain.cancelAndHoldAtTime(when)
  // cancelAndHoldAtTime does not reliably insert a new ramp anchor on a
  // constant plateau. Without this event, the new ramp can reach back to
  // the attack and jump in volume as soon as the next strum is scheduled.
  gain.setValueAtTime(startGain, when)
  gain.linearRampToValueAtTime(0, when + seconds)
  envelope.release = { startTime: when, endTime: when + seconds, startGain }
}
