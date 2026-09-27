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
    // Force AudioContext creation while unmuted so node creation is spyable
    synth.playCounterPlace(true);
    const ctx = (synth as unknown as { ctx: AudioContext | null }).ctx;
    expect(ctx).toBeDefined();
    const createOscillatorSpy = vi.spyOn(ctx!, 'createOscillator');
    const createGainSpy = vi.spyOn(ctx!, 'createGain');
    const createBiquadFilterSpy = vi.spyOn(ctx!, 'createBiquadFilter');
    const createBufferSourceSpy = vi.spyOn(ctx!, 'createBufferSource');
    synth.setMuted(true);
    vibrateSpy.mockClear();

    synth.playCounterPlace(true);
    synth.playCounterRemove();
    synth.playCardFlip();
    synth.playCorrect(5);
    synth.playTryAgain();
    synth.playCelebrationFanfare();
    synth.playButtonClick();
    synth.triggerHaptic(15);

    expect(vibrateSpy).not.toHaveBeenCalled();
    // No audio graph nodes may be created while muted
    expect(createOscillatorSpy).not.toHaveBeenCalled();
    expect(createGainSpy).not.toHaveBeenCalled();
    expect(createBiquadFilterSpy).not.toHaveBeenCalled();
    expect(createBufferSourceSpy).not.toHaveBeenCalled();

    vibrateSpy.mockRestore();
    createOscillatorSpy.mockRestore();
    createGainSpy.mockRestore();
    createBiquadFilterSpy.mockRestore();
    createBufferSourceSpy.mockRestore();
  });

  it('dispose removes gesture unlock listeners from window and closes the AudioContext', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    addSpy.mockClear();
    removeSpy.mockClear();

    const fresh = new WebAudioSynthesizer();
    expect(addSpy).toHaveBeenCalledTimes(3);
    // Record the exact callback the constructor registered per event
    const registered = ['pointerdown', 'touchstart', 'keydown'].map((event) => ({
      event,
      callback: addSpy.mock.calls.find(([name]) => name === event)?.[1] as () => void,
    }));
    registered.forEach(({ callback }) => expect(callback).toBeInstanceOf(Function));

    // Force context creation, then dispose
    fresh.playCounterPlace(true);
    const ctx = (fresh as unknown as { ctx: AudioContext }).ctx;
    expect(ctx).toBeDefined();
    const closeSpy = vi.spyOn(ctx, 'close');

    fresh.dispose();
    expect(removeSpy).toHaveBeenCalledTimes(3);
    // Removed callbacks are exactly the ones the constructor added
    registered.forEach(({ event, callback }) => {
      expect(removeSpy).toHaveBeenCalledWith(event, callback);
    });
    expect(closeSpy).toHaveBeenCalledTimes(1);

    // Second dispose is a safe no-op
    fresh.dispose();
    expect(removeSpy).toHaveBeenCalledTimes(3);
    expect(closeSpy).toHaveBeenCalledTimes(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
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
