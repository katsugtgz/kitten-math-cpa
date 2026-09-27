import type {
  ActiveProblem,
  CelebrationMilestone,
  StageLevel,
} from './types';
import type { FrameCapacity } from '../domain/types';
import {
  PROGRESSION_CONFIG,
  BASE_SCORE,
  CELEBRATION_MILESTONES,
  SCAFFOLD_ERROR_THRESHOLD,
  STAGE_CAPACITIES,
  asDomainProblem,
  calculateMultiplier as engineCalculateMultiplier,
  calculateScore as engineCalculateScore,
  checkCelebrationTrigger as engineCheckCelebrationTrigger,
  shouldTriggerScaffold as engineShouldTriggerScaffold,
  getStageCapacity as engineGetStageCapacity,
  getCorrectAnswer as engineGetCorrectAnswer,
  evaluateAnswer as engineEvaluateAnswer,
} from './game-reducer';

export {
  PROGRESSION_CONFIG,
  BASE_SCORE,
  CELEBRATION_MILESTONES,
  SCAFFOLD_ERROR_THRESHOLD,
  STAGE_CAPACITIES,
  asDomainProblem,
};

/**
 * Calculates score multiplier based on current streak count.
 * Multipliers: <3 -> 1.0, 3..4 -> 1.2, 5..9 -> 1.5, >=10 -> 2.0
 *
 * @param streak Current consecutive correct answers
 * @returns Multiplier between 1.0 and 2.0
 */
export function calculateMultiplier(streak: number): number {
  return engineCalculateMultiplier(streak);
}

/**
 * Calculates points awarded for a correct answer using the formula:
 * Points = round(baseScore * Multiplier) + max(0, bonus)
 *
 * @param baseScore Base points for correct answer (default 100)
 * @param streak Current streak count
 * @param bonus Optional bonus points (clamped to >= 0)
 */
export function calculateScore(
  baseScore: number = PROGRESSION_CONFIG.BASE_SCORE,
  streak: number,
  bonus: number = 0
): { points: number; multiplier: number } {
  return engineCalculateScore(baseScore, streak, bonus);
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
  return engineCheckCelebrationTrigger(streak);
}

/**
 * Determines whether the visual scaffold hint should activate.
 * Activates automatically after 2 consecutive errors.
 *
 * @param consecutiveErrors Count of consecutive errors
 */
export function shouldTriggerScaffold(consecutiveErrors: number): boolean {
  return engineShouldTriggerScaffold(consecutiveErrors);
}

/**
 * Returns default ten-frame capacity for a given curriculum stage.
 * Stages 1-2 use single ten-frame (10). Stages 3-4 use double ten-frame (20).
 *
 * @param stage Curriculum stage level (1 to 4)
 */
export function getStageCapacity(stage: StageLevel): FrameCapacity {
  return engineGetStageCapacity(stage);
}

/**
 * Extracts expected numeric answer for any ActiveProblem via polymorphic domain inspection.
 * Checks polymorphic method first, delegating to asDomainProblem for adapted legacy test fixtures.
 *
 * @param problem Subitize, NumberBond, or Equation problem
 */
export function getCorrectAnswer(problem: ActiveProblem): number | null {
  return engineGetCorrectAnswer(problem);
}

/**
 * Evaluates whether a user's answer is correct for the active problem
 * using authoritative polymorphic domain validation.
 *
 * @param problem Active mathematical challenge
 * @param answer User's submitted integer answer
 */
export function evaluateAnswer(problem: ActiveProblem, answer: number): boolean {
  return engineEvaluateAnswer(problem, answer);
}
