import { describe, expect, it } from 'vitest';
import {
  clearFrame,
  createEmptyFrame,
  createPopulatedFrame,
  createTeenDecomposition,
  decomposeTeen,
  getFrameRows,
  placeCounter,
  removeCounter,
  removeLastCounter,
  setFrameCapacity,
} from '../ten-frame';

describe('ten-frame domain model', () => {
  describe('createEmptyFrame', () => {
    it('creates an empty 10-frame by default', () => {
      const grid = createEmptyFrame();
      expect(grid.capacity).toBe(10);
      expect(grid.cells.length).toBe(10);
      expect(grid.cells.every((c) => c === 'empty')).toBe(true);
      expect(grid.redCount).toBe(0);
      expect(grid.blackCount).toBe(0);
      expect(grid.totalCount).toBe(0);
    });

    it('creates an empty 20-frame', () => {
      const grid = createEmptyFrame(20);
      expect(grid.capacity).toBe(20);
      expect(grid.cells.length).toBe(20);
      expect(grid.totalCount).toBe(0);
    });
  });

  describe('placeCounter with 5-wise filling rule', () => {
    it('places counters sequentially into row 0 then row 1', () => {
      let grid = createEmptyFrame(10);
      for (let i = 0; i < 5; i++) {
        grid = placeCounter(grid, 'red');
        expect(grid.cells[i]).toBe('red');
        expect(grid.redCount).toBe(i + 1);
        expect(grid.totalCount).toBe(i + 1);
      }
      // 6th counter should go to row 1 (slot 5)
      grid = placeCounter(grid, 'black');
      expect(grid.cells[5]).toBe('black');
      expect(grid.blackCount).toBe(1);
      expect(grid.totalCount).toBe(6);
    });

    it('allows targeted slot placement when empty', () => {
      const grid = createEmptyFrame(10);
      const updated = placeCounter(grid, 'red', 4);
      expect(updated.cells[4]).toBe('red');
      expect(updated.redCount).toBe(1);
    });

    it('rejects placement on an occupied slot', () => {
      let grid = createEmptyFrame(10);
      grid = placeCounter(grid, 'red', 3);
      const rejected = placeCounter(grid, 'black', 3);
      expect(rejected).toBe(grid);
      expect(rejected.cells[3]).toBe('red');
      expect(rejected.blackCount).toBe(0);
    });

    it('rejects placement when frame is full', () => {
      const grid = createPopulatedFrame(10, 10, 0);
      const rejected = placeCounter(grid, 'red');
      expect(rejected).toBe(grid);
      expect(rejected.totalCount).toBe(10);
    });

    it('rejects placement out of bounds', () => {
      const grid = createEmptyFrame(10);
      expect(placeCounter(grid, 'red', -1)).toBe(grid);
      expect(placeCounter(grid, 'red', 10)).toBe(grid);
    });
  });

  describe('removeCounter and removeLastCounter', () => {
    it('removes a counter from an occupied slot', () => {
      let grid = createEmptyFrame(10);
      grid = placeCounter(grid, 'red', 2);
      const removed = removeCounter(grid, 2);
      expect(removed.cells[2]).toBe('empty');
      expect(removed.redCount).toBe(0);
      expect(removed.totalCount).toBe(0);
    });

    it('returns original grid when removing from an empty slot or out of bounds', () => {
      const grid = createEmptyFrame(10);
      expect(removeCounter(grid, 0)).toBe(grid);
      expect(removeCounter(grid, -1)).toBe(grid);
      expect(removeCounter(grid, 15)).toBe(grid);
    });

    it('removes the last occupied counter', () => {
      let grid = createEmptyFrame(10);
      grid = placeCounter(grid, 'red');
      grid = placeCounter(grid, 'black');
      grid = placeCounter(grid, 'red');
      expect(grid.totalCount).toBe(3);
      grid = removeLastCounter(grid);
      expect(grid.totalCount).toBe(2);
      expect(grid.cells[2]).toBe('empty');
    });

    it('removeLastCounter does nothing on empty frame', () => {
      const grid = createEmptyFrame(10);
      expect(removeLastCounter(grid)).toBe(grid);
    });
  });

  describe('clearFrame & capacity transitions', () => {
    it('clears all counters and preserves capacity', () => {
      const grid = createPopulatedFrame(20, 10, 5);
      const cleared = clearFrame(grid);
      expect(cleared.capacity).toBe(20);
      expect(cleared.totalCount).toBe(0);
      expect(cleared.cells.every((c) => c === 'empty')).toBe(true);
    });

    it('resizes from 10 to 20 without losing counters', () => {
      const grid = createPopulatedFrame(10, 4, 2);
      const expanded = setFrameCapacity(grid, 20);
      expect(expanded.capacity).toBe(20);
      expect(expanded.cells.length).toBe(20);
      expect(expanded.redCount).toBe(4);
      expect(expanded.blackCount).toBe(2);
      expect(expanded.cells.slice(10, 20).every((c) => c === 'empty')).toBe(true);
    });

    it('resizes from 20 to 10 by truncating second frame', () => {
      const grid = createPopulatedFrame(20, 8, 4);
      const shrunk = setFrameCapacity(grid, 10);
      expect(shrunk.capacity).toBe(10);
      expect(shrunk.cells.length).toBe(10);
      expect(shrunk.totalCount).toBe(10);
    });

    it('returns same grid when capacity unchanged', () => {
      const grid = createEmptyFrame(10);
      expect(setFrameCapacity(grid, 10)).toBe(grid);
    });
  });

  describe('teen place-value decomposition (10 + N)', () => {
    it('creates canonical 10 + N representation', () => {
      const grid = createTeenDecomposition(14, 'black', 'red');
      expect(grid.capacity).toBe(20);
      expect(grid.totalCount).toBe(14);
      expect(grid.blackCount).toBe(10);
      expect(grid.redCount).toBe(4);
      // Frame 1 (0..9) is all black
      expect(grid.cells.slice(0, 10).every((c) => c === 'black')).toBe(true);
      // Frame 2 (10..13) is red, (14..19) is empty
      expect(grid.cells.slice(10, 14).every((c) => c === 'red')).toBe(true);
      expect(grid.cells.slice(14, 20).every((c) => c === 'empty')).toBe(true);
    });

    it('decomposes teen grid accurately', () => {
      const grid = createTeenDecomposition(16);
      const decomposed = decomposeTeen(grid);
      expect(decomposed.tens).toBe(10);
      expect(decomposed.ones).toBe(6);
      expect(decomposed.isValidTeen).toBe(true);
    });

    it('decomposeTeen handles non-20 grid safely', () => {
      const grid = createEmptyFrame(10);
      expect(decomposeTeen(grid).isValidTeen).toBe(false);
    });
  });

  describe('getFrameRows', () => {
    it('slices capacity 10 into 2 rows of 5', () => {
      const grid = createPopulatedFrame(10, 5, 2);
      const rows = getFrameRows(grid);
      expect(rows.length).toBe(2);
      expect(rows[0].length).toBe(5);
      expect(rows[1].length).toBe(5);
    });

    it('slices capacity 20 into 4 rows of 5', () => {
      const grid = createEmptyFrame(20);
      const rows = getFrameRows(grid);
      expect(rows.length).toBe(4);
    });
  });
});
