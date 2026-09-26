import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebAudioSynthesizer } from '../web-audio-adapter';
import type { AudioPort } from '../audio-port';

describe('WebAudioSynthesizer', () => {
  let synth: WebAudioSynthesizer;

  beforeEach(() => {
    localStorage.clear();
    synth = new WebAudioSynthesizer();
  });

  it('implements AudioPort interface', () => {
    const port: AudioPort = synth;
    expect(port).toBeDefined();
    expect(typeof port.playCounterPlace).toBe('function');
    expect(typeof port.playCounterRemove).toBe('function');
    expect(typeof port.playCardFlip).toBe('function');
    expect(typeof port.playCorrect).toBe('function');
    expect(typeof port.playTryAgain).toBe('function');
    expect(typeof port.playCelebrationFanfare).toBe('function');
    expect(typeof port.playButtonClick).toBe('function');
    expect(typeof port.triggerHaptic).toBe('function');
    expect(typeof port.setMuted).toBe('function');
    expect(typeof port.getMuted).toBe('function');
  });

  it('manages and persists mute state in localStorage', () => {
    expect(synth.getMuted()).toBe(false);

    synth.setMuted(true);
    expect(synth.getMuted()).toBe(true);
    expect(localStorage.getItem('kitten_math_muted')).toBe('true');

    synth.setMuted(false);
    expect(synth.getMuted()).toBe(false);
    expect(localStorage.getItem('kitten_math_muted')).toBe('false');

    // Restores from localStorage
    localStorage.setItem('kitten_math_muted', 'true');
    const newSynth = new WebAudioSynthesizer();
    expect(newSynth.getMuted()).toBe(true);
  });

  it('executes all procedural synthesis sound methods without throwing', () => {
    expect(() => synth.playCounterPlace(true)).not.toThrow();
    expect(() => synth.playCounterPlace(false)).not.toThrow();
    expect(() => synth.playCounterRemove()).not.toThrow();
    expect(() => synth.playCardFlip()).not.toThrow();
    expect(() => synth.playCorrect(1)).not.toThrow();
    expect(() => synth.playCorrect(3)).not.toThrow();
    expect(() => synth.playCorrect(5)).not.toThrow();
    expect(() => synth.playTryAgain()).not.toThrow();
    expect(() => synth.playCelebrationFanfare()).not.toThrow();
    expect(() => synth.playButtonClick()).not.toThrow();
    expect(() => synth.triggerHaptic(15)).not.toThrow();
    expect(() => synth.triggerHaptic([30, 40, 30])).not.toThrow();
  });

  it('silences audio synthesis and haptic calls when muted', () => {
    const vibrateSpy = vi.spyOn(navigator, 'vibrate');
    synth.setMuted(true);

    synth.playCounterPlace(true);
    synth.playCounterRemove();
    synth.playCardFlip();
    synth.playCorrect(5);
    synth.playTryAgain();
    synth.playCelebrationFanfare();
    synth.playButtonClick();
    synth.triggerHaptic(15);

    expect(vibrateSpy).not.toHaveBeenCalled();
    vibrateSpy.mockRestore();
  });

  it('triggers haptics when unmuted on supported platforms', () => {
    const vibrateSpy = vi.spyOn(navigator, 'vibrate');
    synth.setMuted(false);

    synth.triggerHaptic(25);
    expect(vibrateSpy).toHaveBeenCalledWith(25);

    synth.playButtonClick();
    expect(vibrateSpy).toHaveBeenCalledWith(8);

    vibrateSpy.mockRestore();
  });
});
