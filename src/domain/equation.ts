import { DomainEquationProblem, EquationMissing, EquationOperator, EquationProblem } from './types';

export interface EquationOptions {
  operator?: EquationOperator;
  minOperand?: number;
  maxResult?: number;
  allowZero?: boolean;
  bridgingTenOnly?: boolean;
  missing?: EquationMissing;
  randomFn?: () => number;
}

/**
 * Generates an addition or subtraction arithmetic equation problem.
 */
export function generateEquation(options?: EquationOptions): DomainEquationProblem {
  const randomFn = options?.randomFn ?? Math.random;
  const operator: EquationOperator =
    options?.operator ?? (randomFn() < 0.5 ? '+' : '-');
  const maxResult = options?.maxResult ?? 10;
  const minOperand = options?.minOperand ?? (options?.allowZero ? 0 : 1);
  const bridgingTenOnly = options?.bridgingTenOnly ?? false;

  let operand1: number;
  let operand2: number;
  let result: number;
  let isBridgingTen = false;

  if (bridgingTenOnly) {
    if (operator === '+') {
      // Pick operand1 in 2..9, operand2 in 2..9 such that sum in 11..18
      operand1 = Math.floor(randomFn() * 8) + 2; // 2..9
      const minOp2 = 11 - operand1;
      const maxOp2 = 9;
      operand2 = Math.floor(randomFn() * (maxOp2 - minOp2 + 1)) + minOp2;
      result = operand1 + operand2;
      isBridgingTen = true;
    } else {
      // Bridging subtraction: result in 2..9, operand1 in 11..18, operand2 in 2..9
      result = Math.floor(randomFn() * 8) + 2; // 2..9
      const minOp2 = 11 - result;
      const maxOp2 = 9;
      operand2 = Math.floor(randomFn() * (maxOp2 - minOp2 + 1)) + minOp2;
      operand1 = result + operand2;
      isBridgingTen = true;
    }
  } else {
    if (operator === '+') {
      const targetResult =
        Math.floor(randomFn() * (maxResult - 2 * minOperand + 1)) + 2 * minOperand;
      const maxOp1 = targetResult - minOperand;
      operand1 = Math.floor(randomFn() * (maxOp1 - minOperand + 1)) + minOperand;
      operand2 = targetResult - operand1;
      result = targetResult;
      isBridgingTen = operand1 < 10 && operand2 < 10 && result > 10;
    } else {
      // Subtraction: operand1 - operand2 = result
      const op1 =
        Math.floor(randomFn() * (maxResult - 2 * minOperand + 1)) + 2 * minOperand;
      const maxOp2 = op1 - minOperand;
      operand2 = Math.floor(randomFn() * (maxOp2 - minOperand + 1)) + minOperand;
      result = op1 - operand2;
      operand1 = op1;
      isBridgingTen = operand1 > 10 && result < 10;
    }
  }

  // Determine missing slot
  let missing: EquationMissing;
  if (options?.missing) {
    missing = options.missing;
  } else {
    const roll = randomFn();
    if (roll < 0.5) {
      missing = 'result';
    } else if (roll < 0.75) {
      missing = 'operand2';
    } else {
      missing = 'operand1';
    }
  }

  let answer: number;
  if (missing === 'result') {
    answer = result;
  } else if (missing === 'operand1') {
    answer = operand1;
  } else {
    answer = operand2;
  }

  const id = `eq-${Date.now()}-${Math.floor(randomFn() * 100000)}`;

  const problem: DomainEquationProblem = {
    id,
    type: 'equation',
    operand1,
    operator,
    operand2,
    result,
    missing,
    answer,
    isBridgingTen,
    validate(this: EquationProblem | void, userAnswer: number): boolean {
      return validateEquationAnswer(this ?? problem, userAnswer);
    },
    getExpectedAnswer(this: EquationProblem | void): number {
      return (this ?? problem).answer;
    },
  };

  return problem;
}

/**
 * Alias for generateEquation.
 */
export const generateEquationProblem = generateEquation;

export function generateBridgingTenAddition(
  missing?: EquationMissing,
  randomFn?: () => number
): DomainEquationProblem {
  return generateEquation({
    operator: '+',
    bridgingTenOnly: true,
    missing,
    randomFn,
  });
}

export function generateBridgingTenSubtraction(
  missing?: EquationMissing,
  randomFn?: () => number
): DomainEquationProblem {
  return generateEquation({
    operator: '-',
    bridgingTenOnly: true,
    missing,
    randomFn,
  });
}

export function generateTeenAddition(
  missing?: EquationMissing,
  randomFn?: () => number
): DomainEquationProblem {
  const rFn = randomFn ?? Math.random;
  const ones = Math.floor(rFn() * 9) + 1; // 1..9
  const id = `eq-teen-${Date.now()}-${Math.floor(rFn() * 100000)}`;
  const missingSlot = missing ?? 'result';
  let answer: number;
  if (missingSlot === 'result') answer = 10 + ones;
  else if (missingSlot === 'operand1') answer = 10;
  else answer = ones;

  const problem: DomainEquationProblem = {
    id,
    type: 'equation',
    operand1: 10,
    operator: '+',
    operand2: ones,
    result: 10 + ones,
    missing: missingSlot,
    answer,
    isBridgingTen: false,
    validate(this: EquationProblem | void, userAnswer: number): boolean {
      return validateEquationAnswer(this ?? problem, userAnswer);
    },
    getExpectedAnswer(this: EquationProblem | void): number {
      return (this ?? problem).answer;
    },
  };

  return problem;
}

export function validateEquationAnswer(
  problem: EquationProblem,
  answer: number
): boolean {
  return problem.answer === answer;
}
