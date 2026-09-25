import type {
  ActiveProblem,
  CelebrationMilestone,
  StageLevel,
} from './types';
import type { FrameCapacity } from '../domain/types';

/**
 * Calculates the score multiplier based on current streak count.
 * @param streak Current consecutive correct answers
 * @returns Multiplier between 1.0 and 2.0
 */
export function calculateMultiplier(streak: number): number {
  if (streak < 3) return 1.0;
  if (streak < 5) return 1.2;
  if (streak < 10) return 1.5;
  return 2.0;
}

/**
 * Calculates points awarded for a correct answer using the formula:
 * Points = round(100 * Multiplier) + Bonus
 *
 * @param baseScore Base points for correct answer (default 100)
 * @param streak Current streak prior to this correct answer (or post, based on convention)
 * @param bonus Optional bonus points (e.g. time bonus)
 */
export function calculateScore(
  baseScore: number = 100,
  streak: number,
  bonus: number = 0
): { points: number; multiplier: number } {
  const multiplier = calculateMultiplier(streak);
  const safeBonus = Math.max(0, bonus);
  const points = Math.round(baseScore * multiplier) + safeBonus;
  return { points, multiplier };
}

/**
 * Checks if a given streak count triggers a celebration milestone.
 * Celebrations trigger exactly at streak thresholds 3, 5, and 10.
 *
 * @param streak The new streak count after answer evaluation
 */
export function checkCelebrationTrigger(streak: number): {
  isCelebrating: boolean;
  milestone: CelebrationMilestone | null;
} {
  if (streak === 3 || streak === 5 || streak === 10) {
    return {
      isCelebrating: true,
      milestone: streak as CelebrationMilestone,
    };
  }
  return {
    isCelebrating: false,
    milestone: null,
  };
}

/**
 * Determines whether the visual scaffold hint should activate.
 * Activates automatically after 2 consecutive errors.
 *
 * @param consecutiveErrors Count of consecutive errors
 */
export function shouldTriggerScaffold(consecutiveErrors: number): boolean {
  return consecutiveErrors >= 2;
}

/**
 * Returns default ten-frame capacity for a given curriculum stage.
 * Stages 1-2 use single ten-frame (10). Stages 3-4 use double ten-frame (20).
 *
 * @param stage Curriculum stage level (1 to 4)
 */
export function getStageCapacity(stage: StageLevel): FrameCapacity {
  switch (stage) {
    case 1:
    case 2:
      return 10;
    case 3:
    case 4:
      return 20;
  }
}

/**
 * Extracts the expected numeric answer for any ActiveProblem.
 * Returns null if the problem is null or invalid.
 *
 * @param problem Subitize, NumberBond, or Equation problem
 */
export function getCorrectAnswer(problem: ActiveProblem): number | null {
  if (!problem) return null;

  // SubitizeProblem: targetCount
  if ('targetCount' in problem) {
    return problem.targetCount;
  }

  // NumberBondProblem: missing whole, partA, or partB
  if ('missing' in problem && 'whole' in problem) {
    switch (problem.missing) {
      case 'whole':
        return problem.whole;
      case 'partA':
        return problem.partA;
      case 'partB':
        return problem.partB;
    }
  }

  // EquationProblem: missing result, operand1, or operand2
  if ('missing' in problem && 'operator' in problem) {
    switch (problem.missing) {
      case 'result':
        return problem.result;
      case 'operand1':
        return problem.operand1;
      case 'operand2':
        return problem.operand2;
    }
  }

  return null;
}

/**
 * Evaluates whether a user's answer is correct for the active problem.
 *
 * @param problem Active mathematical challenge
 * @param answer User's submitted integer answer
 */
export function evaluateAnswer(problem: ActiveProblem, answer: number): boolean {
  const expected = getCorrectAnswer(problem);
  if (expected === null) return false;
  return expected === answer;
}
