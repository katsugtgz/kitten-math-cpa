import { describe, it, expect, beforeEach } from 'vitest';
import { SilentAudioAdapter } from '../silent-audio-adapter';
import type { AudioPort } from '../audio-port';

describe('SilentAudioAdapter', () => {
  let adapter: SilentAudioAdapter;

  beforeEach(() => {
    adapter = new SilentAudioAdapter();
  });

  it('implements AudioPort interface', () => {
    const port: AudioPort = adapter;
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

  it('manages mute state accurately', () => {
    expect(adapter.getMuted()).toBe(false);

    adapter.setMuted(true);
    expect(adapter.getMuted()).toBe(true);

    adapter.setMuted(false);
    expect(adapter.getMuted()).toBe(false);

    const mutedAdapter = new SilentAudioAdapter(true);
    expect(mutedAdapter.getMuted()).toBe(true);
  });

  it('records playCounterPlace invocations and color parameters', () => {
    adapter.playCounterPlace(true);
    adapter.playCounterPlace(false);
    adapter.playCounterPlace();

    expect(adapter.calls.playCounterPlace).toEqual([true, false, true]);
  });

  it('records playCounterRemove invocations', () => {
    adapter.playCounterRemove();
    adapter.playCounterRemove();
    expect(adapter.calls.playCounterRemove).toBe(2);
  });

  it('records playCardFlip invocations', () => {
    adapter.playCardFlip();
    adapter.playCardFlip();
    adapter.playCardFlip();
    expect(adapter.calls.playCardFlip).toBe(3);
  });

  it('records playCorrect invocations with streak parameters', () => {
    adapter.playCorrect(1);
    adapter.playCorrect(5);
    adapter.playCorrect();

    expect(adapter.calls.playCorrect).toEqual([1, 5, 1]);
  });

  it('records playTryAgain invocations', () => {
    adapter.playTryAgain();
    adapter.playTryAgain();
    expect(adapter.calls.playTryAgain).toBe(2);
  });

  it('records playCelebrationFanfare invocations', () => {
    adapter.playCelebrationFanfare();
    expect(adapter.calls.playCelebrationFanfare).toBe(1);
  });

  it('records playButtonClick invocations', () => {
    adapter.playButtonClick();
    adapter.playButtonClick();
    expect(adapter.calls.playButtonClick).toBe(2);
  });

  it('records triggerHaptic invocations with pattern arguments', () => {
    adapter.triggerHaptic(15);
    adapter.triggerHaptic([30, 40, 30]);
    adapter.triggerHaptic();

    expect(adapter.calls.triggerHaptic).toEqual([15, [30, 40, 30], 15]);
  });

  it('clears all recorded telemetry on reset while preserving mute state', () => {
    adapter.setMuted(true);
    adapter.playCounterPlace(true);
    adapter.playCounterRemove();
    adapter.playCardFlip();
    adapter.playCorrect(3);
    adapter.playTryAgain();
    adapter.playCelebrationFanfare();
    adapter.playButtonClick();
    adapter.triggerHaptic(20);

    expect(adapter.calls.playCorrect.length).toBe(1);

    adapter.reset();

    expect(adapter.getMuted()).toBe(true);
    expect(adapter.calls.playCounterPlace).toEqual([]);
    expect(adapter.calls.playCounterRemove).toBe(0);
    expect(adapter.calls.playCardFlip).toBe(0);
    expect(adapter.calls.playCorrect).toEqual([]);
    expect(adapter.calls.playTryAgain).toBe(0);
    expect(adapter.calls.playCelebrationFanfare).toBe(0);
    expect(adapter.calls.playButtonClick).toBe(0);
    expect(adapter.calls.triggerHaptic).toEqual([]);
  });
});
