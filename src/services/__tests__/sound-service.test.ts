import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SoundSynthesizer } from '../sound-service';

describe('SoundSynthesizer', () => {
  let soundService: SoundSynthesizer;

  beforeEach(() => {
    localStorage.clear();
    soundService = new SoundSynthesizer();
  });

  it('initializes unmuted by default', () => {
    expect(soundService.getMuted()).toBe(false);
  });

  it('updates and persists muted state to localStorage', () => {
    soundService.setMuted(true);
    expect(soundService.getMuted()).toBe(true);
    expect(localStorage.getItem('kitten_math_muted')).toBe('true');

    // Create a new instance to test restoration
    const restoredService = new SoundSynthesizer();
    expect(restoredService.getMuted()).toBe(true);

    soundService.setMuted(false);
    expect(soundService.getMuted()).toBe(false);
    expect(localStorage.getItem('kitten_math_muted')).toBe('false');
  });

  it('plays counter place sound for red and black counters without error', () => {
    expect(() => soundService.playCounterPlace(true)).not.toThrow();
    expect(() => soundService.playCounterPlace(false)).not.toThrow();
  });

  it('plays counter remove pop sound without error', () => {
    expect(() => soundService.playCounterRemove()).not.toThrow();
  });

  it('plays card flip whoosh sound without error', () => {
    expect(() => soundService.playCardFlip()).not.toThrow();
  });

  it('plays correct chime for streak < 3 and streak >= 3', () => {
    expect(() => soundService.playCorrect(1)).not.toThrow();
    expect(() => soundService.playCorrect(2)).not.toThrow();
    expect(() => soundService.playCorrect(3)).not.toThrow();
    expect(() => soundService.playCorrect(5)).not.toThrow();
  });

  it('plays try again boop without error', () => {
    expect(() => soundService.playTryAgain()).not.toThrow();
  });

  it('plays celebration fanfare without error', () => {
    expect(() => soundService.playCelebrationFanfare()).not.toThrow();
  });

  it('plays button click without error', () => {
    expect(() => soundService.playButtonClick()).not.toThrow();
  });

  it('does not trigger audio nodes when muted', () => {
    soundService.setMuted(true);

    const createOscSpy = vi.spyOn(AudioContext.prototype, 'createOscillator');
    soundService.playCounterPlace(true);
    soundService.playCounterRemove();
    soundService.playCorrect();
    soundService.playCelebrationFanfare();

    expect(createOscSpy).not.toHaveBeenCalled();
  });
});
