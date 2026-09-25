// Acoustic samples: N. P. Brosowsky / University of Iowa, CC BY 3.0.
// See audio/guitar/ATTRIBUTION.txt for sources and license.
const samples = [[40,'E2'],[45,'A2'],[48,'C3'],[52,'E3'],[55,'G3'],[59,'B3'],[62,'D4'],[65,'F4'],[69,'A4'],[72,'C5'],[74,'D5']];

export class GuitarAudio {
  constructor(onStatus = () => {}) {
    this.onStatus = onStatus;
    this.buffers = new Map();
    this.voices = new Set();
    this.request = 0;
  }

  async ready() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Audio is not supported by this browser.');
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = .65;
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.value = -12;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = .003;
      this.compressor.release.value = .2;
      this.master.connect(this.compressor).connect(this.context.destination);
    }
    // Resume from the user's click before awaiting any sample downloads.
    const resumed = this.context.resume();
    if (!this.loading) {
      this.onStatus('Loading acoustic guitar…');
      this.loading = Promise.all(samples.map(async ([midi, file]) => {
        if (this.buffers.has(midi)) return;
        const response = await fetch(new URL(`./audio/guitar/${file}.mp3`, import.meta.url));
        if (!response.ok) throw new Error('Guitar sample could not load.');
        this.buffers.set(midi, await this.context.decodeAudioData(await response.arrayBuffer()));
      })).catch(error => { this.loading = null; throw error; });
    }
    await Promise.all([resumed, this.loading]);
  }

  async play(midis, strum = false) {
    const request = ++this.request;
    try {
      await this.ready();
      if (request !== this.request) return;
      const start = this.context.currentTime + .015;
      midis.forEach((midi, index) => this.schedule(midi, start + (strum ? index * .04 : 0), midis.length));
      this.onStatus('Acoustic guitar ready');
    } catch (error) {
      if (request === this.request) this.onStatus('Sound could not load. Click a note to retry.');
      console.warn('Guitar audio:', error);
    }
  }

  schedule(midi, when, count) {
    const ctx = this.context;
    const [sampleMidi] = samples.reduce((nearest, sample) => Math.abs(sample[0]-midi) < Math.abs(nearest[0]-midi) ? sample : nearest);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = this.buffers.get(sampleMidi);
    source.playbackRate.value = 2 ** ((midi-sampleMidi)/12);
    const duration = Math.min(source.buffer.duration/source.playbackRate.value, 5);
    const volume = (.72 + Math.random()*.04) / Math.sqrt(Math.max(1, count));
    // Keep the recorded envelope; only soften the boundaries to avoid clicks.
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(volume, when+.004);
    gain.gain.setValueAtTime(volume, when+Math.max(.005, duration-.18));
    gain.gain.linearRampToValueAtTime(0, when+duration);
    source.connect(gain).connect(this.master);
    const voice = { source, gain };
    this.voices.add(voice);
    source.onended = () => { source.disconnect(); gain.disconnect(); this.voices.delete(voice); };
    source.start(when);
    source.stop(when+duration+.01);
    // Bound rapid repeated clicks and release old notes smoothly.
    while (this.voices.size > 24) this.release(this.voices.values().next().value);
  }

  release(voice) {
    const now = this.context.currentTime;
    voice.gain.gain.cancelAndHoldAtTime(now);
    voice.gain.gain.linearRampToValueAtTime(0, now+.025);
    voice.source.stop(now+.03);
    this.voices.delete(voice);
  }

  stop() {
    ++this.request;
    for (const voice of [...this.voices]) this.release(voice);
  }
}
