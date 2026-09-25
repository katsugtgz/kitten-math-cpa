import { describe, it, expect } from 'vitest';
import { gameReducer, createInitialState } from '../game-reducer';
import {
  getCorrectAnswer,
} from '../progression';
import type { GameState, GameAction, GameMode, StageLevel } from '../types';
import type { SubitizeProblem } from '../../domain/types';

/**
 * Seeded deterministic pseudo-random number generator (Mulberry32).
 * Guarantees 100% reproducible adversarial fuzzing sequences.
 */
function createPrng(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Adversarial Challenger: Game State Machine & Progression', () => {
  describe('Challenge 1: Randomized Action Sequence Fuzzing (1,000 Actions)', () => {
    it('maintains mathematical invariants across 1,000 random actions', () => {
      const prng = createPrng(421337);
      let state = createInitialState({ mode: 'pictorial' });

      const modes: GameMode[] = ['concrete', 'pictorial', 'abstract'];
      const stages: StageLevel[] = [1, 2, 3, 4];
      const colors = ['red', 'black'] as const;

      const snapshot = (s: GameState) => JSON.parse(JSON.stringify(s));
      let previousSnapshot = snapshot(state);

      for (let i = 0; i < 1000; i++) {
        const actionTypeRoll = Math.floor(prng() * 9);
        let action: GameAction;

        switch (actionTypeRoll) {
          case 0: {
            const slotIndex = Math.floor(prng() * 26) - 3; // -3 to 22
            const color = colors[Math.floor(prng() * colors.length)];
            action = { type: 'PLACE_COUNTER', slotIndex, color };
            break;
          }
          case 1: {
            const slotIndex = Math.floor(prng() * 26) - 3; // -3 to 22
            action = { type: 'REMOVE_COUNTER', slotIndex };
            break;
          }
          case 2: {
            action = { type: 'CLEAR_FRAME' };
            break;
          }
          case 3: {
            const capacity = prng() < 0.5 ? 10 : 20;
            action = { type: 'SET_CAPACITY', capacity };
            break;
          }
          case 4: {
            let answer: number;
            const isCorrectAttempt = prng() < 0.5;

            if (isCorrectAttempt) {
              const expected = getCorrectAnswer(state.activeProblem);
              if (expected !== null) {
                answer = expected;
              } else if (state.mode === 'concrete') {
                answer = state.grid.totalCount;
              } else {
                answer = Math.floor(prng() * 25);
              }
            } else {
              answer = Math.floor(prng() * 40) - 10;
            }

            const bonusRoll = prng();
            const bonus =
              bonusRoll < 0.3
                ? undefined
                : bonusRoll < 0.6
                  ? 0
                  : bonusRoll < 0.8
                    ? 25
                    : -15;

            action = { type: 'SUBMIT_ANSWER', answer, bonus };
            break;
          }
          case 5: {
            action = { type: 'NEXT_PROBLEM' };
            break;
          }
          case 6: {
            const mode = modes[Math.floor(prng() * modes.length)];
            action = { type: 'SET_MODE', mode };
            break;
          }
          case 7: {
            const stage = stages[Math.floor(prng() * stages.length)];
            action = { type: 'SET_STAGE', stage };
            break;
          }
          case 8:
          default: {
            if (prng() < 0.5) {
              action = { type: 'DISMISS_CELEBRATION' };
            } else {
              action = { type: 'RESET_GAME' };
            }
            break;
          }
        }

        const nextState = gameReducer(state, action);

        // Invariant 1: Previous state was never mutated
        expect(snapshot(state)).toEqual(previousSnapshot);

        // Invariant 2: Root state object is frozen
        expect(Object.isFrozen(nextState)).toBe(true);

        // Invariant 3: Grid bounds and cell count
        expect(nextState.grid.capacity === 10 || nextState.grid.capacity === 20).toBe(true);
        expect(nextState.grid.cells.length).toBe(nextState.grid.capacity);

        // Invariant 4: Mathematical consistency of counters
        const redInCells = nextState.grid.cells.filter((c) => c === 'red').length;
        const blackInCells = nextState.grid.cells.filter((c) => c === 'black').length;
        expect(nextState.grid.redCount).toBe(redInCells);
        expect(nextState.grid.blackCount).toBe(blackInCells);
        expect(nextState.grid.totalCount).toBe(redInCells + blackInCells);
        expect(nextState.grid.totalCount).toBeLessThanOrEqual(nextState.grid.capacity);

        // Invariant 5: Progression integrity
        expect(nextState.score).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(nextState.score)).toBe(true);
        expect(nextState.streak).toBeGreaterThanOrEqual(0);
        expect(nextState.bestStreak).toBeGreaterThanOrEqual(nextState.streak);
        expect(nextState.consecutiveErrors).toBeGreaterThanOrEqual(0);

        // Invariant 6: Boolean and milestone domains
        expect(typeof nextState.scaffoldActive).toBe('boolean');
        expect(typeof nextState.isCelebrating).toBe('boolean');
        if (nextState.celebrationMilestone !== null) {
          expect([3, 5, 10].includes(nextState.celebrationMilestone)).toBe(true);
        }

        // Invariant 7: Mode and stage valid domains
        expect(['concrete', 'pictorial', 'abstract'].includes(nextState.mode)).toBe(true);
        expect([1, 2, 3, 4].includes(nextState.stage)).toBe(true);

        state = nextState;
        previousSnapshot = snapshot(state);
      }
    });
  });

  describe('Challenge 2: Deep Immutability & Referential Integrity', () => {
    it('verifies root state is frozen but exposes that nested state.grid is NOT frozen (BUG 1)', () => {
      const state = createInitialState();

      // Root state is frozen
      expect(Object.isFrozen(state)).toBe(true);

      // Grid cells array is frozen
      expect(Object.isFrozen(state.grid.cells)).toBe(true);

      // Root state mutation throws TypeError
      expect(() => {
        // @ts-expect-error mutating frozen object
        state.score = 500;
      }).toThrow(TypeError);

      // BUG IDENTIFIED: state.grid object itself is NOT frozen!
      // This test documents the vulnerability:
      const isGridFrozen = Object.isFrozen(state.grid);
      // We expect this assertion to fail if state.grid is not frozen:
      expect(isGridFrozen).toBe(true);
    });

    it('preserves referential equality (next === prev) on all no-op actions', () => {
      const state = createInitialState();

      // 1. Placing same color in an already matching cell
      const withRed = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });
      const duplicateRed = gameReducer(withRed, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });
      expect(duplicateRed).toBe(withRed);

      // 2. Placing in out-of-bounds slot
      expect(gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: -1, color: 'red' })).toBe(state);
      expect(gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 10, color: 'red' })).toBe(state);

      // 3. Removing from already empty slot
      expect(gameReducer(state, { type: 'REMOVE_COUNTER', slotIndex: 0 })).toBe(state);

      // 4. Removing from out-of-bounds slot
      expect(gameReducer(state, { type: 'REMOVE_COUNTER', slotIndex: -5 })).toBe(state);
      expect(gameReducer(state, { type: 'REMOVE_COUNTER', slotIndex: 25 })).toBe(state);

      // 5. Clearing an already empty frame
      expect(gameReducer(state, { type: 'CLEAR_FRAME' })).toBe(state);

      // 6. Setting identical capacity
      expect(gameReducer(state, { type: 'SET_CAPACITY', capacity: 10 })).toBe(state);

      // 7. Setting identical mode without new problem
      expect(gameReducer(state, { type: 'SET_MODE', mode: 'concrete' })).toBe(state);

      // 8. Setting identical stage without new problem
      expect(gameReducer(state, { type: 'SET_STAGE', stage: 1 })).toBe(state);

      // 9. Dismissing celebration when not celebrating
      expect(gameReducer(state, { type: 'DISMISS_CELEBRATION' })).toBe(state);
    });
  });

  describe('Challenge 3: Streak Progression, Multipliers & Milestone Celebrations', () => {
    const mockProblem: SubitizeProblem = {
      id: 'sub-fix',
      targetCount: 5,
      redCount: 5,
      blackCount: 0,
      options: [3, 4, 5, 6],
      layout: 'single',
    };

    it('verifies exact mathematical score tiers and multipliers from streak 0 to 12', () => {
      let state = createInitialState({ activeProblem: mockProblem });

      const expectedProgression = [
        { streak: 1, multiplier: 1.0, pointsAwarded: 100, expectedTotal: 100, celebrate: false, milestone: null },
        { streak: 2, multiplier: 1.0, pointsAwarded: 100, expectedTotal: 200, celebrate: false, milestone: null },
        { streak: 3, multiplier: 1.2, pointsAwarded: 120, expectedTotal: 320, celebrate: true, milestone: 3 },
        { streak: 4, multiplier: 1.2, pointsAwarded: 120, expectedTotal: 440, celebrate: false, milestone: null },
        { streak: 5, multiplier: 1.5, pointsAwarded: 150, expectedTotal: 590, celebrate: true, milestone: 5 },
        { streak: 6, multiplier: 1.5, pointsAwarded: 150, expectedTotal: 740, celebrate: false, milestone: null },
        { streak: 7, multiplier: 1.5, pointsAwarded: 150, expectedTotal: 890, celebrate: false, milestone: null },
        { streak: 8, multiplier: 1.5, pointsAwarded: 150, expectedTotal: 1040, celebrate: false, milestone: null },
        { streak: 9, multiplier: 1.5, pointsAwarded: 150, expectedTotal: 1190, celebrate: false, milestone: null },
        { streak: 10, multiplier: 2.0, pointsAwarded: 200, expectedTotal: 1390, celebrate: true, milestone: 10 },
        { streak: 11, multiplier: 2.0, pointsAwarded: 200, expectedTotal: 1590, celebrate: false, milestone: null },
        { streak: 12, multiplier: 2.0, pointsAwarded: 200, expectedTotal: 1790, celebrate: false, milestone: null },
      ];

      for (const step of expectedProgression) {
        state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 5 });

        expect(state.streak).toBe(step.streak);
        expect(state.bestStreak).toBe(step.streak);
        expect(state.score).toBe(step.expectedTotal);
        expect(state.lastAnswerFeedback).toBe('correct');

        if (step.celebrate) {
          expect(state.isCelebrating).toBe(true);
          expect(state.celebrationMilestone).toBe(step.milestone);
          state = gameReducer(state, { type: 'DISMISS_CELEBRATION' });
          expect(state.isCelebrating).toBe(false);
          expect(state.celebrationMilestone).toBeNull();
        } else {
          expect(state.isCelebrating).toBe(false);
          expect(state.celebrationMilestone).toBeNull();
        }
      }
    });

    it('resets streak to 0 non-punitively on wrong answer without reducing score', () => {
      let state = createInitialState({
        activeProblem: mockProblem,
        score: 1790,
        streak: 12,
        bestStreak: 12,
      });

      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 99 });

      expect(state.score).toBe(1790); // Non-punitive: score strictly preserved
      expect(state.streak).toBe(0); // Streak reset to 0
      expect(state.bestStreak).toBe(12); // Best streak preserved
      expect(state.consecutiveErrors).toBe(1);
      expect(state.isCelebrating).toBe(false);
      expect(state.celebrationMilestone).toBeNull();
      expect(state.lastAnswerFeedback).toBe('incorrect');

      // Subsequent correct answer builds from streak 0 (multiplier 1.0)
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 5 });
      expect(state.streak).toBe(1);
      expect(state.score).toBe(1890); // +100
      expect(state.bestStreak).toBe(12);
    });

    it('clamps negative bonus points to 0 to prevent accidental score penalty', () => {
      const state = createInitialState({ activeProblem: mockProblem, score: 100 });
      const next = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 5, bonus: -50 });

      expect(next.score).toBe(200); // 100 base + 0 clamped bonus, NOT 150
    });
  });

  describe('Challenge 4: Dynamic Scaffolding Trigger & Clear Mechanics', () => {
    const mockProblem: SubitizeProblem = {
      id: 'sub-scaffold',
      targetCount: 4,
      redCount: 4,
      blackCount: 0,
      options: [2, 3, 4, 5],
      layout: 'single',
    };

    it('activates scaffoldActive on EXACTLY 2 consecutive errors and clears on 1 correct answer', () => {
      let state = createInitialState({ mode: 'pictorial', activeProblem: mockProblem });

      expect(state.consecutiveErrors).toBe(0);
      expect(state.scaffoldActive).toBe(false);

      // Error 1: consecutiveErrors = 1 -> scaffold must remain false
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 1 });
      expect(state.consecutiveErrors).toBe(1);
      expect(state.scaffoldActive).toBe(false);

      // Error 2: consecutiveErrors = 2 -> scaffold turns true!
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 2 });
      expect(state.consecutiveErrors).toBe(2);
      expect(state.scaffoldActive).toBe(true);

      // Error 3: consecutiveErrors = 3 -> scaffold remains true
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 3 });
      expect(state.consecutiveErrors).toBe(3);
      expect(state.scaffoldActive).toBe(true);

      // Correct Answer: clears errors and deactivates scaffold immediately
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 });
      expect(state.consecutiveErrors).toBe(0);
      expect(state.scaffoldActive).toBe(false);

      // Single new error must NOT immediately retrigger scaffold
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 9 });
      expect(state.consecutiveErrors).toBe(1);
      expect(state.scaffoldActive).toBe(false);

      // Second error retriggers scaffold
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 8 });
      expect(state.consecutiveErrors).toBe(2);
      expect(state.scaffoldActive).toBe(true);

      // Changing mode clears scaffold and consecutiveErrors
      state = gameReducer(state, { type: 'SET_MODE', mode: 'concrete' });
      expect(state.consecutiveErrors).toBe(0);
      expect(state.scaffoldActive).toBe(false);
    });

    it('clears scaffold and consecutive errors when changing stage or resetting', () => {
      let state = createInitialState({ activeProblem: mockProblem });
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 1 });
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 2 });
      expect(state.scaffoldActive).toBe(true);

      // SET_STAGE clears scaffold
      state = gameReducer(state, { type: 'SET_STAGE', stage: 2 });
      expect(state.scaffoldActive).toBe(false);
      expect(state.consecutiveErrors).toBe(0);

      // Trigger scaffold again
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 99 });
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 98 });
      expect(state.scaffoldActive).toBe(true);

      // RESET_GAME clears scaffold
      state = gameReducer(state, { type: 'RESET_GAME' });
      expect(state.scaffoldActive).toBe(false);
      expect(state.consecutiveErrors).toBe(0);
    });

    it('verifies that NEXT_PROBLEM currently fails to reset consecutiveErrors and scaffoldActive (BUG 2)', () => {
      let state = createInitialState({ mode: 'pictorial', activeProblem: mockProblem });

      // User fails twice on problem 1
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 1 });
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 2 });
      expect(state.consecutiveErrors).toBe(2);
      expect(state.scaffoldActive).toBe(true);

      // User skips to next problem
      const nextProblem: SubitizeProblem = {
        id: 'sub-next',
        targetCount: 3,
        redCount: 3,
        blackCount: 0,
        options: [1, 2, 3, 4],
        layout: 'single',
      };
      state = gameReducer(state, { type: 'NEXT_PROBLEM', problem: nextProblem });

      expect(state.activeProblem).toBe(nextProblem);

      // BUG IDENTIFIED: consecutiveErrors and scaffoldActive should reset for the new challenge,
      // per types.ts: "Count of consecutive mistakes on the current challenge"
      // This assertion will fail if NEXT_PROBLEM leaks errors across challenges:
      expect(state.consecutiveErrors).toBe(0);
      expect(state.scaffoldActive).toBe(false);
    });
  });

  describe('Challenge 5: Concrete Mode Exploration & Answer Evaluation', () => {
    it('evaluates answers against grid counter totalCount when activeProblem is null in concrete mode', () => {
      let state = createInitialState({ mode: 'concrete' });
      expect(state.activeProblem).toBeNull();

      // Grid has 0 counters: submitting 0 is correct
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 0 });
      expect(state.streak).toBe(1);
      expect(state.lastAnswerFeedback).toBe('correct');

      // Place 3 counters
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 1, color: 'red' });
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 2, color: 'black' });
      expect(state.grid.totalCount).toBe(3);

      // Submitting 3 is correct
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 3 });
      expect(state.streak).toBe(2);
      expect(state.lastAnswerFeedback).toBe('correct');

      // Submitting 4 is incorrect
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 });
      expect(state.streak).toBe(0);
      expect(state.lastAnswerFeedback).toBe('incorrect');
    });
  });

  describe('Challenge 6: Stage Transition Grid Truncation & Expansion', () => {
    it('truncates slots beyond index 9 when switching from Stage 3 (cap 20) to Stage 1 (cap 10)', () => {
      let state = createInitialState({ stage: 3 });
      expect(state.grid.capacity).toBe(20);

      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 4, color: 'red' });
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 14, color: 'black' });
      expect(state.grid.totalCount).toBe(2);

      state = gameReducer(state, { type: 'SET_CAPACITY', capacity: 10 });
      expect(state.grid.capacity).toBe(10);
      expect(state.grid.cells.length).toBe(10);
      expect(state.grid.cells[4]).toBe('red');
      expect(state.grid.redCount).toBe(1);
      expect(state.grid.blackCount).toBe(0);
      expect(state.grid.totalCount).toBe(1);
    });

    it('expands grid to 20 without losing existing counters', () => {
      let state = createInitialState({ stage: 1 });
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 2, color: 'black' });

      state = gameReducer(state, { type: 'SET_CAPACITY', capacity: 20 });
      expect(state.grid.capacity).toBe(20);
      expect(state.grid.cells.length).toBe(20);
      expect(state.grid.cells[2]).toBe('black');
      expect(state.grid.blackCount).toBe(1);
      expect(state.grid.totalCount).toBe(1);
    });
  });

  describe('Challenge 7: Boundary & Non-Integer Slot Index Input Sanitization', () => {
    it('exposes vulnerability where NaN slotIndex corrupts grid counters (BUG 3)', () => {
      let state = createInitialState();
      // Place a valid counter first
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });
      expect(state.grid.totalCount).toBe(1);

      // Dispatch PLACE_COUNTER with NaN slotIndex
      // In JS, NaN < 0 is false and NaN >= capacity is false, so boundary checks pass
      const corrupted = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: NaN, color: 'black' });

      // An uncorrupted reducer must reject NaN slotIndex and return identical state reference
      expect(corrupted).toBe(state);
    });
  });
});
