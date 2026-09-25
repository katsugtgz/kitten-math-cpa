import type {
  ActiveProblem,
  GameAction,
  GameState,
  GameMode,
  StageLevel,
} from './types';
import {
  calculateScore,
  checkCelebrationTrigger,
  evaluateAnswer,
  getStageCapacity,
  shouldTriggerScaffold,
} from './progression';
import {
  clearGrid,
  createEmptyGrid,
  placeCounter,
  removeCounter,
  setGridCapacity,
} from '../domain/ten-frame';
import { generateSubitizeProblem } from '../domain/subitize';
import { generateFriendsOfTenBond, generateNumberBond, generateTeenBond } from '../domain/number-bond';
import { generateEquation } from '../domain/equation';

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
  const mode =
    options?.mode ??
    (options?.activeProblem
      ? 'targetCount' in options.activeProblem
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
      // Evaluate correctness against activeProblem, or against grid totalCount in concrete mode
      const isCorrect =
        evaluateAnswer(state.activeProblem, action.answer) ||
        (state.activeProblem === null &&
          state.mode === 'concrete' &&
          action.answer === state.grid.totalCount);

      if (isCorrect) {
        const newStreak = state.streak + 1;
        const newBestStreak = Math.max(state.bestStreak, newStreak);
        const bonus = action.bonus ?? 0;
        const { points } = calculateScore(100, newStreak, bonus);
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
