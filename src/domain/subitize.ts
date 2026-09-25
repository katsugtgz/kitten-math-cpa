import { createPopulatedFrame, createTeenDecomposition } from './ten-frame';
import { SubitizeLayout, SubitizeProblem } from './types';

export interface SubitizeOptions {
  range?: 'perceptual' | 'conceptual-single' | 'conceptual-double' | 'any';
  layout?: SubitizeLayout;
  optionCount?: number;
  randomFn?: () => number;
}

/**
 * Generates intelligent distractors near the correct answer.
 */
export function generateDistractors(
  correctAnswer: number,
  count: number = 3,
  min: number = 1,
  max: number = 20,
  randomFn: () => number = Math.random
): number[] {
  const candidates = new Set<number>();
  const deltas = [-1, 1, -2, 2, -5, 5, -10, 10];

  // Try intelligent near-miss deltas
  for (const delta of deltas) {
    const candidate = correctAnswer + delta;
    if (candidate >= min && candidate <= max && candidate !== correctAnswer) {
      candidates.add(candidate);
    }
  }

  // If still not enough candidates, pick random numbers within [min, max]
  const available: number[] = [];
  for (let n = min; n <= max; n++) {
    if (n !== correctAnswer && !candidates.has(n)) {
      available.push(n);
    }
  }

  // Shuffle available pool
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  const candidateArray = Array.from(candidates);
  // Shuffle candidate array
  for (let i = candidateArray.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [candidateArray[i], candidateArray[j]] = [candidateArray[j], candidateArray[i]];
  }

  const chosenDistractors: number[] = [];
  for (const c of candidateArray) {
    if (chosenDistractors.length < count) {
      chosenDistractors.push(c);
    }
  }

  for (const a of available) {
    if (chosenDistractors.length < count) {
      chosenDistractors.push(a);
    }
  }

  // Combine with correct answer and shuffle
  const allOptions = [correctAnswer, ...chosenDistractors];
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }

  return allOptions;
}

/**
 * Generates a subitizing problem.
 */
export function generateSubitizeProblem(
  targetCount?: number,
  options?: SubitizeOptions
): SubitizeProblem {
  const randomFn = options?.randomFn ?? Math.random;
  const range = options?.range ?? 'any';

  let count: number;
  if (targetCount !== undefined) {
    count = Math.max(1, Math.min(20, Math.round(targetCount)));
  } else {
    switch (range) {
      case 'perceptual':
        count = Math.floor(randomFn() * 4) + 1; // 1..4
        break;
      case 'conceptual-single':
        count = Math.floor(randomFn() * 6) + 5; // 5..10
        break;
      case 'conceptual-double':
        count = Math.floor(randomFn() * 10) + 11; // 11..20
        break;
      case 'any':
      default:
        count = Math.floor(randomFn() * 20) + 1; // 1..20
        break;
    }
  }

  const layout: SubitizeLayout =
    options?.layout ?? (count <= 10 ? 'single' : 'double');

  const optionCount = options?.optionCount ?? 4;
  const distractorCount = Math.max(1, optionCount - 1);

  const minOpt = layout === 'single' ? 1 : 10;
  const maxOpt = layout === 'single' ? 10 : 20;

  const choices = generateDistractors(
    count,
    distractorCount,
    minOpt,
    maxOpt,
    randomFn
  );

  let grid;
  let redCount: number;
  let blackCount: number;

  if (layout === 'single') {
    if (count <= 5) {
      redCount = count;
      blackCount = 0;
    } else {
      redCount = 5;
      blackCount = count - 5;
    }
    grid = createPopulatedFrame(10, redCount, blackCount);
  } else {
    // Canonical teen double frame: 10 black + (count - 10) red
    const ones = count - 10;
    redCount = Math.max(0, ones);
    blackCount = 10;
    grid = createTeenDecomposition(count, 'black', 'red');
  }

  const id = `subitize-${Date.now()}-${Math.floor(randomFn() * 100000)}`;

  return {
    id,
    targetCount: count,
    redCount,
    blackCount,
    options: Object.freeze(choices),
    layout,
    grid,
  };
}

export function generatePerceptualProblem(
  randomFn?: () => number
): SubitizeProblem {
  return generateSubitizeProblem(undefined, { range: 'perceptual', layout: 'single', randomFn });
}

export function generateConceptualProblem(
  layout: SubitizeLayout = 'single',
  randomFn?: () => number
): SubitizeProblem {
  const range = layout === 'single' ? 'conceptual-single' : 'conceptual-double';
  return generateSubitizeProblem(undefined, { range, layout, randomFn });
}

export function validateSubitizeAnswer(
  problem: SubitizeProblem,
  answer: number
): boolean {
  return problem.targetCount === answer;
}
