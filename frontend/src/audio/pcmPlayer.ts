const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const PREBUFFER_CHUNKS = 1;

export class PcmPlayer {
  private context: AudioContext | null = null;
  private nextPlayTime = 0;
  private queue: AudioBuffer[] = [];
  private prebuffered = 0;
  private started = false;

  async ensureContext(): Promise<AudioContext> {
    if (!this.context) {
      this.context = new AudioContext({ sampleRate: SAMPLE_RATE });
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    return this.context;
  }

  enqueue(pcmBytes: ArrayBuffer): void {
    const ctx = this.context;
    if (!ctx) return;

    const int16 = new Int16Array(pcmBytes);
    const frameCount = Math.floor(int16.length / CHANNELS);
    if (frameCount <= 0) return;

    const buffer = ctx.createBuffer(CHANNELS, frameCount, SAMPLE_RATE);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < frameCount; i++) {
      left[i] = int16[i * 2] / 32768;
      right[i] = int16[i * 2 + 1] / 32768;
    }

    this.queue.push(buffer);

    if (!this.started) {
      this.prebuffered += 1;
      if (this.prebuffered < PREBUFFER_CHUNKS) return;
      this.started = true;
      this.nextPlayTime = ctx.currentTime + 0.04;
    }

    this.flushQueue();
  }

  private flushQueue(): void {
    const ctx = this.context;
    if (!ctx || !this.started) return;

    while (this.queue.length > 0) {
      const buf = this.queue.shift()!;
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      if (this.nextPlayTime < now) {
        this.nextPlayTime = now + 0.02;
      }
      source.start(this.nextPlayTime);
      this.nextPlayTime += buf.duration;
    }
  }

  async reset(): Promise<void> {
    this.queue = [];
    this.nextPlayTime = 0;
    this.prebuffered = 0;
    this.started = false;
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }
}
