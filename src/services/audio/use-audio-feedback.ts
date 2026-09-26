import { useEffect, useRef } from 'react';
import type { GameState } from '../../state/types';
import type { AudioPort } from './audio-port';

export interface UseAudioFeedbackOptions {
  /**
   * Whether to reactively observe concrete counter grid placements and removals.
   * In Milestone 3, set to false in App to prevent duplicate sounds while ConcreteModeView
   * retains its internal sound triggers until Milestone 4.
   * Default: true.
   */
  readonly observeCounters?: boolean;
}

/**
 * Event-Driven Reactive Audio Listener Hook.
 * Observes GameState transitions and executes audio/haptic responses via AudioPort.
 */
export function useAudioFeedback(
  state: GameState,
  audio: AudioPort,
  options: UseAudioFeedbackOptions = {}
): void {
  const { observeCounters = true } = options;
  const prevStateRef = useRef<GameState>(state);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;

    if (prev === state) return;

    // 1. Answer feedback transitions
    const isNewCorrect =
      state.lastAnswerFeedback === 'correct' && prev.lastAnswerFeedback !== 'correct';

    const isNewIncorrect =
      (state.lastAnswerFeedback === 'incorrect' && prev.lastAnswerFeedback !== 'incorrect') ||
      (state.lastAnswerFeedback === 'incorrect' && state.consecutiveErrors > prev.consecutiveErrors);

    if (isNewCorrect) {
      audio.playCorrect(state.streak);
    } else if (isNewIncorrect) {
      audio.playTryAgain();
    }

    // 2. Victory celebration fanfare on streak milestones (3, 5, 10)
    if (state.isCelebrating && !prev.isCelebrating) {
      audio.playCelebrationFanfare();
    }

    // 3. Card flip sound on problem progression (id change)
    if (
      state.activeProblem &&
      prev.activeProblem &&
      state.activeProblem.id !== prev.activeProblem.id
    ) {
      audio.playCardFlip();
    }

    // 4. Concrete counter placement and removal
    if (
      observeCounters &&
      state.mode === 'concrete' &&
      prev.mode === 'concrete' &&
      state.stage === prev.stage
    ) {
      if (state.grid.totalCount > prev.grid.totalCount) {
        const isRed = state.grid.redCount > prev.grid.redCount;
        audio.playCounterPlace(isRed);
      } else if (state.grid.totalCount < prev.grid.totalCount) {
        audio.playCounterRemove();
      }
    }
  }, [state, audio, observeCounters]);
}
