import type {
  CounterColor,
  FrameCapacity,
  TenFrameGrid,
  SubitizeProblem,
  NumberBondProblem,
  EquationProblem,
} from '../domain/types';

export type {
  CounterColor,
  FrameCapacity,
  TenFrameGrid,
  SubitizeProblem,
  NumberBondProblem,
  EquationProblem,
};

/**
 * Concrete-Pictorial-Abstract (CPA) pedagogical modes
 * - 'concrete': Physical manipulative ten-frame with draggable/clickable counters
 * - 'pictorial': Illustrated kitten ten-frame flash cards for subitizing
 * - 'abstract': Symbolic Singapore number bonds and arithmetic equations
 */
export type GameMode = 'concrete' | 'pictorial' | 'abstract';

/**
 * Four progressive curriculum stages
 * - Stage 1: Foundations 1-5 (Single ten-frame, numbers 1-5, bonds within 5)
 * - Stage 2: Friends of 10, 6-10 (Single ten-frame, 5-anchored filling, bonds to 10)
 * - Stage 3: Teen Numbers 11-19 (Double ten-frame, canonical place-value 10 + N)
 * - Stage 4: Mastery up to 20 & Bridging 10 (Make-10 decomposition and bridging equations)
 */
export type StageLevel = 1 | 2 | 3 | 4;

/**
 * Union of all active challenge problems
 */
export type ActiveProblem =
  | SubitizeProblem
  | NumberBondProblem
  | EquationProblem
  | null;

/**
 * Celebration milestones triggered on consecutive streak counts
 */
export type CelebrationMilestone = 3 | 5 | 10;

/**
 * Immediate visual feedback state for answer validation
 */
export type AnswerFeedback = 'correct' | 'incorrect' | null;

/**
 * Immutable root game state tree
 */
export interface GameState {
  /** Current CPA pedagogical mode */
  readonly mode: GameMode;
  /** Current curriculum stage (1 to 4) */
  readonly stage: StageLevel;
  /** Accumulated user score */
  readonly score: number;
  /** Current consecutive correct answers */
  readonly streak: number;
  /** All-time highest streak achieved in this session */
  readonly bestStreak: number;
  /** Ten-frame manipulative grid (capacity 10 or 20) */
  readonly grid: TenFrameGrid;
  /** Active mathematical problem (null in free concrete exploration) */
  readonly activeProblem: ActiveProblem;
  /** Count of consecutive mistakes on the current challenge */
  readonly consecutiveErrors: number;
  /** Whether the visual ten-frame scaffold hint is actively displayed */
  readonly scaffoldActive: boolean;
  /** Whether a victory celebration modal/animation is currently active */
  readonly isCelebrating: boolean;
  /** Specific streak milestone triggering the celebration (3, 5, 10, or null) */
  readonly celebrationMilestone: CelebrationMilestone | null;
  /** Immediate feedback state for the last submitted answer */
  readonly lastAnswerFeedback: AnswerFeedback;
}

/**
 * Discriminated union of all supported game actions
 */
export type GameAction =
  | { type: 'PLACE_COUNTER'; slotIndex: number; color: CounterColor }
  | { type: 'REMOVE_COUNTER'; slotIndex: number }
  | { type: 'MOVE_COUNTER'; fromIndex: number; toIndex: number }
  | { type: 'CLEAR_FRAME' }
  | { type: 'SET_CAPACITY'; capacity: FrameCapacity }
  | { type: 'SUBMIT_ANSWER'; answer: number; bonus?: number }
  | { type: 'NEXT_PROBLEM'; problem?: ActiveProblem }
  | { type: 'SET_MODE'; mode: GameMode; problem?: ActiveProblem }
  | { type: 'SET_STAGE'; stage: StageLevel; problem?: ActiveProblem }
  | { type: 'DISMISS_CELEBRATION' }
  | { type: 'RESET_GAME'; initialState?: Partial<GameState> };
