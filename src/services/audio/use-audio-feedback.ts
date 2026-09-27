import { useEffect, useRef } from 'react';
import type { GameState } from '../../state/types';
import type { AudioPort } from './audio-port';

export interface UseAudioFeedbackOptions {
  /**
   * Whether to reactively observe concrete counter grid changes.
   * App wires the default (true): placements, removals, drag-moves, and
   * recolor drops all chime from this hook; views stay audio-free.
   * Set to false to silence only the counter cues (tests, focused sessions).
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

    // 3. Card flip sound on problem progression (id change or first problem)
    if (
      state.activeProblem &&
      (prev.activeProblem === null ||
        state.activeProblem.id !== prev.activeProblem.id)
    ) {
      audio.playCardFlip();
    }

    // 4. Concrete counter placement, removal, drag-move, and recolor
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
      } else if (state.grid.cells !== prev.grid.cells) {
        // Same total: a drag-move or a recolor drop onto an occupied slot.
        // Chime with the color of the first slot that changed to non-empty.
        const nextCells = state.grid.cells;
        const prevCells = prev.grid.cells;
        const changedIndex = nextCells.findIndex(
          (cell, i) => cell !== 'empty' && cell !== prevCells[i]
        );
        if (changedIndex !== -1) {
          audio.playCounterPlace(nextCells[changedIndex] === 'red');
        }
      }
    }
  }, [state, audio, observeCounters]);
}
