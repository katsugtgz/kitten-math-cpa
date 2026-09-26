import type {
  ActiveProblem,
  CelebrationMilestone,
  GameAction,
  GameState,
  GameMode,
  StageLevel,
} from './types';
import type { FrameCapacity } from '../domain/types';
import { asDomainProblem } from '../domain/adapter';
import {
  clearGrid,
  createEmptyGrid,
  placeCounter,
  removeCounter,
  setGridCapacity,
} from '../domain/ten-frame';
import { generateSubitizeProblem } from '../domain/subitize';
import {
  generateFriendsOfTenBond,
  generateNumberBond,
  generateTeenBond,
} from '../domain/number-bond';
import { generateEquation } from '../domain/equation';

export { asDomainProblem };

// ============================================================================
// Authoritative Progression Configuration & Invariants
// ============================================================================

/**
 * Authoritative progression and gamification configuration constants.
 */
export const PROGRESSION_CONFIG = Object.freeze({
  BASE_SCORE: 100,
  SCAFFOLD_CONSECUTIVE_ERRORS: 2,
  CELEBRATION_MILESTONES: Object.freeze([3, 5, 10] as const),
  STREAK_TIERS: Object.freeze([
    { minStreak: 10, multiplier: 2.0 },
    { minStreak: 5, multiplier: 1.5 },
    { minStreak: 3, multiplier: 1.2 },
    { minStreak: 0, multiplier: 1.0 },
  ] as const),
  STAGE_CAPACITIES: Object.freeze({
    1: 10 as FrameCapacity,
    2: 10 as FrameCapacity,
    3: 20 as FrameCapacity,
    4: 20 as FrameCapacity,
  } as const),
});

export const BASE_SCORE = PROGRESSION_CONFIG.BASE_SCORE;
export const CELEBRATION_MILESTONES = PROGRESSION_CONFIG.CELEBRATION_MILESTONES;
export const SCAFFOLD_ERROR_THRESHOLD = PROGRESSION_CONFIG.SCAFFOLD_CONSECUTIVE_ERRORS;
export const STAGE_CAPACITIES = PROGRESSION_CONFIG.STAGE_CAPACITIES;

// ============================================================================
// Progression Calculation Functions (Authoritative Engine)
// ============================================================================

/**
 * Calculates score multiplier based on current streak count.
 * Multipliers: <3 -> 1.0, 3..4 -> 1.2, 5..9 -> 1.5, >=10 -> 2.0
 */
export function calculateMultiplier(streak: number): number {
  if (streak < 3) return 1.0;
  if (streak < 5) return 1.2;
  if (streak < 10) return 1.5;
  return 2.0;
}

/**
 * Calculates points awarded for a correct answer:
 * Points = round(baseScore * multiplier) + max(0, bonus)
 */
export function calculateScore(
  baseScore: number = PROGRESSION_CONFIG.BASE_SCORE,
  streak: number,
  bonus: number = 0
): { points: number; multiplier: number } {
  const multiplier = calculateMultiplier(streak);
  const safeBonus = Math.max(0, bonus);
  const points = Math.round(baseScore * multiplier) + safeBonus;
  return { points, multiplier };
}

/**
 * Checks whether the streak count triggers a celebratory milestone (3, 5, 10).
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
 * Determines whether pedagogical visual scaffolding should be activated.
 * Activates on 2 or more consecutive errors.
 */
export function shouldTriggerScaffold(consecutiveErrors: number): boolean {
  return consecutiveErrors >= PROGRESSION_CONFIG.SCAFFOLD_CONSECUTIVE_ERRORS;
}

/**
 * Maps curriculum stage to standard ten-frame capacity.
 * Stages 1-2: 10, Stages 3-4: 20.
 */
export function getStageCapacity(stage: StageLevel): FrameCapacity {
  return PROGRESSION_CONFIG.STAGE_CAPACITIES[stage] ?? (stage <= 2 ? 10 : 20);
}

/**
 * Extracts expected numeric answer for any ActiveProblem via polymorphic domain inspection.
 * Checks polymorphic method first, delegating to asDomainProblem for adapted legacy test fixtures.
 */
export function getCorrectAnswer(problem: ActiveProblem): number | null {
  if (!problem) return null;

  const p = problem as unknown as Record<string, unknown>;
  if (typeof p.getExpectedAnswer === 'function') {
    return (p.getExpectedAnswer as () => number)();
  }

  const domainProblem = asDomainProblem(problem);
  return domainProblem ? domainProblem.getExpectedAnswer() : null;
}

/**
 * Evaluates whether a user's answer is correct for the active problem.
 * Uses authoritative polymorphic domain validation with zero type-sniffing.
 */
export function evaluateAnswer(problem: ActiveProblem, answer: number): boolean {
  if (!problem || typeof answer !== 'number' || !Number.isFinite(answer)) {
    return false;
  }

  const p = problem as unknown as Record<string, unknown>;
  if (typeof p.validate === 'function') {
    return (p.validate as (ans: number) => boolean)(answer);
  }

  const domainProblem = asDomainProblem(problem);
  return domainProblem ? domainProblem.validate(answer) : false;
}

/**
 * Authoritatively evaluates a user's answer for a game session across all CPA modes.
 */
export function evaluateSessionAnswer(state: GameState, answer: number): boolean {
  if (typeof answer !== 'number' || !Number.isFinite(answer)) {
    return false;
  }

  if (state.activeProblem) {
    return evaluateAnswer(state.activeProblem, answer);
  }

  if (state.mode === 'concrete') {
    return answer === state.grid.totalCount;
  }

  return false;
}

/**
 * Generates an active problem appropriate for the given mode and stage.
 * Used when NEXT_PROBLEM, SET_MODE, or SET_STAGE does not provide an explicit fixture.
 */
export function generateProblemForMode(
  mode: GameMode,
  stage: StageLevel
): ActiveProblem {
  switch (mode) {
    case 'concrete':
      // Free manipulative mode: no problem prompt active
      return null;
    case 'pictorial':
      if (stage === 1) {
        return generateSubitizeProblem(undefined, { range: 'perceptual', layout: 'single' });
      } else if (stage === 2) {
        return generateSubitizeProblem(undefined, { range: 'conceptual-single', layout: 'single' });
      } else {
        return generateSubitizeProblem(undefined, { range: 'conceptual-double', layout: 'double' });
      }
    case 'abstract':
      if (stage === 1) {
        return generateNumberBond({ minWhole: 2, maxWhole: 5 });
      } else if (stage === 2) {
        return generateFriendsOfTenBond();
      } else if (stage === 3) {
        return generateTeenBond();
      } else {
        return generateEquation({ maxResult: 20, bridgingTenOnly: true });
      }
  }
}

/**
 * Creates a fully initialized, immutable GameState.
 */
export function createInitialState(options?: {
  mode?: GameMode;
  stage?: StageLevel;
  activeProblem?: ActiveProblem;
  score?: number;
  streak?: number;
  bestStreak?: number;
}): GameState {
  const stage = options?.stage ?? 1;
  const domainProblem = asDomainProblem(options?.activeProblem);
  const mode =
    options?.mode ??
    (domainProblem
      ? domainProblem.type === 'subitize'
        ? 'pictorial'
        : 'abstract'
      : 'concrete');
  const capacity = getStageCapacity(stage);
  const grid = createEmptyGrid(capacity);
  const activeProblem =
    options?.activeProblem !== undefined
      ? options.activeProblem
      : generateProblemForMode(mode, stage);

  return Object.freeze({
    mode,
    stage,
    score: options?.score ?? 0,
    streak: options?.streak ?? 0,
    bestStreak: options?.bestStreak ?? 0,
    grid: Object.isFrozen(grid) ? grid : Object.freeze(grid),
    activeProblem,
    consecutiveErrors: 0,
    scaffoldActive: false,
    isCelebrating: false,
    celebrationMilestone: null,
    lastAnswerFeedback: null,
  });
}

/**
 * Pure, deterministic game state reducer.
 *
 * Guarantees:
 * 1. Zero side effects (no DOM, no storage, no timers).
 * 2. Immutable state transitions (Object.freeze protection).
 * 3. Referential equality preservation on no-op actions.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_COUNTER': {
      const { slotIndex, color } = action;

      // Slot index boundary check
      if (
        typeof slotIndex !== 'number' ||
        !Number.isInteger(slotIndex) ||
        slotIndex < 0 ||
        slotIndex >= state.grid.capacity
      ) {
        return state;
      }

      if (color !== 'red' && color !== 'black') {
        return state;
      }

      // If cell already contains the exact same color, return state unchanged
      if (state.grid.cells[slotIndex] === color) {
        return state;
      }

      let tempGrid = state.grid;
      if (tempGrid.cells[slotIndex] !== 'empty') {
        tempGrid = removeCounter(tempGrid, slotIndex);
      }
      const newGrid = placeCounter(tempGrid, color, slotIndex);

      return Object.freeze({
        ...state,
        grid: newGrid,
      });
    }

    case 'REMOVE_COUNTER': {
      const { slotIndex } = action;

      // Slot index boundary check
      if (
        typeof slotIndex !== 'number' ||
        !Number.isInteger(slotIndex) ||
        slotIndex < 0 ||
        slotIndex >= state.grid.capacity
      ) {
        return state;
      }

      // If cell is already empty, return state unchanged
      if (state.grid.cells[slotIndex] === 'empty') {
        return state;
      }

      const newGrid = removeCounter(state.grid, slotIndex);
      return Object.freeze({
        ...state,
        grid: newGrid,
      });
    }

    case 'MOVE_COUNTER': {
      const { fromIndex, toIndex } = action;
      if (
        typeof fromIndex !== 'number' ||
        !Number.isInteger(fromIndex) ||
        typeof toIndex !== 'number' ||
        !Number.isInteger(toIndex) ||
        fromIndex < 0 ||
        fromIndex >= state.grid.capacity ||
        toIndex < 0 ||
        toIndex >= state.grid.capacity ||
        fromIndex === toIndex
      ) {
        return state;
      }
      const sourceCell = state.grid.cells[fromIndex];
      if (sourceCell === 'empty') {
        return state;
      }
      let tempGrid = removeCounter(state.grid, fromIndex);
      if (tempGrid.cells[toIndex] !== 'empty') {
        tempGrid = removeCounter(tempGrid, toIndex);
      }
      const newGrid = placeCounter(tempGrid, sourceCell, toIndex);
      return Object.freeze({
        ...state,
        grid: newGrid,
      });
    }

    case 'CLEAR_FRAME': {
      // If frame is already empty, return state unchanged
      if (state.grid.totalCount === 0) {
        return state;
      }

      const newGrid = clearGrid(state.grid);
      return Object.freeze({
        ...state,
        grid: newGrid,
      });
    }

    case 'SET_CAPACITY': {
      const { capacity } = action;

      // If capacity is unchanged, return state unchanged
      if (state.grid.capacity === capacity) {
        return state;
      }

      const newGrid = setGridCapacity(state.grid, capacity);
      return Object.freeze({
        ...state,
        grid: newGrid,
      });
    }

    case 'SUBMIT_ANSWER': {
      const isCorrect = evaluateSessionAnswer(state, action.answer);

      if (isCorrect) {
        const newStreak = state.streak + 1;
        const newBestStreak = Math.max(state.bestStreak, newStreak);
        const { points } = calculateScore(PROGRESSION_CONFIG.BASE_SCORE, newStreak, action.bonus);
        const { isCelebrating, milestone } = checkCelebrationTrigger(newStreak);

        return Object.freeze({
          ...state,
          score: state.score + points,
          streak: newStreak,
          bestStreak: newBestStreak,
          consecutiveErrors: 0,
          scaffoldActive: false,
          isCelebrating: isCelebrating || state.isCelebrating,
          celebrationMilestone: milestone ?? state.celebrationMilestone,
          lastAnswerFeedback: 'correct',
        });
      } else {
        const newConsecutiveErrors = state.consecutiveErrors + 1;
        const shouldScaffold = shouldTriggerScaffold(newConsecutiveErrors);

        return Object.freeze({
          ...state,
          streak: 0,
          consecutiveErrors: newConsecutiveErrors,
          scaffoldActive: state.scaffoldActive || shouldScaffold,
          isCelebrating: false,
          celebrationMilestone: null,
          lastAnswerFeedback: 'incorrect',
        });
      }
    }

    case 'NEXT_PROBLEM': {
      const nextProblem =
        action.problem !== undefined
          ? action.problem
          : generateProblemForMode(state.mode, state.stage);

      return Object.freeze({
        ...state,
        activeProblem: nextProblem,
        consecutiveErrors: 0,
        scaffoldActive: false,
        lastAnswerFeedback: null,
        isCelebrating: false,
        celebrationMilestone: null,
      });
    }

    case 'SET_MODE': {
      const { mode, problem } = action;

      // If switching to the exact same mode and no new problem fixture provided,
      // only early-return if no errors or scaffolding need to be reset,
      // and in concrete mode, no activeProblem needs to be cleared.
      if (
        state.mode === mode &&
        problem === undefined &&
        state.consecutiveErrors === 0 &&
        !state.scaffoldActive &&
        (mode !== 'concrete' || state.activeProblem === null)
      ) {
        return state;
      }

      const nextProblem =
        problem !== undefined
          ? problem
          : generateProblemForMode(mode, state.stage);

      return Object.freeze({
        ...state,
        mode,
        activeProblem: nextProblem,
        consecutiveErrors: 0,
        scaffoldActive: false,
        isCelebrating: false,
        celebrationMilestone: null,
        lastAnswerFeedback: null,
      });
    }

    case 'SET_STAGE': {
      const { stage, problem } = action;
      if (stage !== 1 && stage !== 2 && stage !== 3 && stage !== 4) {
        return state;
      }

      // If switching to the exact same stage and no new problem fixture provided
      if (state.stage === stage && problem === undefined) {
        return state;
      }

      const newCapacity = getStageCapacity(stage);
      const newGrid =
        state.grid.capacity === newCapacity
          ? clearGrid(state.grid)
          : createEmptyGrid(newCapacity);

      const nextProblem =
        problem !== undefined
          ? problem
          : generateProblemForMode(state.mode, stage);

      return Object.freeze({
        ...state,
        stage,
        grid: newGrid,
        streak: 0,
        activeProblem: nextProblem,
        consecutiveErrors: 0,
        scaffoldActive: false,
        isCelebrating: false,
        celebrationMilestone: null,
        lastAnswerFeedback: null,
      });
    }

    case 'DISMISS_CELEBRATION': {
      // If already not celebrating, return state unchanged
      if (!state.isCelebrating && state.celebrationMilestone === null) {
        return state;
      }

      return Object.freeze({
        ...state,
        isCelebrating: false,
        celebrationMilestone: null,
      });
    }

    case 'RESET_GAME': {
      return createInitialState(action.initialState);
    }

    default:
      return state;
  }
}
