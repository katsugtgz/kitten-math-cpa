import { NumberBondMissing, NumberBondProblem } from './types';

export interface NumberBondOptions {
  minWhole?: number;
  maxWhole?: number;
  allowZero?: boolean;
  forceTeenCanonical?: boolean;
  missing?: NumberBondMissing;
  randomFn?: () => number;
}

/**
 * Generates a Singapore Math Number Bond problem (Part-Part-Whole).
 */
export function generateNumberBond(options?: NumberBondOptions): NumberBondProblem {
  const randomFn = options?.randomFn ?? Math.random;
  const allowZero = options?.allowZero ?? false;
  const minWhole = options?.minWhole ?? 2;
  const maxWhole = options?.maxWhole ?? 10;
  const forceTeenCanonical = options?.forceTeenCanonical ?? false;

  const whole =
    Math.floor(randomFn() * (maxWhole - minWhole + 1)) + minWhole;

  let partA: number;
  let partB: number;

  if (forceTeenCanonical && whole >= 11 && whole <= 19) {
    partA = 10;
    partB = whole - 10;
  } else {
    const minPart = allowZero ? 0 : 1;
    const maxPart = allowZero ? whole : whole - 1;
    if (minPart > maxPart) {
      partA = 0;
      partB = whole;
    } else {
      partA = Math.floor(randomFn() * (maxPart - minPart + 1)) + minPart;
      partB = whole - partA;
    }
  }

  // Determine missing slot
  let missing: NumberBondMissing;
  if (options?.missing) {
    missing = options.missing;
  } else {
    const roll = randomFn();
    if (roll < 0.34) {
      missing = 'whole';
    } else if (roll < 0.67) {
      missing = 'partA';
    } else {
      missing = 'partB';
    }
  }

  let answer: number;
  if (missing === 'whole') {
    answer = whole;
  } else if (missing === 'partA') {
    answer = partA;
  } else {
    answer = partB;
  }

  const id = `nb-${Date.now()}-${Math.floor(randomFn() * 100000)}`;

  return {
    id,
    whole,
    partA,
    partB,
    missing,
    answer,
  };
}

/**
 * Alias for generateNumberBond.
 */
export const generateNumberBondProblem = generateNumberBond;

/**
 * Generates a "Friends of 10" number bond (whole is always 10).
 */
export function generateFriendsOfTenBond(
  missing?: NumberBondMissing,
  randomFn?: () => number
): NumberBondProblem {
  return generateNumberBond({
    minWhole: 10,
    maxWhole: 10,
    missing,
    randomFn,
  });
}

/**
 * Generates a teen number bond (11-19) decomposed canonically into 10 + N.
 */
export function generateTeenBond(
  missing?: NumberBondMissing,
  randomFn?: () => number
): NumberBondProblem {
  return generateNumberBond({
    minWhole: 11,
    maxWhole: 19,
    forceTeenCanonical: true,
    missing,
    randomFn,
  });
}

export function validateNumberBondAnswer(
  problem: NumberBondProblem,
  answer: number
): boolean {
  return problem.answer === answer;
}
