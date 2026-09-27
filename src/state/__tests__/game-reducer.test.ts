import { describe, it, expect } from 'vitest';
import { gameReducer, createInitialState } from '../game-reducer';
import type { GameState } from '../types';
import type { CellState, SubitizeProblem, NumberBondProblem } from '../../domain/types';
import { createSubitizeProblem, createNumberBondProblem } from '../../domain/types';

describe('Game Reducer State Machine (src/state/game-reducer.ts)', () => {
  describe('Initial State & Purity', () => {
    it('creates initial state with valid invariants', () => {
      const state = createInitialState();
      expect(state.mode).toBe('concrete');
      expect(state.stage).toBe(1);
      expect(state.score).toBe(0);
      expect(state.streak).toBe(0);
      expect(state.bestStreak).toBe(0);
      expect(state.grid.capacity).toBe(10);
      expect(state.grid.totalCount).toBe(0);
      expect(state.consecutiveErrors).toBe(0);
      expect(state.scaffoldActive).toBe(false);
      expect(state.isCelebrating).toBe(false);
      expect(state.celebrationMilestone).toBeNull();
      expect(state.lastAnswerFeedback).toBeNull();
      expect(Object.isFrozen(state)).toBe(true);
      expect(Object.isFrozen(state.grid)).toBe(true);
      expect(Object.isFrozen(state.grid.cells)).toBe(true);
    });

    it('returns identical state reference for unknown action', () => {
      const state = createInitialState();
      // @ts-expect-error Testing invalid action type handling
      const next = gameReducer(state, { type: 'UNKNOWN_ACTION' });
      expect(next).toBe(state);
    });

    it('infers mode from activeProblem when mode option is omitted', () => {
      const subitizeProblem: SubitizeProblem = createSubitizeProblem({
        id: 'sub-test',
        targetCount: 4,
        redCount: 4,
        blackCount: 0,
        options: [2, 3, 4, 5],
        layout: 'single',
      });
      const statePictorial = createInitialState({ activeProblem: subitizeProblem });
      expect(statePictorial.mode).toBe('pictorial');
      expect(statePictorial.activeProblem).toBe(subitizeProblem);
      expect(Object.isFrozen(statePictorial.grid)).toBe(true);

      const nbProblem: NumberBondProblem = createNumberBondProblem({
        id: 'nb-test',
        whole: 10,
        partA: 7,
        partB: 3,
        missing: 'partB',
        answer: 3,
      });
      const stateAbstract = createInitialState({ activeProblem: nbProblem });
      expect(stateAbstract.mode).toBe('abstract');
      expect(stateAbstract.activeProblem).toBe(nbProblem);
      expect(Object.isFrozen(stateAbstract.grid)).toBe(true);
    });
  });

  describe('Counter Placement & Removal', () => {
    it('places red and black counters and updates grid counts', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });

      expect(state.grid.cells[0]).toBe('red');
      expect(state.grid.redCount).toBe(1);
      expect(state.grid.blackCount).toBe(0);
      expect(state.grid.totalCount).toBe(1);

      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 1, color: 'black' });
      expect(state.grid.cells[1]).toBe('black');
      expect(state.grid.redCount).toBe(1);
      expect(state.grid.blackCount).toBe(1);
      expect(state.grid.totalCount).toBe(2);
    });

    it('replaces counter color at an existing occupied slot', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'black' });

      expect(state.grid.cells[0]).toBe('black');
      expect(state.grid.redCount).toBe(0);
      expect(state.grid.blackCount).toBe(1);
      expect(state.grid.totalCount).toBe(1);
    });

    it('returns same state reference if placing identical color in slot', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });
      const next = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });

      expect(next).toBe(state);
    });

    it('returns same state reference if slotIndex is out of bounds', () => {
      const state = createInitialState();
      expect(gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: -1, color: 'red' })).toBe(state);
      expect(gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 10, color: 'red' })).toBe(state);
    });

    it('removes counters properly', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });
      state = gameReducer(state, { type: 'REMOVE_COUNTER', slotIndex: 0 });

      expect(state.grid.cells[0]).toBe('empty');
      expect(state.grid.redCount).toBe(0);
      expect(state.grid.totalCount).toBe(0);
    });

    it('returns same state reference when removing from empty slot or out-of-bounds', () => {
      const state = createInitialState();
      expect(gameReducer(state, { type: 'REMOVE_COUNTER', slotIndex: 0 })).toBe(state);
      expect(gameReducer(state, { type: 'REMOVE_COUNTER', slotIndex: -1 })).toBe(state);
      expect(gameReducer(state, { type: 'REMOVE_COUNTER', slotIndex: 15 })).toBe(state);
    });

    it('clears frame and resets all counts', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 1, color: 'black' });
      state = gameReducer(state, { type: 'CLEAR_FRAME' });

      expect(state.grid.totalCount).toBe(0);
      expect(state.grid.redCount).toBe(0);
      expect(state.grid.blackCount).toBe(0);
      expect(state.grid.cells.every((c: CellState) => c === 'empty')).toBe(true);

      // Clearing an already empty frame returns same reference
      expect(gameReducer(state, { type: 'CLEAR_FRAME' })).toBe(state);
    });
  });

  describe('Capacity Transitions', () => {
    it('expands grid capacity from 10 to 20 while preserving existing counters', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 2, color: 'red' });
      state = gameReducer(state, { type: 'SET_CAPACITY', capacity: 20 });

      expect(state.grid.capacity).toBe(20);
      expect(state.grid.cells.length).toBe(20);
      expect(state.grid.cells[2]).toBe('red');
      expect(state.grid.redCount).toBe(1);
    });

    it('truncates grid capacity from 20 to 10 when switching down', () => {
      let state = createInitialState({ stage: 3 }); // starts with 20
      expect(state.grid.capacity).toBe(20);
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 15, color: 'black' });
      state = gameReducer(state, { type: 'SET_CAPACITY', capacity: 10 });

      expect(state.grid.capacity).toBe(10);
      expect(state.grid.cells.length).toBe(10);
      // Index 15 was truncated
      expect(state.grid.blackCount).toBe(0);
      expect(state.grid.totalCount).toBe(0);
    });

    it('returns same state reference if capacity is unchanged', () => {
      const state = createInitialState();
      expect(gameReducer(state, { type: 'SET_CAPACITY', capacity: 10 })).toBe(state);
    });
  });

  describe('Answer Submission & Progression Scoring', () => {
    const mockProblem: SubitizeProblem = createSubitizeProblem({
      id: 'test-1',
      targetCount: 6,
      redCount: 5,
      blackCount: 1,
      options: [4, 5, 6, 7],
      layout: 'single',
    });

    it('increments score, streak, bestStreak on correct answer', () => {
      const initial = createInitialState({ activeProblem: mockProblem });
      const next = gameReducer(initial, { type: 'SUBMIT_ANSWER', answer: 6 });

      expect(next.score).toBe(100);
      expect(next.streak).toBe(1);
      expect(next.bestStreak).toBe(1);
      expect(next.consecutiveErrors).toBe(0);
      expect(next.scaffoldActive).toBe(false);
      expect(next.lastAnswerFeedback).toBe('correct');
    });

    it('applies streak multipliers as streak advances', () => {
      let state = createInitialState({ activeProblem: mockProblem });

      // Correct 1: streak 0 -> 1 (+100)
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 6 });
      expect(state.score).toBe(100);

      // Correct 2: streak 1 -> 2 (+100)
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 6 });
      expect(state.score).toBe(200);

      // Correct 3: streak 2 -> 3 (+120, multiplier 1.2) + milestone 3 celebration
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 6 });
      expect(state.score).toBe(320);
      expect(state.streak).toBe(3);
      expect(state.isCelebrating).toBe(true);
      expect(state.celebrationMilestone).toBe(3);

      // Dismiss celebration
      state = gameReducer(state, { type: 'DISMISS_CELEBRATION' });
      expect(state.isCelebrating).toBe(false);
      expect(state.celebrationMilestone).toBeNull();

      // Correct 4: streak 3 -> 4 (+120, multiplier 1.2)
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 6 });
      expect(state.score).toBe(440);
      expect(state.isCelebrating).toBe(false);

      // Correct 5: streak 4 -> 5 (+150, multiplier 1.5) + milestone 5 celebration
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 6 });
      expect(state.score).toBe(590);
      expect(state.streak).toBe(5);
      expect(state.isCelebrating).toBe(true);
      expect(state.celebrationMilestone).toBe(5);
    });

    it('resets streak on incorrect answer non-punitively', () => {
      let state = createInitialState({ activeProblem: mockProblem, score: 320, streak: 3, bestStreak: 3 });
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 99 });

      expect(state.score).toBe(320); // Score intact!
      expect(state.streak).toBe(0); // Streak reset!
      expect(state.bestStreak).toBe(3); // Best streak preserved!
      expect(state.consecutiveErrors).toBe(1);
      expect(state.scaffoldActive).toBe(false);
      expect(state.lastAnswerFeedback).toBe('incorrect');
    });

    it('triggers scaffoldActive after 2 consecutive errors', () => {
      let state = createInitialState({ activeProblem: mockProblem });
      expect(state.scaffoldActive).toBe(false);

      // Error 1
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 1 });
      expect(state.consecutiveErrors).toBe(1);
      expect(state.scaffoldActive).toBe(false);

      // Error 2 -> scaffold triggers!
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 2 });
      expect(state.consecutiveErrors).toBe(2);
      expect(state.scaffoldActive).toBe(true);

      // Correct answer resolves errors and scaffold
      state = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 6 });
      expect(state.consecutiveErrors).toBe(0);
      expect(state.scaffoldActive).toBe(false);
    });
  });

  describe('Mode and Stage Transitions', () => {
    const nbProblem: NumberBondProblem = createNumberBondProblem({
      id: 'nb-test',
      whole: 5,
      partA: 3,
      partB: 2,
      missing: 'whole',
      answer: 5,
    });

    it('switches mode and updates active problem', () => {
      let state = createInitialState({ mode: 'concrete' });
      state = gameReducer(state, { type: 'SET_MODE', mode: 'abstract', problem: nbProblem });

      expect(state.mode).toBe('abstract');
      expect(state.activeProblem).toBe(nbProblem);
      expect(state.consecutiveErrors).toBe(0);
      expect(state.scaffoldActive).toBe(false);

      // Same mode without problem returns identical state when clean
      expect(gameReducer(state, { type: 'SET_MODE', mode: 'abstract' })).toBe(state);

      // If errors were accumulated, SET_MODE resets them even for the same mode
      const withErrors: GameState = {
        ...state,
        consecutiveErrors: 2,
        scaffoldActive: true,
      };
      const resetErrors = gameReducer(withErrors, { type: 'SET_MODE', mode: 'abstract' });
      expect(resetErrors.consecutiveErrors).toBe(0);
      expect(resetErrors.scaffoldActive).toBe(false);
    });

    it('switches stage, updates grid capacity and resets streak', () => {
      let state = createInitialState({ stage: 1, streak: 4, bestStreak: 4 });
      state = gameReducer(state, { type: 'SET_STAGE', stage: 3 });

      expect(state.stage).toBe(3);
      expect(state.grid.capacity).toBe(20);
      expect(state.streak).toBe(0);
      expect(state.bestStreak).toBe(4);

      // Same stage without problem returns identical state
      expect(gameReducer(state, { type: 'SET_STAGE', stage: 3 })).toBe(state);
    });

    it('updates problem on NEXT_PROBLEM, clears feedback, and resets errors/scaffold', () => {
      let state: GameState = {
        ...createInitialState(),
        consecutiveErrors: 2,
        scaffoldActive: true,
      };
      state = gameReducer(state, { type: 'NEXT_PROBLEM', problem: nbProblem });

      expect(state.activeProblem).toBe(nbProblem);
      expect(state.consecutiveErrors).toBe(0);
      expect(state.scaffoldActive).toBe(false);
      expect(state.lastAnswerFeedback).toBeNull();
      expect(state.isCelebrating).toBe(false);
    });
  });

  describe('Celebration Dismissal', () => {
    it('dismisses celebration properly', () => {
      const state: GameState = {
        ...createInitialState(),
        isCelebrating: true,
        celebrationMilestone: 3,
      };

      const dismissed = gameReducer(state, { type: 'DISMISS_CELEBRATION' });
      expect(dismissed.isCelebrating).toBe(false);
      expect(dismissed.celebrationMilestone).toBeNull();

      // Dismissing when already dismissed returns same reference
      expect(gameReducer(dismissed, { type: 'DISMISS_CELEBRATION' })).toBe(dismissed);
    });
  });
});
