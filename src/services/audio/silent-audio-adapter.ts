import type { AudioPort } from './audio-port';

export interface SilentAudioCallRecord {
  playCounterPlace: boolean[];
  playCounterRemove: number;
  playCardFlip: number;
  playCorrect: (number | undefined)[];
  playTryAgain: number;
  playCelebrationFanfare: number;
  playButtonClick: number;
  triggerHaptic: (number | number[] | undefined)[];
}

/**
 * Headless, silent AudioPort adapter for unit testing and SSR environments.
 * Implements AudioPort without Web Audio API or browser dependencies.
 * Records call invocations for deterministic test inspection and assertions.
 */
export class SilentAudioAdapter implements AudioPort {
  private isMuted: boolean;

  public readonly calls: SilentAudioCallRecord = {
    playCounterPlace: [],
    playCounterRemove: 0,
    playCardFlip: 0,
    playCorrect: [],
    playTryAgain: 0,
    playCelebrationFanfare: 0,
    playButtonClick: 0,
    triggerHaptic: [],
  };

  constructor(initialMuted: boolean = false) {
    this.isMuted = initialMuted;
  }

  public playCounterPlace(isRed: boolean = true): void {
    this.calls.playCounterPlace.push(isRed);
  }

  public playCounterRemove(): void {
    this.calls.playCounterRemove++;
  }

  public playCardFlip(): void {
    this.calls.playCardFlip++;
  }

  public playCorrect(streak: number = 1): void {
    this.calls.playCorrect.push(streak);
  }

  public playTryAgain(): void {
    this.calls.playTryAgain++;
  }

  public playCelebrationFanfare(): void {
    this.calls.playCelebrationFanfare++;
  }

  public playButtonClick(): void {
    this.calls.playButtonClick++;
  }

  public triggerHaptic(pattern: number | number[] = 15): void {
    this.calls.triggerHaptic.push(pattern);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public reset(): void {
    this.calls.playCounterPlace = [];
    this.calls.playCounterRemove = 0;
    this.calls.playCardFlip = 0;
    this.calls.playCorrect = [];
    this.calls.playTryAgain = 0;
    this.calls.playCelebrationFanfare = 0;
    this.calls.playButtonClick = 0;
    this.calls.triggerHaptic = [];
  }
}
