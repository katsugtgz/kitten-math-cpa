import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAudioFeedback } from '../use-audio-feedback';
import { SilentAudioAdapter } from '../silent-audio-adapter';
import { createInitialState } from '../../../state/game-reducer';
import type { GameState } from '../../../state/types';
import { generateSubitizeProblem } from '../../../domain/subitize';
import { placeCounter, removeCounter } from '../../../domain/ten-frame';

describe('useAudioFeedback', () => {
  let audio: SilentAudioAdapter;
  let baseState: GameState;

  beforeEach(() => {
    audio = new SilentAudioAdapter();
    baseState = createInitialState({ mode: 'pictorial', stage: 1 });
  });

  it('does not trigger any audio cues on initial mount', () => {
    renderHook(() => useAudioFeedback(baseState, audio));

    expect(audio.calls.playCorrect).toEqual([]);
    expect(audio.calls.playTryAgain).toBe(0);
    expect(audio.calls.playCelebrationFanfare).toBe(0);
    expect(audio.calls.playCardFlip).toBe(0);
    expect(audio.calls.playCounterPlace).toEqual([]);
    expect(audio.calls.playCounterRemove).toBe(0);
  });

  it('triggers playCorrect with streak when lastAnswerFeedback transitions to correct', () => {
    const { rerender } = renderHook(
      ({ state }) => useAudioFeedback(state, audio),
      { initialProps: { state: baseState } }
    );

    const nextState: GameState = {
      ...baseState,
      lastAnswerFeedback: 'correct',
      streak: 3,
    };

    rerender({ state: nextState });

    expect(audio.calls.playCorrect).toEqual([3]);
    expect(audio.calls.playTryAgain).toBe(0);
  });

  it('triggers playTryAgain when lastAnswerFeedback transitions to incorrect', () => {
    const { rerender } = renderHook(
      ({ state }) => useAudioFeedback(state, audio),
      { initialProps: { state: baseState } }
    );

    const nextState: GameState = {
      ...baseState,
      lastAnswerFeedback: 'incorrect',
      consecutiveErrors: 1,
    };

    rerender({ state: nextState });

    expect(audio.calls.playTryAgain).toBe(1);
    expect(audio.calls.playCorrect).toEqual([]);
  });

  it('triggers playTryAgain on consecutive incorrect submissions when consecutiveErrors increases', () => {
    const firstIncorrectState: GameState = {
      ...baseState,
      lastAnswerFeedback: 'incorrect',
      consecutiveErrors: 1,
    };

    const { rerender } = renderHook(
      ({ state }) => useAudioFeedback(state, audio),
      { initialProps: { state: firstIncorrectState } }
    );

    const secondIncorrectState: GameState = {
      ...firstIncorrectState,
      consecutiveErrors: 2,
    };

    rerender({ state: secondIncorrectState });

    expect(audio.calls.playTryAgain).toBe(1);
  });

  it('triggers playCelebrationFanfare when isCelebrating transitions from false to true', () => {
    const { rerender } = renderHook(
      ({ state }) => useAudioFeedback(state, audio),
      { initialProps: { state: baseState } }
    );

    const celebratingState: GameState = {
      ...baseState,
      isCelebrating: true,
      celebrationMilestone: 3,
    };

    rerender({ state: celebratingState });

    expect(audio.calls.playCelebrationFanfare).toBe(1);
  });

  it('triggers playCardFlip when activeProblem id changes', () => {
    const prob1 = generateSubitizeProblem(5, { layout: 'single' });
    const prob2 = generateSubitizeProblem(7, { layout: 'single' });

    const state1: GameState = {
      ...baseState,
      activeProblem: prob1,
    };

    const { rerender } = renderHook(
      ({ state }) => useAudioFeedback(state, audio),
      { initialProps: { state: state1 } }
    );

    const state2: GameState = {
      ...state1,
      activeProblem: prob2,
    };

    rerender({ state: state2 });

    expect(audio.calls.playCardFlip).toBe(1);
  });

  it('reacts to counter placements and removals in concrete mode when observeCounters is true', () => {
    const concreteBase: GameState = {
      ...baseState,
      mode: 'concrete',
    };

    const { rerender } = renderHook(
      ({ state }) => useAudioFeedback(state, audio, { observeCounters: true }),
      { initialProps: { state: concreteBase } }
    );

    // Place red counter
    const gridWithRed = placeCounter(concreteBase.grid, 'red');
    const stateWithRed: GameState = {
      ...concreteBase,
      grid: gridWithRed,
    };
    rerender({ state: stateWithRed });
    expect(audio.calls.playCounterPlace).toEqual([true]);

    // Place black counter
    const gridWithBlack = placeCounter(gridWithRed, 'black');
    const stateWithBlack: GameState = {
      ...stateWithRed,
      grid: gridWithBlack,
    };
    rerender({ state: stateWithBlack });
    expect(audio.calls.playCounterPlace).toEqual([true, false]);

    // Remove counter
    const gridRemoved = removeCounter(gridWithBlack, 0);
    const stateRemoved: GameState = {
      ...stateWithBlack,
      grid: gridRemoved,
    };
    rerender({ state: stateRemoved });
    expect(audio.calls.playCounterRemove).toBe(1);
  });

  it('ignores counter grid changes when observeCounters is false', () => {
    const concreteBase: GameState = {
      ...baseState,
      mode: 'concrete',
    };

    const { rerender } = renderHook(
      ({ state }) => useAudioFeedback(state, audio, { observeCounters: false }),
      { initialProps: { state: concreteBase } }
    );

    const gridWithRed = placeCounter(concreteBase.grid, 'red');
    const stateWithRed: GameState = {
      ...concreteBase,
      grid: gridWithRed,
    };
    rerender({ state: stateWithRed });

    expect(audio.calls.playCounterPlace).toEqual([]);
    expect(audio.calls.playCounterRemove).toBe(0);
  });
});
