import { describe, expect, it } from 'vitest';
import {
  generateBridgingTenAddition,
  generateBridgingTenSubtraction,
  generateEquation,
  generateTeenAddition,
  validateEquationAnswer,
} from '../equation';
import { asDomainProblem } from '../adapter';
import type { ActiveProblem } from '../types';

describe('equation generator', () => {
  it('generates valid addition equations', () => {
    for (let i = 0; i < 30; i++) {
      const eq = generateEquation({ operator: '+', maxResult: 10 });
      expect(eq.operator).toBe('+');
      expect(eq.operand1 + eq.operand2).toBe(eq.result);
      expect(eq.result).toBeLessThanOrEqual(10);
    }
  });

  it('generates valid subtraction equations without negative results', () => {
    for (let i = 0; i < 30; i++) {
      const eq = generateEquation({ operator: '-', maxResult: 10 });
      expect(eq.operator).toBe('-');
      expect(eq.operand1 - eq.operand2).toBe(eq.result);
      expect(eq.result).toBeGreaterThanOrEqual(0);
      expect(eq.operand1).toBeGreaterThanOrEqual(eq.operand2);
    }
  });

  it('generates bridging-10 addition equations crossing ten boundary', () => {
    for (let i = 0; i < 30; i++) {
      const eq = generateBridgingTenAddition();
      expect(eq.operator).toBe('+');
      expect(eq.operand1).toBeLessThan(10);
      expect(eq.operand2).toBeLessThan(10);
      expect(eq.result).toBeGreaterThan(10);
      expect(eq.result).toBeLessThanOrEqual(18);
      expect(eq.isBridgingTen).toBe(true);
    }
  });

  it('generates bridging-10 subtraction equations crossing ten boundary', () => {
    for (let i = 0; i < 30; i++) {
      const eq = generateBridgingTenSubtraction();
      expect(eq.operator).toBe('-');
      expect(eq.operand1).toBeGreaterThan(10);
      expect(eq.operand2).toBeLessThan(10);
      expect(eq.result).toBeLessThan(10);
      expect(eq.isBridgingTen).toBe(true);
    }
  });

  it('generates teen addition equations (10 + N = 1N)', () => {
    for (let i = 0; i < 20; i++) {
      const eq = generateTeenAddition();
      expect(eq.operand1).toBe(10);
      expect(eq.operator).toBe('+');
      expect(eq.operand2).toBeGreaterThanOrEqual(1);
      expect(eq.operand2).toBeLessThanOrEqual(9);
      expect(eq.result).toBe(10 + eq.operand2);
    }
  });

  it('assigns correct answer based on missing position', () => {
    const missingRes = generateEquation({ operator: '+', missing: 'result' });
    expect(missingRes.answer).toBe(missingRes.result);

    const missingOp1 = generateEquation({ operator: '+', missing: 'operand1' });
    expect(missingOp1.answer).toBe(missingOp1.operand1);

    const missingOp2 = generateEquation({ operator: '+', missing: 'operand2' });
    expect(missingOp2.answer).toBe(missingOp2.operand2);
  });

  it('validates equation answers correctly', () => {
    const eq = generateEquation({ operator: '+', missing: 'result' });
    expect(validateEquationAnswer(eq, eq.result)).toBe(true);
    expect(validateEquationAnswer(eq, eq.result + 99)).toBe(false);
  });

  describe('polymorphic domain interface', () => {
    it('exposes type, validate, and getExpectedAnswer on generated equations', () => {
      const eq = generateEquation({ operator: '+', missing: 'result' });
      expect(eq.type).toBe('equation');
      expect(eq.getExpectedAnswer()).toBe(eq.result);
      expect(eq.validate(eq.result)).toBe(true);
      expect(eq.validate(eq.result + 1)).toBe(false);

      // Destructuring safety check
      const { validate, getExpectedAnswer } = eq;
      expect(getExpectedAnswer()).toBe(eq.result);
      expect(validate(eq.result)).toBe(true);
      expect(validate(eq.result + 99)).toBe(false);
    });

    it('exposes polymorphic methods on teen addition equations', () => {
      const teenEq = generateTeenAddition('result');
      expect(teenEq.type).toBe('equation');
      expect(teenEq.getExpectedAnswer()).toBe(teenEq.result);
      expect(teenEq.validate(teenEq.result)).toBe(true);
      expect(teenEq.validate(teenEq.result + 1)).toBe(false);

      const teenOp = generateTeenAddition('operand2');
      expect(teenOp.type).toBe('equation');
      expect(teenOp.getExpectedAnswer()).toBe(teenOp.operand2);
      expect(teenOp.validate(teenOp.operand2)).toBe(true);
      expect(teenOp.validate(teenOp.operand2 + 5)).toBe(false);
    });

    it('exposes polymorphic methods on bridging ten equations', () => {
      const bridgeAdd = generateBridgingTenAddition();
      expect(bridgeAdd.type).toBe('equation');
      expect(bridgeAdd.validate(bridgeAdd.answer)).toBe(true);
      expect(bridgeAdd.validate(bridgeAdd.answer + 10)).toBe(false);
      expect(bridgeAdd.getExpectedAnswer()).toBe(bridgeAdd.answer);

      const bridgeSub = generateBridgingTenSubtraction();
      expect(bridgeSub.type).toBe('equation');
      expect(bridgeSub.validate(bridgeSub.answer)).toBe(true);
      expect(bridgeSub.validate(bridgeSub.answer - 1)).toBe(false);
      expect(bridgeSub.getExpectedAnswer()).toBe(bridgeSub.answer);
    });
  });

  describe('asDomainProblem adapter for equation', () => {
    it('returns already polymorphic equation directly', () => {
      const eq = generateEquation({ operator: '+' });
      const adapted = asDomainProblem(eq);
      expect(adapted).toBe(eq);
    });

    it('adapts plain fixture literal without mutating input object', () => {
      const plainFixture = Object.freeze({
        id: 'test-plain-eq',
        operand1: 8,
        operator: '+' as const,
        operand2: 5,
        result: 13,
        missing: 'result' as const,
        answer: 13,
      });

      const adapted1 = asDomainProblem(plainFixture as unknown as ActiveProblem);
      expect(adapted1).not.toBeNull();
      expect(adapted1?.type).toBe('equation');
      expect(adapted1?.getExpectedAnswer()).toBe(13);
      expect(adapted1?.validate(13)).toBe(true);
      expect(adapted1?.validate(12)).toBe(false);

      // WeakMap cache stability
      const adapted2 = asDomainProblem(plainFixture as unknown as ActiveProblem);
      expect(adapted2).toBe(adapted1);

      // Input was not mutated
      expect('validate' in plainFixture).toBe(false);
    });

    it('adapts plain fixture with missing operand1 or operand2 when answer property is absent', () => {
      const plainOp1 = {
        id: 'plain-op1',
        operand1: 8,
        operator: '+' as const,
        operand2: 5,
        result: 13,
        missing: 'operand1' as const,
      };
      const adaptedOp1 = asDomainProblem(plainOp1 as unknown as ActiveProblem);
      expect(adaptedOp1?.getExpectedAnswer()).toBe(8);
      expect(adaptedOp1?.validate(8)).toBe(true);

      const plainOp2 = {
        id: 'plain-op2',
        operand1: 8,
        operator: '+' as const,
        operand2: 5,
        result: 13,
        missing: 'operand2' as const,
      };
      const adaptedOp2 = asDomainProblem(plainOp2 as unknown as ActiveProblem);
      expect(adaptedOp2?.getExpectedAnswer()).toBe(5);
      expect(adaptedOp2?.validate(5)).toBe(true);
    });
  });

  describe('polymorphic domain interface', () => {
    it('exposes type, validate, and getExpectedAnswer on generated equations', () => {
      const eq = generateEquation({ operator: '+', missing: 'result' });
      expect(eq.type).toBe('equation');
      expect(eq.getExpectedAnswer()).toBe(eq.result);
      expect(eq.validate(eq.result)).toBe(true);
      expect(eq.validate(eq.result + 1)).toBe(false);

      // Destructuring safety check
      const { validate, getExpectedAnswer } = eq;
      expect(getExpectedAnswer()).toBe(eq.result);
      expect(validate(eq.result)).toBe(true);
      expect(validate(eq.result + 1)).toBe(false);

      const teenEq = generateTeenAddition('result');
      expect(teenEq.type).toBe('equation');
      expect(teenEq.getExpectedAnswer()).toBe(teenEq.result);
      expect(teenEq.validate(teenEq.result)).toBe(true);
    });
  });
});
