import { describe, it, expect } from 'vitest';
import {
  calculateMultiplier,
  calculateScore,
  checkCelebrationTrigger,
  shouldTriggerScaffold,
  getStageCapacity,
  getCorrectAnswer,
  evaluateAnswer,
  asDomainProblem,
  PROGRESSION_CONFIG,
  BASE_SCORE,
  CELEBRATION_MILESTONES,
  SCAFFOLD_ERROR_THRESHOLD,
  STAGE_CAPACITIES,
} from '../progression';
import * as gameReducerEngine from '../game-reducer';
import type { ActiveProblem, StageLevel, GameAction } from '../types';
import {
  generateSubitizeProblem,
  generateConceptualProblem,
} from '../../domain/subitize';
import { generateNumberBond } from '../../domain/number-bond';
import { generateBridgingTenAddition } from '../../domain/equation';

describe('Milestone 2 Empirical Adversarial Challenge: Progression Facade & Authoritative Engine', () => {
  describe('Export Integrity & Facade Equivalence', () => {
    it('re-exports all progression configuration constants matching game-reducer', () => {
      expect(PROGRESSION_CONFIG).toBe(gameReducerEngine.PROGRESSION_CONFIG);
      expect(BASE_SCORE).toBe(gameReducerEngine.BASE_SCORE);
      expect(CELEBRATION_MILESTONES).toBe(gameReducerEngine.CELEBRATION_MILESTONES);
      expect(SCAFFOLD_ERROR_THRESHOLD).toBe(gameReducerEngine.SCAFFOLD_ERROR_THRESHOLD);
      expect(STAGE_CAPACITIES).toBe(gameReducerEngine.STAGE_CAPACITIES);
      expect(asDomainProblem).toBe(gameReducerEngine.asDomainProblem);
    });

    it('guarantees facade functions delegate identically to engine functions across 500 boundary inputs', () => {
      for (let s = -50; s <= 200; s++) {
        expect(calculateMultiplier(s)).toBe(gameReducerEngine.calculateMultiplier(s));
        expect(calculateScore(100, s, 10)).toEqual(gameReducerEngine.calculateScore(100, s, 10));
        expect(calculateScore(undefined, s, undefined)).toEqual(
          gameReducerEngine.calculateScore(undefined, s, undefined)
        );
        expect(checkCelebrationTrigger(s)).toEqual(gameReducerEngine.checkCelebrationTrigger(s));
        expect(shouldTriggerScaffold(s)).toBe(gameReducerEngine.shouldTriggerScaffold(s));
      }

      for (let stage = -5; stage <= 10; stage++) {
        expect(getStageCapacity(stage as StageLevel)).toBe(
          gameReducerEngine.getStageCapacity(stage as StageLevel)
        );
      }
    });
  });

  describe('1. calculateMultiplier boundary & stress tests', () => {
    it('handles negative streak values gracefully (streak < 3 tier)', () => {
      expect(calculateMultiplier(-1)).toBe(1.0);
      expect(calculateMultiplier(-100)).toBe(1.0);
      expect(calculateMultiplier(-Infinity)).toBe(1.0);
    });

    it('strictly satisfies tier boundary transitions', () => {
      // Tier 1: streak < 3 -> 1.0
      expect(calculateMultiplier(0)).toBe(1.0);
      expect(calculateMultiplier(1)).toBe(1.0);
      expect(calculateMultiplier(2)).toBe(1.0);
      expect(calculateMultiplier(2.999)).toBe(1.0);

      // Tier 2: 3 <= streak < 5 -> 1.2
      expect(calculateMultiplier(3)).toBe(1.2);
      expect(calculateMultiplier(3.5)).toBe(1.2);
      expect(calculateMultiplier(4)).toBe(1.2);
      expect(calculateMultiplier(4.999)).toBe(1.2);

      // Tier 3: 5 <= streak < 10 -> 1.5
      expect(calculateMultiplier(5)).toBe(1.5);
      expect(calculateMultiplier(7)).toBe(1.5);
      expect(calculateMultiplier(9)).toBe(1.5);
      expect(calculateMultiplier(9.999)).toBe(1.5);

      // Tier 4: streak >= 10 -> 2.0
      expect(calculateMultiplier(10)).toBe(2.0);
      expect(calculateMultiplier(100)).toBe(2.0);
      expect(calculateMultiplier(1000000)).toBe(2.0);
      expect(calculateMultiplier(Infinity)).toBe(2.0);
    });
  });

  describe('2. calculateScore boundary & stress tests', () => {
    it('uses PROGRESSION_CONFIG.BASE_SCORE (100) as default baseScore', () => {
      const score = calculateScore(undefined, 0);
      expect(score.points).toBe(100);
      expect(score.multiplier).toBe(1.0);
    });

    it('handles boundary streaks (-1, 0, 100)', () => {
      expect(calculateScore(100, -1).points).toBe(100);
      expect(calculateScore(100, 0).points).toBe(100);
      expect(calculateScore(100, 100).points).toBe(200);
    });

    it('handles bonus edge cases (negative, zero, massive, non-integer)', () => {
      // Negative bonus clamped to 0
      expect(calculateScore(100, 0, -50).points).toBe(100);
      expect(calculateScore(100, 3, -1).points).toBe(120);

      // Zero bonus
      expect(calculateScore(100, 5, 0).points).toBe(150);

      // Positive integer bonus
      expect(calculateScore(100, 10, 50).points).toBe(250);

      // Fractional bonus
      expect(calculateScore(100, 0, 15.5).points).toBe(115.5);
    });

    it('handles zero and custom base scores', () => {
      expect(calculateScore(0, 10, 50).points).toBe(50);
      expect(calculateScore(50, 4, 0).points).toBe(60); // 50 * 1.2 = 60
      expect(calculateScore(33, 3, 0).points).toBe(40); // 33 * 1.2 = 39.6 -> round to 40
    });
  });

  describe('3. checkCelebrationTrigger boundary & stress tests', () => {
    it('triggers celebrating true strictly at milestones 3, 5, 10', () => {
      expect(checkCelebrationTrigger(3)).toEqual({ isCelebrating: true, milestone: 3 });
      expect(checkCelebrationTrigger(5)).toEqual({ isCelebrating: true, milestone: 5 });
      expect(checkCelebrationTrigger(10)).toEqual({ isCelebrating: true, milestone: 10 });
    });

    it('returns celebrating false for off-by-one and boundary streaks', () => {
      const nonMilestones = [-10, -5, -3, -1, 0, 1, 2, 4, 6, 7, 8, 9, 11, 15, 100, 1000];
      for (const streak of nonMilestones) {
        expect(checkCelebrationTrigger(streak)).toEqual({
          isCelebrating: false,
          milestone: null,
        });
      }
    });

    it('handles float or invalid streak numbers safely', () => {
      expect(checkCelebrationTrigger(3.1)).toEqual({ isCelebrating: false, milestone: null });
      expect(checkCelebrationTrigger(NaN)).toEqual({ isCelebrating: false, milestone: null });
      expect(checkCelebrationTrigger(Infinity)).toEqual({ isCelebrating: false, milestone: null });
    });
  });

  describe('4. shouldTriggerScaffold boundary & stress tests', () => {
    it('returns false for negative and sub-threshold error counts', () => {
      expect(shouldTriggerScaffold(-5)).toBe(false);
      expect(shouldTriggerScaffold(-1)).toBe(false);
      expect(shouldTriggerScaffold(0)).toBe(false);
      expect(shouldTriggerScaffold(1)).toBe(false);
    });

    it('returns true for error counts >= 2 (SCAFFOLD_ERROR_THRESHOLD)', () => {
      expect(shouldTriggerScaffold(2)).toBe(true);
      expect(shouldTriggerScaffold(3)).toBe(true);
      expect(shouldTriggerScaffold(10)).toBe(true);
      expect(shouldTriggerScaffold(100)).toBe(true);
    });

    it('handles floating point and NaN safely', () => {
      expect(shouldTriggerScaffold(1.9)).toBe(false);
      expect(shouldTriggerScaffold(2.0)).toBe(true);
      expect(shouldTriggerScaffold(NaN)).toBe(false);
    });
  });

  describe('5. getStageCapacity boundary & stress tests', () => {
    it('maps valid curriculum stages correctly', () => {
      expect(getStageCapacity(1)).toBe(10);
      expect(getStageCapacity(2)).toBe(10);
      expect(getStageCapacity(3)).toBe(20);
      expect(getStageCapacity(4)).toBe(20);
    });

    it('gracefully handles invalid stage numbers without throwing', () => {
      // Stage <= 2 fallback to 10
      expect(getStageCapacity(0 as StageLevel)).toBe(10);
      expect(getStageCapacity(-1 as StageLevel)).toBe(10);
      expect(getStageCapacity(-99 as StageLevel)).toBe(10);

      // Stage > 2 fallback to 20
      expect(getStageCapacity(5 as StageLevel)).toBe(20);
      expect(getStageCapacity(100 as StageLevel)).toBe(20);

      // Valid FrameCapacity types are always preserved
      const capInvalid = getStageCapacity(99 as StageLevel);
      expect(capInvalid === 10 || capInvalid === 20).toBe(true);
    });
  });

  describe('6. getCorrectAnswer boundary & stress tests', () => {
    it('returns null for null or undefined problem', () => {
      expect(getCorrectAnswer(null as unknown as ActiveProblem)).toBeNull();
      expect(getCorrectAnswer(undefined as unknown as ActiveProblem)).toBeNull();
    });

    it('extracts correct answer from polymorphic domain problems', () => {
      const sub = generateSubitizeProblem(8);
      expect(getCorrectAnswer(sub)).toBe(8);

      const nbWhole = generateNumberBond({ minWhole: 10, maxWhole: 10 });
      expect(getCorrectAnswer(nbWhole)).toBe(nbWhole.getExpectedAnswer());

      const eq = generateBridgingTenAddition();
      expect(getCorrectAnswer(eq)).toBe(eq.getExpectedAnswer());
    });

    it('extracts correct answer from un-hydrated legacy object fixtures', () => {
      const legacySub = { id: 'leg-sub', targetCount: 4 } as unknown as ActiveProblem;
      expect(getCorrectAnswer(legacySub)).toBe(4);

      const legacyNb = {
        id: 'leg-nb',
        whole: 10,
        partA: 7,
        partB: 3,
        missing: 'partA' as const,
      } as unknown as ActiveProblem;
      expect(getCorrectAnswer(legacyNb)).toBe(7);

      const legacyEq = {
        id: 'leg-eq',
        operand1: 9,
        operator: '+' as const,
        operand2: 4,
        result: 13,
        missing: 'operand2' as const,
      } as unknown as ActiveProblem;
      expect(getCorrectAnswer(legacyEq)).toBe(4);
    });

    it('returns null for unknown / empty object literals', () => {
      const emptyObj = {} as unknown as ActiveProblem;
      expect(getCorrectAnswer(emptyObj)).toBeNull();

      const arbitraryObj = { title: 'Random', foo: 'bar' } as unknown as ActiveProblem;
      expect(getCorrectAnswer(arbitraryObj)).toBeNull();
    });
  });

  describe('7. evaluateAnswer boundary & stress tests', () => {
    it('returns false for null or undefined problem', () => {
      expect(evaluateAnswer(null as unknown as ActiveProblem, 5)).toBe(false);
      expect(evaluateAnswer(undefined as unknown as ActiveProblem, 5)).toBe(false);
    });

    it('returns false for non-numeric or non-finite answers', () => {
      const problem = generateSubitizeProblem(5);
      expect(evaluateAnswer(problem, NaN)).toBe(false);
      expect(evaluateAnswer(problem, Infinity)).toBe(false);
      expect(evaluateAnswer(problem, -Infinity)).toBe(false);
      expect(evaluateAnswer(problem, null as unknown as number)).toBe(false);
      expect(evaluateAnswer(problem, undefined as unknown as number)).toBe(false);
      expect(evaluateAnswer(problem, '5' as unknown as number)).toBe(false);
    });

    it('evaluates polymorphic problems with correct and incorrect answers', () => {
      const prob = generateConceptualProblem('single');
      const expected = prob.getExpectedAnswer();
      expect(evaluateAnswer(prob, expected)).toBe(true);
      expect(evaluateAnswer(prob, expected + 1)).toBe(false);
      expect(evaluateAnswer(prob, expected - 1)).toBe(false);
    });

    it('evaluates legacy un-hydrated fixtures', () => {
      const legacyNb = {
        id: 'leg-nb-2',
        whole: 15,
        partA: 10,
        partB: 5,
        missing: 'whole' as const,
      } as unknown as ActiveProblem;
      expect(evaluateAnswer(legacyNb, 15)).toBe(true);
      expect(evaluateAnswer(legacyNb, 10)).toBe(false);
    });

    it('returns false safely without throwing on malformed problem objects', () => {
      const malformed = { id: 'malformed' } as unknown as ActiveProblem;
      expect(evaluateAnswer(malformed, 0)).toBe(false);
      expect(evaluateAnswer(malformed, 10)).toBe(false);
    });
  });

  describe('8. asDomainProblem boundary & stress tests', () => {
    it('returns null for null or undefined inputs', () => {
      expect(asDomainProblem(null)).toBeNull();
      expect(asDomainProblem(undefined)).toBeNull();
    });

    it('preserves referential identity for objects already implementing DomainProblem', () => {
      const prob = generateSubitizeProblem(6);
      const adapted = asDomainProblem(prob);
      expect(adapted).toBe(prob);
    });

    it('adapts frozen legacy fixture literals without mutating the original object', () => {
      const frozenFixture = Object.freeze({
        id: 'frozen-fixture-1',
        operand1: 7,
        operator: '+' as const,
        operand2: 8,
        result: 15,
        missing: 'result' as const,
      });

      const adapted = asDomainProblem(frozenFixture as unknown as ActiveProblem);
      expect(adapted).not.toBeNull();
      expect(adapted?.type).toBe('equation');
      expect(adapted?.getExpectedAnswer()).toBe(15);
      expect(adapted?.validate(15)).toBe(true);
      expect(adapted?.validate(14)).toBe(false);

      // Verify original object was NOT mutated
      expect('validate' in frozenFixture).toBe(false);
      expect('getExpectedAnswer' in frozenFixture).toBe(false);
    });

    it('preserves referential identity of adapted instances via WeakMap cache', () => {
      const legacyFixture = {
        id: 'cached-legacy-nb',
        whole: 10,
        partA: 5,
        partB: 5,
        missing: 'partB' as const,
      };

      const adapted1 = asDomainProblem(legacyFixture as unknown as ActiveProblem);
      const adapted2 = asDomainProblem(legacyFixture as unknown as ActiveProblem);
      expect(adapted1).toBe(adapted2);
    });

    it('returns null gracefully for unrecognized object shapes', () => {
      const unknownObj = { randomKey: 'randomValue' };
      expect(asDomainProblem(unknownObj as unknown as ActiveProblem)).toBeNull();
    });
  });

  describe('9. Authoritative GameSession Engine (gameReducer empirical stress-tests)', () => {
    it('verifies scoring, streak progression, bestStreak updates, and streak multipliers across tiers (0, 3, 5, 10)', () => {
      const problem = generateSubitizeProblem(5);
      let state = gameReducerEngine.createInitialState({ activeProblem: problem });

      expect(state.streak).toBe(0);
      expect(state.bestStreak).toBe(0);
      expect(state.score).toBe(0);

      const expectedSteps = [
        { streak: 1, mult: 1.0, pts: 100, score: 100 },
        { streak: 2, mult: 1.0, pts: 100, score: 200 },
        { streak: 3, mult: 1.2, pts: 120, score: 320 },
        { streak: 4, mult: 1.2, pts: 120, score: 440 },
        { streak: 5, mult: 1.5, pts: 150, score: 590 },
        { streak: 6, mult: 1.5, pts: 150, score: 740 },
        { streak: 7, mult: 1.5, pts: 150, score: 890 },
        { streak: 8, mult: 1.5, pts: 150, score: 1040 },
        { streak: 9, mult: 1.5, pts: 150, score: 1190 },
        { streak: 10, mult: 2.0, pts: 200, score: 1390 },
        { streak: 11, mult: 2.0, pts: 200, score: 1590 },
      ];

      for (const step of expectedSteps) {
        state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 5 });
        expect(state.streak).toBe(step.streak);
        expect(state.bestStreak).toBe(step.streak);
        expect(state.score).toBe(step.score);
        expect(state.lastAnswerFeedback).toBe('correct');
      }

      // Submit incorrect answer: streak resets to 0, bestStreak preserved at 11, score preserved (non-punitive)
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 99 });
      expect(state.streak).toBe(0);
      expect(state.bestStreak).toBe(11);
      expect(state.score).toBe(1590);
      expect(state.lastAnswerFeedback).toBe('incorrect');

      // Subsequent correct answers: bestStreak preserved until exceeded
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 5 });
      expect(state.streak).toBe(1);
      expect(state.bestStreak).toBe(11);
      expect(state.score).toBe(1690);
    });

    it('verifies celebration milestones (3, 5, 10) and dismissal via DISMISS_CELEBRATION', () => {
      const problem = generateSubitizeProblem(4);
      let state = gameReducerEngine.createInitialState({ activeProblem: problem });

      // Streak 1 & 2: no celebration
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 });
      expect(state.isCelebrating).toBe(false);
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 });
      expect(state.isCelebrating).toBe(false);

      // Streak 3: Milestone 3!
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 });
      expect(state.streak).toBe(3);
      expect(state.isCelebrating).toBe(true);
      expect(state.celebrationMilestone).toBe(3);

      // Dismiss celebration
      state = gameReducerEngine.gameReducer(state, { type: 'DISMISS_CELEBRATION' });
      expect(state.isCelebrating).toBe(false);
      expect(state.celebrationMilestone).toBeNull();

      // Redundant dismissal returns same reference
      expect(gameReducerEngine.gameReducer(state, { type: 'DISMISS_CELEBRATION' })).toBe(state);

      // Streak 4: no celebration
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 });
      expect(state.isCelebrating).toBe(false);

      // Streak 5: Milestone 5!
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 });
      expect(state.isCelebrating).toBe(true);
      expect(state.celebrationMilestone).toBe(5);

      // Answering correctly while celebrating does not wipe celebration until dismissed
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 });
      expect(state.streak).toBe(6);
      expect(state.isCelebrating).toBe(true);
      expect(state.celebrationMilestone).toBe(5);

      // Dismiss
      state = gameReducerEngine.gameReducer(state, { type: 'DISMISS_CELEBRATION' });
      expect(state.isCelebrating).toBe(false);

      // Advance to streak 10: Milestone 10!
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 }); // 7
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 }); // 8
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 }); // 9
      expect(state.isCelebrating).toBe(false);

      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 }); // 10
      expect(state.streak).toBe(10);
      expect(state.isCelebrating).toBe(true);
      expect(state.celebrationMilestone).toBe(10);

      // Wrong answer clears celebration immediately
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 99 });
      expect(state.streak).toBe(0);
      expect(state.isCelebrating).toBe(false);
      expect(state.celebrationMilestone).toBeNull();
    });

    it('verifies error handling: streak reset, consecutiveErrors, scaffolding threshold (2), and resolution', () => {
      const problem = generateSubitizeProblem(6);
      let state = gameReducerEngine.createInitialState({ activeProblem: problem });

      expect(state.consecutiveErrors).toBe(0);
      expect(state.scaffoldActive).toBe(false);

      // Error 1: below threshold
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 1 });
      expect(state.streak).toBe(0);
      expect(state.consecutiveErrors).toBe(1);
      expect(state.scaffoldActive).toBe(false);
      expect(state.lastAnswerFeedback).toBe('incorrect');

      // Error 2: threshold met (2) -> scaffolding active!
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 2 });
      expect(state.consecutiveErrors).toBe(2);
      expect(state.scaffoldActive).toBe(true);

      // Error 3: stays active
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 3 });
      expect(state.consecutiveErrors).toBe(3);
      expect(state.scaffoldActive).toBe(true);

      // Correct answer: clears errors and scaffold
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 6 });
      expect(state.consecutiveErrors).toBe(0);
      expect(state.scaffoldActive).toBe(false);
      expect(state.streak).toBe(1);
      expect(state.lastAnswerFeedback).toBe('correct');

      // Transitions (NEXT_PROBLEM, SET_MODE, SET_STAGE) clear consecutive errors and scaffold
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 1 });
      state = gameReducerEngine.gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 2 });
      expect(state.scaffoldActive).toBe(true);

      const nextProbState = gameReducerEngine.gameReducer(state, { type: 'NEXT_PROBLEM' });
      expect(nextProbState.consecutiveErrors).toBe(0);
      expect(nextProbState.scaffoldActive).toBe(false);

      const setModeState = gameReducerEngine.gameReducer(state, { type: 'SET_MODE', mode: 'concrete' });
      expect(setModeState.consecutiveErrors).toBe(0);
      expect(setModeState.scaffoldActive).toBe(false);

      const setStageState = gameReducerEngine.gameReducer(state, { type: 'SET_STAGE', stage: 2 });
      expect(setStageState.consecutiveErrors).toBe(0);
      expect(setStageState.scaffoldActive).toBe(false);
    });

    it('verifies immutability and deep freeze invariants across state transitions', () => {
      let state = gameReducerEngine.createInitialState();
      expect(Object.isFrozen(state)).toBe(true);
      expect(Object.isFrozen(state.grid)).toBe(true);
      expect(Object.isFrozen(state.grid.cells)).toBe(true);

      const transitions = [
        { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' as const },
        { type: 'PLACE_COUNTER', slotIndex: 1, color: 'black' as const },
        { type: 'MOVE_COUNTER', fromIndex: 0, toIndex: 3 },
        { type: 'REMOVE_COUNTER', slotIndex: 1 },
        { type: 'SET_CAPACITY', capacity: 20 as const },
        { type: 'CLEAR_FRAME' as const },
        { type: 'SET_MODE', mode: 'abstract' as const },
        { type: 'SET_STAGE', stage: 2 as const },
        { type: 'NEXT_PROBLEM' as const },
        { type: 'SUBMIT_ANSWER', answer: 99 },
        { type: 'DISMISS_CELEBRATION' as const },
        { type: 'RESET_GAME' as const },
      ];

      for (const action of transitions) {
        state = gameReducerEngine.gameReducer(state, action as GameAction);
        expect(Object.isFrozen(state)).toBe(true);
        expect(Object.isFrozen(state.grid)).toBe(true);
        expect(Object.isFrozen(state.grid.cells)).toBe(true);

        expect(() => {
          // @ts-expect-error verifying runtime freeze
          state.score = 500;
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error verifying runtime freeze
          state.grid.totalCount = 500;
        }).toThrow(TypeError);
      }
    });
  });
});
