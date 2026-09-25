export type CounterColor = 'red' | 'black';
export type CellState = CounterColor | 'empty';
export type FrameCapacity = 10 | 20;

export interface TenFrameGrid {
  readonly capacity: FrameCapacity;
  readonly cells: ReadonlyArray<CellState>;
  readonly redCount: number;
  readonly blackCount: number;
  readonly totalCount: number;
}

export type SubitizeLayout = 'single' | 'double';

export interface SubitizeProblem {
  readonly id: string;
  readonly targetCount: number;
  readonly redCount: number;
  readonly blackCount: number;
  readonly options: ReadonlyArray<number>; // Multiple choice answers
  readonly layout: SubitizeLayout;
  readonly grid?: TenFrameGrid;
}

export type NumberBondMissing = 'whole' | 'partA' | 'partB';

export interface NumberBondProblem {
  readonly id: string;
  readonly whole: number;
  readonly partA: number;
  readonly partB: number;
  readonly missing: NumberBondMissing;
  readonly answer: number;
}

export type EquationOperator = '+' | '-';
export type EquationMissing = 'operand1' | 'operand2' | 'result';

export interface EquationProblem {
  readonly id: string;
  readonly operand1: number;
  readonly operator: EquationOperator;
  readonly operand2: number;
  readonly result: number;
  readonly missing: EquationMissing;
  readonly answer: number;
  readonly isBridgingTen?: boolean;
}

export type ComparisonOperator = '<' | '=' | '>';

export interface ComparisonProblem {
  readonly id: string;
  readonly countA: number;
  readonly countB: number;
  readonly correctOperator: ComparisonOperator;
  readonly gridA: TenFrameGrid;
  readonly gridB: TenFrameGrid;
}
