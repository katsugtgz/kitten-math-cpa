import { describe, expect, it } from 'vitest';
import {
  generateBridgingTenAddition,
  generateBridgingTenSubtraction,
  generateEquation,
  generateTeenAddition,
  validateEquationAnswer,
} from '../equation';

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
});
