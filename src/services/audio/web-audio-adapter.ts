import type { AudioPort } from './audio-port';

const STORAGE_KEY = 'kitten_math_muted';

/**
 * Production Web Audio API Synthesizer implementing AudioPort.
 * Procedurally generates tactile clicks, melodic chimes, and fanfare chords.
 */
export class WebAudioSynthesizer implements AudioPort {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private gestureUnlock: (() => void) | null = null;

  constructor() {
    this.isMuted = this.loadMutedState();
    this.attachGestureUnlock();
  }

  /**
   * Mobile browsers (iOS Safari) only allow AudioContext creation/resume inside
   * a user gesture. Effect-driven playback (state transitions after commit)
   * runs outside gestures, so the first unlock is attached to the earliest
   * pointerdown/touchstart/keydown. Safe no-op in non-browser environments.
   */
  private attachGestureUnlock(): void {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return;
    }

    this.gestureUnlock = (): void => {
      this.initAudioContext();
      this.detachGestureUnlock();
    };

    window.addEventListener('pointerdown', this.gestureUnlock, { passive: true });
    window.addEventListener('touchstart', this.gestureUnlock, { passive: true });
    window.addEventListener('keydown', this.gestureUnlock, { passive: true });
  }

  private detachGestureUnlock(): void {
    if (!this.gestureUnlock || typeof window === 'undefined') {
      return;
    }
    window.removeEventListener('pointerdown', this.gestureUnlock);
    window.removeEventListener('touchstart', this.gestureUnlock);
    window.removeEventListener('keydown', this.gestureUnlock);
    this.gestureUnlock = null;
  }

  /**
   * Releases window-level resources (gesture unlock listeners) and closes the
   * AudioContext. Safe to call multiple times; initAudioContext recreates the
   * context on the next play* call. Short-lived instances in tests and
   * HMR-reinstantiated singletons must not accumulate handlers or contexts.
   */
  public dispose(): void {
    this.detachGestureUnlock();
    if (this.ctx) {
      const ctx = this.ctx;
      this.ctx = null;
      this.masterGain = null;
      try {
        const maybePromise = ctx.close() as unknown as Promise<void> | undefined;
        if (maybePromise && typeof maybePromise.catch === 'function') {
          maybePromise.catch(() => {
            // Context already closed or unsupported: nothing to reclaim.
          });
        }
      } catch {
        // Legacy synchronous close failure: nothing to reclaim.
      }
    }
  }

  private loadMutedState(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(STORAGE_KEY) === 'true';
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    return false;
  }

  private saveMutedState(muted: boolean): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, String(muted));
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  public triggerHaptic(pattern: number | number[] = 15): void {
    if (this.isMuted) return;
    try {
      if (
        typeof navigator !== 'undefined' &&
        'vibrate' in navigator &&
        typeof navigator.vibrate === 'function'
      ) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore unsupported or vibration permission errors in restricted contexts
    }
  }

  private initAudioContext(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.resumeContext();
      }
      return this.ctx;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    try {
      this.ctx = new AudioContextClass();
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
      master.connect(this.ctx.destination);
      this.masterGain = master;

      if (this.ctx.state === 'suspended') {
        this.resumeContext();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Mobile browsers reject resume() outside a user gesture; surface the
   * rejection instead of dropping it so gesture unlock can retry later.
   */
  private resumeContext(): void {
    if (!this.ctx) return;
    try {
      const maybePromise = this.ctx.resume() as unknown as Promise<void> | undefined;
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => {
          // Expected when called outside a user gesture; the gesture unlock
          // listener will retry resume on the next pointerdown/touchstart.
        });
      }
    } catch {
      // Legacy synchronous throw: ignore, retry happens on next gesture.
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.saveMutedState(muted);

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private createNoiseBuffer(ctx: AudioContext, durationSeconds: number): AudioBuffer {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durationSeconds));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public playCounterPlace(isRed: boolean = true): void {
    this.triggerHaptic(15);
    if (this.isMuted) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    // 1. Transient click noise
    try {
      const noiseBuffer = this.createNoiseBuffer(ctx, 0.015);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.value = 2.5;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noiseSource.start(now);
      noiseSource.stop(now + 0.02);
    } catch {
      // Audio node fallback
    }

    // 2. Resonant body clack
    try {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      const baseFreq = isRed ? 720 : 580;
      const detune = (Math.random() - 0.5) * 20;
      const startFreq = baseFreq + detune;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      oscGain.gain.setValueAtTime(0.45, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio node fallback
    }
  }

  public playCounterRemove(): void {
    this.triggerHaptic(10);
    if (this.isMuted) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(780, now + 0.025);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Audio node fallback
    }
  }

  public playCardFlip(): void {
    this.triggerHaptic(15);
    if (this.isMuted) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    try {
      const duration = 0.12;
      const noiseBuffer = this.createNoiseBuffer(ctx, duration);
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.linearRampToValueAtTime(3200, now + 0.06);
      filter.frequency.linearRampToValueAtTime(1200, now + duration);
      filter.Q.value = 2.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      source.start(now);
      source.stop(now + duration + 0.01);
    } catch {
      // Audio node fallback
    }
  }

  public playCorrect(streak: number = 1): void {
    this.triggerHaptic([30, 40, 30]);
    if (this.isMuted) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.masterGain) return;

    const notes =
      streak >= 3
        ? [659.25, 783.99, 1046.5, 1318.51] // E5, G5, C6, E6
        : [523.25, 659.25, 783.99]; // C5, E5, G5

    const baseTime = ctx.currentTime;
    const stepDuration = 0.065;
    const noteDuration = 0.35;

    notes.forEach((freq, index) => {
      const noteTime = baseTime + index * stepDuration;

      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, noteTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 1.003, noteTime);

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + noteDuration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain!);

        osc1.start(noteTime);
        osc2.start(noteTime);
        osc1.stop(noteTime + noteDuration);
        osc2.stop(noteTime + noteDuration);
      } catch {
        // Audio node fallback
      }
    });
  }

  public playTryAgain(): void {
    this.triggerHaptic([40, 60, 40]);
    if (this.isMuted) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.linearRampToValueAtTime(260, now + 0.16);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // Audio node fallback
    }
  }

  public playCelebrationFanfare(): void {
    this.triggerHaptic([50, 50, 50, 50, 100]);
    if (this.isMuted) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    const motif = [
      { freq: 392.0, time: now, dur: 0.11 },
      { freq: 523.25, time: now + 0.12, dur: 0.11 },
      { freq: 659.25, time: now + 0.24, dur: 0.14 },
    ];

    motif.forEach(({ freq, time, dur }) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(time);
        osc.stop(time + dur + 0.01);
      } catch {
        // Audio node fallback
      }
    });

    const chordTime = now + 0.4;
    const chordDur = 1.1;
    const chordFreqs = [783.99, 1046.5, 1318.51];

    chordFreqs.forEach((freq) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, chordTime);

        gain.gain.setValueAtTime(0.25, chordTime);
        gain.gain.linearRampToValueAtTime(0.22, chordTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, chordTime + chordDur);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(chordTime);
        osc.stop(chordTime + chordDur + 0.02);
      } catch {
        // Audio node fallback
      }
    });
  }

  public playButtonClick(): void {
    this.triggerHaptic(8);
    if (this.isMuted) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.018);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.022);
    } catch {
      // Audio node fallback
    }
  }
}
