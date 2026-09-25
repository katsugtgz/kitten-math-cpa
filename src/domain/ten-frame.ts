import { CellState, CounterColor, FrameCapacity, TenFrameGrid } from './types';

/**
 * Creates an empty TenFrameGrid with the specified capacity.
 */
export function createEmptyFrame(capacity: FrameCapacity = 10): TenFrameGrid {
  const cells: CellState[] = Array(capacity).fill('empty');
  return Object.freeze({
    capacity,
    cells: Object.freeze(cells),
    redCount: 0,
    blackCount: 0,
    totalCount: 0,
  });
}

/**
 * Alias for createEmptyFrame.
 */
export const createEmptyGrid = createEmptyFrame;

/**
 * Places a counter on the ten-frame grid immutably.
 * Supports both signatures:
 *   placeCounter(grid, color, slotIndex?)
 *   placeCounter(grid, slotIndex, color)
 *
 * If slotIndex is omitted, follows the Singapore Math 5-wise filling rule:
 * filling left-to-right on row 0 (slots 0..4), then row 1 (slots 5..9), etc.
 */
export function placeCounter(
  grid: TenFrameGrid,
  color: CounterColor,
  slotIndex?: number
): TenFrameGrid;
export function placeCounter(
  grid: TenFrameGrid,
  slotIndex: number,
  color: CounterColor
): TenFrameGrid;
export function placeCounter(
  grid: TenFrameGrid,
  arg1: CounterColor | number,
  arg2?: CounterColor | number
): TenFrameGrid {
  let color: CounterColor;
  let slotIndex: number | undefined;

  if (typeof arg1 === 'number') {
    slotIndex = arg1;
    color = arg2 as CounterColor;
  } else {
    color = arg1;
    if (arg2 !== undefined) {
      if (typeof arg2 !== 'number') {
        return grid;
      }
      slotIndex = arg2;
    }
  }

  if (color !== 'red' && color !== 'black') {
    return grid;
  }

  let targetIndex: number;

  if (slotIndex !== undefined) {
    if (
      typeof slotIndex !== 'number' ||
      !Number.isInteger(slotIndex) ||
      slotIndex < 0 ||
      slotIndex >= grid.capacity
    ) {
      return grid; // Out of bounds or non-integer: reject
    }
    if (grid.cells[slotIndex] !== 'empty') {
      return grid; // Slot occupied: reject
    }
    targetIndex = slotIndex;
  } else {
    // 5-wise search for the first empty cell
    const emptyIndex = grid.cells.findIndex((cell) => cell === 'empty');
    if (emptyIndex === -1) {
      return grid; // Frame is full: reject
    }
    targetIndex = emptyIndex;
  }

  const newCells = [...grid.cells];
  newCells[targetIndex] = color;

  const redCount = color === 'red' ? grid.redCount + 1 : grid.redCount;
  const blackCount = color === 'black' ? grid.blackCount + 1 : grid.blackCount;

  return Object.freeze({
    capacity: grid.capacity,
    cells: Object.freeze(newCells),
    redCount,
    blackCount,
    totalCount: grid.totalCount + 1,
  });
}

/**
 * Removes a counter from a specific slot index immutably.
 */
export function removeCounter(grid: TenFrameGrid, slotIndex: number): TenFrameGrid {
  if (
    typeof slotIndex !== 'number' ||
    !Number.isInteger(slotIndex) ||
    slotIndex < 0 ||
    slotIndex >= grid.capacity
  ) {
    return grid;
  }
  const currentColor = grid.cells[slotIndex];
  if (currentColor === 'empty') {
    return grid; // Nothing to remove
  }

  const newCells = [...grid.cells];
  newCells[slotIndex] = 'empty';

  const redCount = currentColor === 'red' ? grid.redCount - 1 : grid.redCount;
  const blackCount = currentColor === 'black' ? grid.blackCount - 1 : grid.blackCount;

  return Object.freeze({
    capacity: grid.capacity,
    cells: Object.freeze(newCells),
    redCount,
    blackCount,
    totalCount: grid.totalCount - 1,
  });
}

/**
 * Removes the last occupied counter following reverse 5-wise order.
 */
export function removeLastCounter(grid: TenFrameGrid): TenFrameGrid {
  for (let i = grid.capacity - 1; i >= 0; i--) {
    if (grid.cells[i] !== 'empty') {
      return removeCounter(grid, i);
    }
  }
  return grid;
}

/**
 * Clears all counters from the frame.
 */
export function clearFrame(grid: TenFrameGrid): TenFrameGrid {
  return createEmptyFrame(grid.capacity);
}

/**
 * Alias for clearFrame.
 */
export const clearGrid = clearFrame;

/**
 * Changes frame capacity between 10 and 20.
 */
export function setFrameCapacity(
  grid: TenFrameGrid,
  newCapacity: FrameCapacity
): TenFrameGrid {
  if (grid.capacity === newCapacity) {
    return grid;
  }

  if (newCapacity === 20) {
    // Expand from 10 to 20
    const newCells: CellState[] = [
      ...grid.cells,
      ...Array(10).fill('empty' as CellState),
    ];
    return Object.freeze({
      capacity: 20,
      cells: Object.freeze(newCells),
      redCount: grid.redCount,
      blackCount: grid.blackCount,
      totalCount: grid.totalCount,
    });
  } else {
    // Shrink from 20 to 10
    const newCells = grid.cells.slice(0, 10);
    const redCount = newCells.filter((c) => c === 'red').length;
    const blackCount = newCells.filter((c) => c === 'black').length;
    return Object.freeze({
      capacity: 10,
      cells: Object.freeze(newCells),
      redCount,
      blackCount,
      totalCount: redCount + blackCount,
    });
  }
}

/**
 * Alias for setFrameCapacity.
 */
export const setGridCapacity = setFrameCapacity;

/**
 * Populates a frame with a given number of red and black counters using 5-wise filling.
 */
export function createPopulatedFrame(
  capacity: FrameCapacity,
  redCount: number,
  blackCount: number = 0
): TenFrameGrid {
  const safeRed = Math.max(0, redCount);
  const safeBlack = Math.max(0, blackCount);
  const total = Math.min(capacity, safeRed + safeBlack);

  const actualRed = Math.min(safeRed, total);
  const actualBlack = Math.min(safeBlack, total - actualRed);

  const cells: CellState[] = Array(capacity).fill('empty');
  for (let i = 0; i < actualRed; i++) {
    cells[i] = 'red';
  }
  for (let i = actualRed; i < actualRed + actualBlack; i++) {
    cells[i] = 'black';
  }

  return Object.freeze({
    capacity,
    cells: Object.freeze(cells),
    redCount: actualRed,
    blackCount: actualBlack,
    totalCount: actualRed + actualBlack,
  });
}

/**
 * Creates canonical teen place-value decomposition (10 + N).
 * Frame 1 (indices 0..9) has 10 counters of frame1Color (default 'black').
 * Frame 2 (indices 10..19) has N counters of frame2Color (default 'red').
 */
export function createTeenDecomposition(
  total: number,
  frame1Color: CounterColor = 'black',
  frame2Color: CounterColor = 'red'
): TenFrameGrid {
  const clampedTotal = Math.max(10, Math.min(20, Math.round(total)));
  const ones = clampedTotal - 10;

  const cells: CellState[] = Array(20).fill('empty');
  for (let i = 0; i < 10; i++) {
    cells[i] = frame1Color;
  }
  for (let i = 10; i < 10 + ones; i++) {
    cells[i] = frame2Color;
  }

  const redCount =
    (frame1Color === 'red' ? 10 : 0) + (frame2Color === 'red' ? ones : 0);
  const blackCount =
    (frame1Color === 'black' ? 10 : 0) + (frame2Color === 'black' ? ones : 0);

  return Object.freeze({
    capacity: 20,
    cells: Object.freeze(cells),
    redCount,
    blackCount,
    totalCount: clampedTotal,
  });
}

/**
 * Decomposes a double ten-frame grid into tens and ones.
 */
export function decomposeTeen(grid: TenFrameGrid): {
  tens: number;
  ones: number;
  isValidTeen: boolean;
} {
  if (grid.capacity !== 20) {
    return { tens: 0, ones: 0, isValidTeen: false };
  }
  const tens = grid.cells.slice(0, 10).filter((c) => c !== 'empty').length;
  const ones = grid.cells.slice(10, 20).filter((c) => c !== 'empty').length;
  const isValidTeen = tens === 10 && ones >= 0 && ones <= 10;
  return { tens, ones, isValidTeen };
}

/**
 * Slices the grid cells into rows of 5 for presentation rendering.
 * Capacity 10 returns 2 rows; Capacity 20 returns 4 rows.
 */
export function getFrameRows(
  grid: TenFrameGrid
): ReadonlyArray<ReadonlyArray<CellState>> {
  const rows: CellState[][] = [];
  for (let i = 0; i < grid.capacity; i += 5) {
    rows.push(grid.cells.slice(i, i + 5));
  }
  return Object.freeze(rows.map((r) => Object.freeze(r)));
}
