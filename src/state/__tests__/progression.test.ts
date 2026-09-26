import { describe, it, expect } from 'vitest';
import {
  calculateMultiplier,
  calculateScore,
  checkCelebrationTrigger,
  shouldTriggerScaffold,
  getStageCapacity,
  getCorrectAnswer,
  evaluateAnswer,
} from '../progression';
import type {
  ActiveProblem,
  SubitizeProblem,
  NumberBondProblem,
  EquationProblem,
} from '../../domain/types';
import {
  createSubitizeProblem,
  createNumberBondProblem,
  createEquationProblem,
} from '../../domain/types';

describe('Progression Rules Engine (src/state/progression.ts)', () => {
  describe('calculateMultiplier', () => {
    it('returns 1.0 for streaks 0, 1, and 2', () => {
      expect(calculateMultiplier(0)).toBe(1.0);
      expect(calculateMultiplier(1)).toBe(1.0);
      expect(calculateMultiplier(2)).toBe(1.0);
    });

    it('returns 1.2 for streaks 3 and 4', () => {
      expect(calculateMultiplier(3)).toBe(1.2);
      expect(calculateMultiplier(4)).toBe(1.2);
    });

    it('returns 1.5 for streaks 5 through 9', () => {
      expect(calculateMultiplier(5)).toBe(1.5);
      expect(calculateMultiplier(7)).toBe(1.5);
      expect(calculateMultiplier(9)).toBe(1.5);
    });

    it('returns 2.0 for streaks 10 and above', () => {
      expect(calculateMultiplier(10)).toBe(2.0);
      expect(calculateMultiplier(15)).toBe(2.0);
      expect(calculateMultiplier(50)).toBe(2.0);
    });
  });

  describe('calculateScore', () => {
    it('calculates base points with 1.0x multiplier correctly', () => {
      const result = calculateScore(100, 0);
      expect(result.multiplier).toBe(1.0);
      expect(result.points).toBe(100);
    });

    it('calculates scaled points for higher streak tiers', () => {
      expect(calculateScore(100, 3).points).toBe(120);
      expect(calculateScore(100, 5).points).toBe(150);
      expect(calculateScore(100, 10).points).toBe(200);
    });

    it('adds bonus points correctly and clamps negative bonus to 0', () => {
      expect(calculateScore(100, 0, 25).points).toBe(125);
      expect(calculateScore(100, 5, 50).points).toBe(200);
      expect(calculateScore(100, 0, -10).points).toBe(100);
    });
  });

  describe('checkCelebrationTrigger', () => {
    it('triggers celebration on milestone streaks 3, 5, and 10', () => {
      expect(checkCelebrationTrigger(3)).toEqual({ isCelebrating: true, milestone: 3 });
      expect(checkCelebrationTrigger(5)).toEqual({ isCelebrating: true, milestone: 5 });
      expect(checkCelebrationTrigger(10)).toEqual({ isCelebrating: true, milestone: 10 });
    });

    it('does not trigger celebration on non-milestone streaks', () => {
      expect(checkCelebrationTrigger(0)).toEqual({ isCelebrating: false, milestone: null });
      expect(checkCelebrationTrigger(1)).toEqual({ isCelebrating: false, milestone: null });
      expect(checkCelebrationTrigger(2)).toEqual({ isCelebrating: false, milestone: null });
      expect(checkCelebrationTrigger(4)).toEqual({ isCelebrating: false, milestone: null });
      expect(checkCelebrationTrigger(6)).toEqual({ isCelebrating: false, milestone: null });
      expect(checkCelebrationTrigger(7)).toEqual({ isCelebrating: false, milestone: null });
      expect(checkCelebrationTrigger(8)).toEqual({ isCelebrating: false, milestone: null });
      expect(checkCelebrationTrigger(9)).toEqual({ isCelebrating: false, milestone: null });
      expect(checkCelebrationTrigger(11)).toEqual({ isCelebrating: false, milestone: null });
    });
  });

  describe('shouldTriggerScaffold', () => {
    it('returns false for 0 and 1 consecutive errors', () => {
      expect(shouldTriggerScaffold(0)).toBe(false);
      expect(shouldTriggerScaffold(1)).toBe(false);
    });

    it('returns true for 2 or more consecutive errors', () => {
      expect(shouldTriggerScaffold(2)).toBe(true);
      expect(shouldTriggerScaffold(3)).toBe(true);
      expect(shouldTriggerScaffold(5)).toBe(true);
    });
  });

  describe('getStageCapacity', () => {
    it('maps Stage 1 and 2 to capacity 10', () => {
      expect(getStageCapacity(1)).toBe(10);
      expect(getStageCapacity(2)).toBe(10);
    });

    it('maps Stage 3 and 4 to capacity 20', () => {
      expect(getStageCapacity(3)).toBe(20);
      expect(getStageCapacity(4)).toBe(20);
    });
  });

  describe('evaluateAnswer & getCorrectAnswer', () => {
    it('evaluates SubitizeProblem correctly', () => {
      const problem: SubitizeProblem = createSubitizeProblem({
        id: 'sub-1',
        targetCount: 7,
        redCount: 5,
        blackCount: 2,
        options: [5, 6, 7, 8],
        layout: 'single',
      });
      expect(getCorrectAnswer(problem)).toBe(7);
      expect(evaluateAnswer(problem, 7)).toBe(true);
      expect(evaluateAnswer(problem, 6)).toBe(false);
    });

    it('evaluates NumberBondProblem with missing whole', () => {
      const problem: NumberBondProblem = createNumberBondProblem({
        id: 'nb-1',
        whole: 10,
        partA: 7,
        partB: 3,
        missing: 'whole',
        answer: 10,
      });
      expect(getCorrectAnswer(problem)).toBe(10);
      expect(evaluateAnswer(problem, 10)).toBe(true);
      expect(evaluateAnswer(problem, 7)).toBe(false);
    });

    it('evaluates NumberBondProblem with missing partA and partB', () => {
      const problemA: NumberBondProblem = createNumberBondProblem({
        id: 'nb-2',
        whole: 10,
        partA: 6,
        partB: 4,
        missing: 'partA',
        answer: 6,
      });
      expect(getCorrectAnswer(problemA)).toBe(6);
      expect(evaluateAnswer(problemA, 6)).toBe(true);

      const problemB: NumberBondProblem = createNumberBondProblem({
        id: 'nb-3',
        whole: 10,
        partA: 6,
        partB: 4,
        missing: 'partB',
        answer: 4,
      });
      expect(getCorrectAnswer(problemB)).toBe(4);
      expect(evaluateAnswer(problemB, 4)).toBe(true);
    });

    it('evaluates EquationProblem for all missing positions', () => {
      const eqResult: EquationProblem = createEquationProblem({
        id: 'eq-1',
        operand1: 8,
        operator: '+',
        operand2: 5,
        result: 13,
        missing: 'result',
        answer: 13,
      });
      expect(getCorrectAnswer(eqResult)).toBe(13);
      expect(evaluateAnswer(eqResult, 13)).toBe(true);
      expect(evaluateAnswer(eqResult, 12)).toBe(false);

      const eqOp1: EquationProblem = createEquationProblem({
        id: 'eq-2',
        operand1: 8,
        operator: '+',
        operand2: 5,
        result: 13,
        missing: 'operand1',
        answer: 8,
      });
      expect(getCorrectAnswer(eqOp1)).toBe(8);
      expect(evaluateAnswer(eqOp1, 8)).toBe(true);

      const eqOp2: EquationProblem = createEquationProblem({
        id: 'eq-3',
        operand1: 8,
        operator: '+',
        operand2: 5,
        result: 13,
        missing: 'operand2',
        answer: 5,
      });
      expect(getCorrectAnswer(eqOp2)).toBe(5);
      expect(evaluateAnswer(eqOp2, 5)).toBe(true);
    });

    it('evaluates un-hydrated legacy objects via fallback', () => {
      const unhydratedSub = { id: 'legacy-sub', targetCount: 9 } as unknown as ActiveProblem;
      expect(getCorrectAnswer(unhydratedSub)).toBe(9);
      expect(evaluateAnswer(unhydratedSub, 9)).toBe(true);
      expect(evaluateAnswer(unhydratedSub, 8)).toBe(false);

      const unhydratedNb = { id: 'legacy-nb', whole: 10, partA: 8, partB: 2, missing: 'partB' } as unknown as ActiveProblem;
      expect(getCorrectAnswer(unhydratedNb)).toBe(2);
      expect(evaluateAnswer(unhydratedNb, 2)).toBe(true);

      const unhydratedEq = { id: 'legacy-eq', operand1: 7, operator: '+', operand2: 3, result: 10, missing: 'result' } as unknown as ActiveProblem;
      expect(getCorrectAnswer(unhydratedEq)).toBe(10);
      expect(evaluateAnswer(unhydratedEq, 10)).toBe(true);
    });

    it('returns false and null for null problem', () => {
      expect(getCorrectAnswer(null)).toBeNull();
      expect(evaluateAnswer(null, 5)).toBe(false);
    });
  });
});
