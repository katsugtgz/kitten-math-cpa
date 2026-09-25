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
import {
  generateFriendsOfTenBond,
  generateNumberBond,
  generateTeenBond,
  validateNumberBondAnswer,
} from '../number-bond';
import {
  generateBridgingTenAddition,
  generateBridgingTenSubtraction,
  generateEquation,
  generateTeenAddition,
  validateEquationAnswer,
} from '../equation';
import {
  generateConceptualProblem,
  generatePerceptualProblem,
  generateSubitizeProblem,
  validateSubitizeAnswer,
} from '../subitize';
import { CounterColor } from '../types';

describe('Domain Adversarial Stress Suite', () => {
  describe('Challenge 1: Capacity Limits & Boundary Slot Indices', () => {
    it('strictly rejects unindexed counter placement on full 10-frame (10/10)', () => {
      let grid = createEmptyFrame(10);
      for (let i = 0; i < 10; i++) {
        grid = placeCounter(grid, i % 2 === 0 ? 'red' : 'black');
      }
      expect(grid.totalCount).toBe(10);

      // Attempt 11th placement
      const overflow = placeCounter(grid, 'red');
      expect(overflow).toBe(grid);
      expect(overflow.totalCount).toBe(10);
      expect(overflow.redCount).toBe(5);
      expect(overflow.blackCount).toBe(5);
    });

    it('strictly rejects indexed counter placement into any occupied slot on full 10-frame', () => {
      let grid = createEmptyFrame(10);
      for (let i = 0; i < 10; i++) {
        grid = placeCounter(grid, 'red');
      }
      for (let slot = 0; slot < 10; slot++) {
        const rejectedRed = placeCounter(grid, 'red', slot);
        const rejectedBlack = placeCounter(grid, 'black', slot);
        expect(rejectedRed).toBe(grid);
        expect(rejectedBlack).toBe(grid);
      }
    });

    it('strictly rejects unindexed counter placement on full 20-frame (20/20)', () => {
      let grid = createEmptyFrame(20);
      for (let i = 0; i < 20; i++) {
        grid = placeCounter(grid, i < 10 ? 'black' : 'red');
      }
      expect(grid.totalCount).toBe(20);

      // Attempt 21st placement
      const overflow = placeCounter(grid, 'black');
      expect(overflow).toBe(grid);
      expect(overflow.totalCount).toBe(20);
    });

    it('strictly rejects indexed counter placement on full 20-frame for all slots 0..19', () => {
      let grid = createEmptyFrame(20);
      for (let i = 0; i < 20; i++) {
        grid = placeCounter(grid, 'black');
      }
      for (let slot = 0; slot < 20; slot++) {
        expect(placeCounter(grid, 'red', slot)).toBe(grid);
      }
    });

    it('strictly rejects out-of-bounds slot indices (-1, 10, 20, 999, -999)', () => {
      const grid10 = createEmptyFrame(10);
      expect(placeCounter(grid10, 'red', -1)).toBe(grid10);
      expect(placeCounter(grid10, 'red', 10)).toBe(grid10);
      expect(placeCounter(grid10, 'red', 20)).toBe(grid10);
      expect(placeCounter(grid10, 'red', 999)).toBe(grid10);
      expect(placeCounter(grid10, 'red', -999)).toBe(grid10);

      const grid20 = createEmptyFrame(20);
      expect(placeCounter(grid20, 'black', -1)).toBe(grid20);
      expect(placeCounter(grid20, 'black', 20)).toBe(grid20);
      expect(placeCounter(grid20, 'black', 999)).toBe(grid20);
    });

    it('strictly rejects double-placing into already occupied slots (both colors)', () => {
      let grid = createEmptyFrame(10);
      grid = placeCounter(grid, 'red', 4);
      expect(grid.cells[4]).toBe('red');

      // Attempt double place with red
      const sameColor = placeCounter(grid, 'red', 4);
      expect(sameColor).toBe(grid);

      // Attempt double place with black
      const diffColor = placeCounter(grid, 'black', 4);
      expect(diffColor).toBe(grid);
      expect(grid.cells[4]).toBe('red');
      expect(grid.redCount).toBe(1);
      expect(grid.blackCount).toBe(0);
    });

    it('handles removal boundary cases without state mutation or negative counts', () => {
      const empty10 = createEmptyFrame(10);
      expect(removeCounter(empty10, 0)).toBe(empty10);
      expect(removeCounter(empty10, -1)).toBe(empty10);
      expect(removeCounter(empty10, 10)).toBe(empty10);
      expect(removeCounter(empty10, 999)).toBe(empty10);
      expect(removeLastCounter(empty10)).toBe(empty10);

      // Ensure counts remain 0
      expect(empty10.totalCount).toBe(0);
      expect(empty10.redCount).toBe(0);
      expect(empty10.blackCount).toBe(0);
    });
  });

  describe('Challenge 2: Singapore 5-Wise Filling Rule Invariants', () => {
    it('strictly satisfies 5-wise filling rule for arbitrary 10-counter sequences on 10-frame', () => {
      const colors: CounterColor[] = [
        'red', 'black', 'red', 'red', 'black',
        'black', 'red', 'black', 'red', 'black',
      ];

      for (let trial = 0; trial < 50; trial++) {
        let grid = createEmptyFrame(10);
        // Shuffle colors for stress testing
        const shuffled = [...colors].sort(() => Math.random() - 0.5);

        for (let step = 0; step < 10; step++) {
          const color = shuffled[step];
          grid = placeCounter(grid, color);

          const expectedIndex = step;
          expect(grid.cells[expectedIndex]).toBe(color);
          expect(grid.totalCount).toBe(step + 1);

          // All indices before step must be occupied
          for (let prev = 0; prev <= step; prev++) {
            expect(grid.cells[prev]).not.toBe('empty');
          }
          // All indices after step must be empty
          for (let fut = step + 1; fut < 10; fut++) {
            expect(grid.cells[fut]).toBe('empty');
          }

          // Top row (0..4) vs Bottom row (5..9) invariant
          if (step < 5) {
            // Row 0 has step + 1 counters, Row 1 has exactly 0
            const row0 = grid.cells.slice(0, 5);
            const row1 = grid.cells.slice(5, 10);
            expect(row0.filter((c) => c !== 'empty').length).toBe(step + 1);
            expect(row1.every((c) => c === 'empty')).toBe(true);
          } else {
            // Row 0 is completely full (5 counters)
            const row0 = grid.cells.slice(0, 5);
            const row1 = grid.cells.slice(5, 10);
            expect(row0.every((c) => c !== 'empty')).toBe(true);
            expect(row1.filter((c) => c !== 'empty').length).toBe(step - 4);
          }
        }
      }
    });

    it('strictly satisfies 5-wise filling rule for 20-counter sequences across 4 rows', () => {
      for (let trial = 0; trial < 20; trial++) {
        let grid = createEmptyFrame(20);
        for (let step = 0; step < 20; step++) {
          const color: CounterColor = step < 10 ? 'black' : 'red';
          grid = placeCounter(grid, color);

          const rows = getFrameRows(grid);
          expect(rows.length).toBe(4);

          // Verify row filling invariant: row r is only filled after row r-1 is full
          const expectedRow = Math.floor(step / 5);
          for (let r = 0; r < 4; r++) {
            const countInRow = rows[r].filter((c) => c !== 'empty').length;
            if (r < expectedRow) {
              expect(countInRow).toBe(5);
            } else if (r === expectedRow) {
              expect(countInRow).toBe((step % 5) + 1);
            } else {
              expect(countInRow).toBe(0);
            }
          }
        }
      }
    });

    it('refills the earliest vacated slot in 5-wise order after intermediate removal', () => {
      let grid = createEmptyFrame(10);
      for (let i = 0; i < 7; i++) {
        grid = placeCounter(grid, 'red');
      }
      expect(grid.totalCount).toBe(7);

      // Remove slot 2 (in row 0)
      grid = removeCounter(grid, 2);
      expect(grid.totalCount).toBe(6);
      expect(grid.cells[2]).toBe('empty');

      // Unindexed placement must fill slot 2 first (benchmark of 5 invariant)
      grid = placeCounter(grid, 'black');
      expect(grid.cells[2]).toBe('black');
      expect(grid.cells.slice(0, 5).every((c) => c !== 'empty')).toBe(true);
      expect(grid.totalCount).toBe(7);

      // Next unindexed placement must fill slot 7
      grid = placeCounter(grid, 'black');
      expect(grid.cells[7]).toBe('black');
      expect(grid.totalCount).toBe(8);
    });
  });

  describe('Challenge 3: Singapore Number Bond Invariants (500+ generated bonds)', () => {
    it('strictly satisfies W = PartA + PartB across 500 generated bonds of all configurations', () => {
      let testedCount = 0;

      // 1. Default bonds (2..10)
      for (let i = 0; i < 100; i++) {
        const bond = generateNumberBond({ minWhole: 2, maxWhole: 10 });
        expect(bond.whole).toBe(bond.partA + bond.partB);
        expect(bond.whole).toBeGreaterThanOrEqual(2);
        expect(bond.whole).toBeLessThanOrEqual(10);
        expect(bond.partA).toBeGreaterThanOrEqual(1);
        expect(bond.partB).toBeGreaterThanOrEqual(1);
        expect(validateNumberBondAnswer(bond, bond.answer)).toBe(true);
        expect(validateNumberBondAnswer(bond, bond.answer + 100)).toBe(false);
        testedCount++;
      }

      // 2. Double-frame bonds (2..20)
      for (let i = 0; i < 100; i++) {
        const bond = generateNumberBond({ minWhole: 2, maxWhole: 20 });
        expect(bond.whole).toBe(bond.partA + bond.partB);
        expect(bond.whole).toBeGreaterThanOrEqual(2);
        expect(bond.whole).toBeLessThanOrEqual(20);
        expect(bond.partA).toBeGreaterThanOrEqual(1);
        expect(bond.partB).toBeGreaterThanOrEqual(1);
        expect(validateNumberBondAnswer(bond, bond.answer)).toBe(true);
        testedCount++;
      }

      // 3. Boundary whole = 2 (minimal possible whole)
      for (let i = 0; i < 50; i++) {
        const bondNoZero = generateNumberBond({ minWhole: 2, maxWhole: 2, allowZero: false });
        expect(bondNoZero.whole).toBe(2);
        expect(bondNoZero.partA).toBe(1);
        expect(bondNoZero.partB).toBe(1);
        expect(bondNoZero.whole).toBe(bondNoZero.partA + bondNoZero.partB);

        const bondWithZero = generateNumberBond({ minWhole: 2, maxWhole: 2, allowZero: true });
        expect(bondWithZero.whole).toBe(2);
        expect(bondWithZero.whole).toBe(bondWithZero.partA + bondWithZero.partB);
        expect(bondWithZero.partA).toBeGreaterThanOrEqual(0);
        expect(bondWithZero.partB).toBeGreaterThanOrEqual(0);
        testedCount += 2;
      }

      // 4. Boundary whole = 10 (Friends of 10)
      for (let i = 0; i < 50; i++) {
        const bond = generateFriendsOfTenBond();
        expect(bond.whole).toBe(10);
        expect(bond.partA + bond.partB).toBe(10);
        expect(bond.partA).toBeGreaterThanOrEqual(1);
        expect(bond.partB).toBeGreaterThanOrEqual(1);
        expect(bond.partA).toBeLessThanOrEqual(9);
        expect(bond.partB).toBeLessThanOrEqual(9);
        testedCount++;
      }

      // 5. Boundary whole = 20 (maximal frame capacity)
      for (let i = 0; i < 50; i++) {
        const bond = generateNumberBond({ minWhole: 20, maxWhole: 20, allowZero: false });
        expect(bond.whole).toBe(20);
        expect(bond.partA + bond.partB).toBe(20);
        expect(bond.partA).toBeGreaterThanOrEqual(1);
        expect(bond.partB).toBeGreaterThanOrEqual(1);
        testedCount++;
      }

      // 6. Zero partitions (allowZero: true)
      for (let i = 0; i < 50; i++) {
        const bond = generateNumberBond({ minWhole: 3, maxWhole: 15, allowZero: true });
        expect(bond.whole).toBe(bond.partA + bond.partB);
        expect(bond.partA).toBeGreaterThanOrEqual(0);
        expect(bond.partB).toBeGreaterThanOrEqual(0);
        testedCount++;
      }

      // 7. Canonical teen bonds (11..19)
      for (let i = 0; i < 50; i++) {
        const bond = generateTeenBond();
        expect(bond.whole).toBeGreaterThanOrEqual(11);
        expect(bond.whole).toBeLessThanOrEqual(19);
        expect(bond.partA).toBe(10);
        expect(bond.partB).toBe(bond.whole - 10);
        expect(bond.whole).toBe(bond.partA + bond.partB);
        testedCount++;
      }

      // 8. Missing slot permutations
      const slots: Array<'whole' | 'partA' | 'partB'> = ['whole', 'partA', 'partB'];
      for (const missingSlot of slots) {
        for (let i = 0; i < 20; i++) {
          const bond = generateNumberBond({ missing: missingSlot });
          expect(bond.missing).toBe(missingSlot);
          if (missingSlot === 'whole') expect(bond.answer).toBe(bond.whole);
          if (missingSlot === 'partA') expect(bond.answer).toBe(bond.partA);
          if (missingSlot === 'partB') expect(bond.answer).toBe(bond.partB);
          testedCount++;
        }
      }

      expect(testedCount).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Challenge 4: Equation Generator Invariants (500+ generated equations)', () => {
    it('strictly satisfies no negatives, results <= 20, and correct bridging flags across 500+ equations', () => {
      let testedCount = 0;

      // 1. Addition equations (maxResult 10 and 20)
      for (let i = 0; i < 100; i++) {
        const maxResult = i % 2 === 0 ? 10 : 20;
        const eq = generateEquation({ operator: '+', maxResult });
        expect(eq.operand1).toBeGreaterThanOrEqual(1);
        expect(eq.operand2).toBeGreaterThanOrEqual(1);
        expect(eq.result).toBeGreaterThanOrEqual(2);
        expect(eq.result).toBeLessThanOrEqual(maxResult);
        expect(eq.operand1 + eq.operand2).toBe(eq.result);
        expect(validateEquationAnswer(eq, eq.answer)).toBe(true);

        // Bridging flag check
        const shouldBridge = eq.operand1 < 10 && eq.operand2 < 10 && eq.result > 10;
        expect(eq.isBridgingTen).toBe(shouldBridge);
        testedCount++;
      }

      // 2. Subtraction equations (maxResult 10 and 20)
      for (let i = 0; i < 100; i++) {
        const maxResult = i % 2 === 0 ? 10 : 20;
        const eq = generateEquation({ operator: '-', maxResult });
        expect(eq.operand1).toBeGreaterThanOrEqual(eq.operand2);
        expect(eq.operand2).toBeGreaterThanOrEqual(1);
        expect(eq.result).toBeGreaterThanOrEqual(1);
        expect(eq.result).toBeLessThanOrEqual(maxResult);
        expect(eq.operand1 - eq.operand2).toBe(eq.result);
        expect(validateEquationAnswer(eq, eq.answer)).toBe(true);

        // Bridging flag check
        const shouldBridge = eq.operand1 > 10 && eq.result < 10;
        expect(eq.isBridgingTen).toBe(shouldBridge);
        testedCount++;
      }

      // 3. Bridging-10 Addition generator
      for (let i = 0; i < 100; i++) {
        const eq = generateBridgingTenAddition();
        expect(eq.operator).toBe('+');
        expect(eq.operand1).toBeGreaterThanOrEqual(2);
        expect(eq.operand1).toBeLessThanOrEqual(9);
        expect(eq.operand2).toBeGreaterThanOrEqual(2);
        expect(eq.operand2).toBeLessThanOrEqual(9);
        expect(eq.result).toBeGreaterThan(10);
        expect(eq.result).toBeLessThanOrEqual(18);
        expect(eq.operand1 + eq.operand2).toBe(eq.result);
        expect(eq.isBridgingTen).toBe(true);
        expect(validateEquationAnswer(eq, eq.answer)).toBe(true);
        testedCount++;
      }

      // 4. Bridging-10 Subtraction generator
      for (let i = 0; i < 100; i++) {
        const eq = generateBridgingTenSubtraction();
        expect(eq.operator).toBe('-');
        expect(eq.operand1).toBeGreaterThan(10);
        expect(eq.operand1).toBeLessThanOrEqual(18);
        expect(eq.operand2).toBeGreaterThanOrEqual(2);
        expect(eq.operand2).toBeLessThanOrEqual(9);
        expect(eq.result).toBeGreaterThanOrEqual(2);
        expect(eq.result).toBeLessThan(10);
        expect(eq.operand1 - eq.operand2).toBe(eq.result);
        expect(eq.isBridgingTen).toBe(true);
        expect(validateEquationAnswer(eq, eq.answer)).toBe(true);
        testedCount++;
      }

      // 5. Teen Addition generator (10 + N = 1N)
      for (let i = 0; i < 50; i++) {
        const eq = generateTeenAddition();
        expect(eq.operand1).toBe(10);
        expect(eq.operator).toBe('+');
        expect(eq.operand2).toBeGreaterThanOrEqual(1);
        expect(eq.operand2).toBeLessThanOrEqual(9);
        expect(eq.result).toBe(10 + eq.operand2);
        expect(eq.result).toBeGreaterThanOrEqual(11);
        expect(eq.result).toBeLessThanOrEqual(19);
        expect(eq.isBridgingTen).toBe(false);
        expect(validateEquationAnswer(eq, eq.answer)).toBe(true);
        testedCount++;
      }

      // 6. Zero allowed equations
      for (let i = 0; i < 50; i++) {
        const eqAdd = generateEquation({ operator: '+', allowZero: true, maxResult: 10 });
        expect(eqAdd.operand1).toBeGreaterThanOrEqual(0);
        expect(eqAdd.operand2).toBeGreaterThanOrEqual(0);
        expect(eqAdd.result).toBeGreaterThanOrEqual(0);
        expect(eqAdd.operand1 + eqAdd.operand2).toBe(eqAdd.result);

        const eqSub = generateEquation({ operator: '-', allowZero: true, maxResult: 10 });
        expect(eqSub.operand1).toBeGreaterThanOrEqual(eqSub.operand2);
        expect(eqSub.operand2).toBeGreaterThanOrEqual(0);
        expect(eqSub.result).toBeGreaterThanOrEqual(0);
        expect(eqSub.operand1 - eqSub.operand2).toBe(eqSub.result);
        testedCount += 2;
      }

      // 7. Missing operand slot checking
      const missingSlots: Array<'operand1' | 'operand2' | 'result'> = ['operand1', 'operand2', 'result'];
      for (const slot of missingSlots) {
        for (let i = 0; i < 10; i++) {
          const eq = generateEquation({ missing: slot });
          expect(eq.missing).toBe(slot);
          if (slot === 'operand1') expect(eq.answer).toBe(eq.operand1);
          if (slot === 'operand2') expect(eq.answer).toBe(eq.operand2);
          if (slot === 'result') expect(eq.answer).toBe(eq.result);
          testedCount++;
        }
      }

      expect(testedCount).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Challenge 5: Subitizing Generator Invariants (500+ generated problems)', () => {
    it('strictly satisfies layout, range, and distractor integrity across 500+ problems', () => {
      let testedCount = 0;

      // 1. Perceptual problems (1..4)
      for (let i = 0; i < 100; i++) {
        const prob = generatePerceptualProblem();
        expect(prob.targetCount).toBeGreaterThanOrEqual(1);
        expect(prob.targetCount).toBeLessThanOrEqual(4);
        expect(prob.layout).toBe('single');
        expect(prob.options).toContain(prob.targetCount);
        expect(new Set(prob.options).size).toBe(prob.options.length);
        expect(prob.grid?.capacity).toBe(10);
        expect(prob.grid?.totalCount).toBe(prob.targetCount);
        expect(validateSubitizeAnswer(prob, prob.targetCount)).toBe(true);
        expect(validateSubitizeAnswer(prob, prob.targetCount + 10)).toBe(false);
        testedCount++;
      }

      // 2. Conceptual single frame problems (5..10)
      for (let i = 0; i < 100; i++) {
        const prob = generateConceptualProblem('single');
        expect(prob.targetCount).toBeGreaterThanOrEqual(5);
        expect(prob.targetCount).toBeLessThanOrEqual(10);
        expect(prob.layout).toBe('single');
        expect(prob.options).toContain(prob.targetCount);
        expect(new Set(prob.options).size).toBe(prob.options.length);
        expect(prob.grid?.capacity).toBe(10);
        expect(prob.grid?.totalCount).toBe(prob.targetCount);
        expect(prob.redCount).toBe(5);
        expect(prob.blackCount).toBe(prob.targetCount - 5);
        testedCount++;
      }

      // 3. Conceptual double frame problems (11..20)
      for (let i = 0; i < 100; i++) {
        const prob = generateConceptualProblem('double');
        expect(prob.targetCount).toBeGreaterThanOrEqual(11);
        expect(prob.targetCount).toBeLessThanOrEqual(20);
        expect(prob.layout).toBe('double');
        expect(prob.options).toContain(prob.targetCount);
        expect(new Set(prob.options).size).toBe(prob.options.length);
        expect(prob.grid?.capacity).toBe(20);
        expect(prob.grid?.totalCount).toBe(prob.targetCount);
        expect(prob.blackCount).toBe(10);
        expect(prob.redCount).toBe(prob.targetCount - 10);
        testedCount++;
      }

      // 4. General subitizing generator (1..20)
      for (let i = 0; i < 200; i++) {
        const prob = generateSubitizeProblem();
        expect(prob.targetCount).toBeGreaterThanOrEqual(1);
        expect(prob.targetCount).toBeLessThanOrEqual(20);
        expect(prob.options).toContain(prob.targetCount);
        expect(new Set(prob.options).size).toBe(prob.options.length);
        expect(prob.grid?.totalCount).toBe(prob.targetCount);
        testedCount++;
      }

      expect(testedCount).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Challenge 6: Defensive Input Sanitization & Invariant Preservation', () => {
    it('defensively rejects NaN or float slotIndex in removeCounter without state corruption (BUG DOMAIN-1)', () => {
      const grid = createEmptyFrame(10);
      expect(grid.totalCount).toBe(0);

      // Attempt remove with NaN
      const nanRemoved = removeCounter(grid, NaN);
      // An uncorrupted domain model must reject non-integer slotIndex and return identical grid
      expect(nanRemoved).toBe(grid);
      expect(nanRemoved.totalCount).toBe(0);

      // Attempt remove with float index 2.5
      const floatRemoved = removeCounter(grid, 2.5);
      expect(floatRemoved).toBe(grid);
      expect(floatRemoved.totalCount).toBe(0);
    });

    it('defensively rejects invalid counter colors in placeCounter without count corruption (BUG DOMAIN-2)', () => {
      const grid = createEmptyFrame(10);

      // Attempt placing invalid color
      const unindexedInvalid = placeCounter(grid, 'yellow' as unknown as CounterColor);
      expect(unindexedInvalid).toBe(grid);
      expect(unindexedInvalid.totalCount).toBe(0);

      const indexedInvalid = placeCounter(grid, 0, 'invalid' as unknown as CounterColor);
      expect(indexedInvalid).toBe(grid);
      expect(indexedInvalid.totalCount).toBe(0);
    });
  });

  describe('Challenge 7: Rapid Consecutive Place/Remove Alternation & Fuzzing (1,000 steps)', () => {
    it('preserves all mathematical invariants and deep immutability under 1,000 randomized operations', () => {
      let grid = createEmptyFrame(10);

      for (let step = 0; step < 1000; step++) {
        const actionType = Math.floor(Math.random() * 6);
        const color: CounterColor = Math.random() < 0.5 ? 'red' : 'black';

        switch (actionType) {
          case 0: {
            // Unindexed placement
            grid = placeCounter(grid, color);
            break;
          }
          case 1: {
            // Indexed placement into random slot (including out-of-bounds attempts)
            const targetSlot = Math.floor(Math.random() * (grid.capacity + 4)) - 2;
            grid = placeCounter(grid, color, targetSlot);
            break;
          }
          case 2: {
            // Remove counter from random slot (including empty and out-of-bounds slots)
            const removeSlot = Math.floor(Math.random() * (grid.capacity + 4)) - 2;
            grid = removeCounter(grid, removeSlot);
            break;
          }
          case 3: {
            // Remove last counter
            grid = removeLastCounter(grid);
            break;
          }
          case 4: {
            // Capacity toggle (rarely)
            if (Math.random() < 0.05) {
              const newCap = grid.capacity === 10 ? 20 : 10;
              grid = setFrameCapacity(grid, newCap);
            }
            break;
          }
          case 5: {
            // Clear frame (rarely)
            if (Math.random() < 0.02) {
              grid = clearFrame(grid);
            }
            break;
          }
        }

        // --- Invariant Verification at EVERY Step ---
        expect(grid.capacity === 10 || grid.capacity === 20).toBe(true);
        expect(grid.cells.length).toBe(grid.capacity);
        expect(Object.isFrozen(grid)).toBe(true);
        expect(Object.isFrozen(grid.cells)).toBe(true);

        const actualRed = grid.cells.filter((c) => c === 'red').length;
        const actualBlack = grid.cells.filter((c) => c === 'black').length;
        const actualOccupied = grid.cells.filter((c) => c !== 'empty').length;

        expect(grid.redCount).toBe(actualRed);
        expect(grid.blackCount).toBe(actualBlack);
        expect(grid.totalCount).toBe(actualOccupied);
        expect(grid.totalCount).toBe(grid.redCount + grid.blackCount);
        expect(grid.totalCount).toBeGreaterThanOrEqual(0);
        expect(grid.totalCount).toBeLessThanOrEqual(grid.capacity);

        // Ensure no NaN or polluted keys exist on cells
        expect(Object.keys(grid.cells).every((k) => Number.isInteger(Number(k)))).toBe(true);
      }
    });
  });

  describe('Challenge 8: Capacity 20 Boundaries, Capacity Transitions & Teen Place-Value Invariants', () => {
    it('seamlessly expands a partially filled 10-frame to 20-frame preserving all cells and counts', () => {
      let grid = createEmptyFrame(10);
      grid = placeCounter(grid, 'red'); // slot 0
      grid = placeCounter(grid, 'black'); // slot 1
      grid = placeCounter(grid, 'red'); // slot 2
      grid = placeCounter(grid, 'black'); // slot 3
      grid = placeCounter(grid, 'red'); // slot 4
      grid = placeCounter(grid, 'black'); // slot 5
      grid = placeCounter(grid, 'red'); // slot 6
      expect(grid.totalCount).toBe(7);
      expect(grid.redCount).toBe(4);
      expect(grid.blackCount).toBe(3);

      const grid20 = setFrameCapacity(grid, 20);
      expect(grid20.capacity).toBe(20);
      expect(grid20.cells.length).toBe(20);
      expect(grid20.redCount).toBe(4);
      expect(grid20.blackCount).toBe(3);
      expect(grid20.totalCount).toBe(7);

      // Verify slots 0..6 preserved
      expect(grid20.cells.slice(0, 7)).toEqual(grid.cells.slice(0, 7));
      // Verify slots 7..19 are empty
      expect(grid20.cells.slice(7, 20).every((c) => c === 'empty')).toBe(true);

      // Next unindexed placement continues at slot 7
      const nextGrid = placeCounter(grid20, 'black');
      expect(nextGrid.cells[7]).toBe('black');
      expect(nextGrid.totalCount).toBe(8);
      expect(nextGrid.blackCount).toBe(4);
    });

    it('accurately constructs populated frames adhering to 5-wise ordering and clamping overflow', () => {
      // Normal population: 4 red, 3 black
      const pop10 = createPopulatedFrame(10, 4, 3);
      expect(pop10.capacity).toBe(10);
      expect(pop10.totalCount).toBe(7);
      expect(pop10.redCount).toBe(4);
      expect(pop10.blackCount).toBe(3);
      expect(pop10.cells.slice(0, 4).every((c) => c === 'red')).toBe(true);
      expect(pop10.cells.slice(4, 7).every((c) => c === 'black')).toBe(true);
      expect(pop10.cells.slice(7, 10).every((c) => c === 'empty')).toBe(true);
      expect(Object.isFrozen(pop10)).toBe(true);
      expect(Object.isFrozen(pop10.cells)).toBe(true);

      // Overflow clamping: 8 red + 8 black on capacity 10 -> 8 red + 2 black = 10 total
      const clampedPop = createPopulatedFrame(10, 8, 8);
      expect(clampedPop.totalCount).toBe(10);
      expect(clampedPop.redCount).toBe(8);
      expect(clampedPop.blackCount).toBe(2);
      expect(clampedPop.cells.filter((c) => c === 'red').length).toBe(8);
      expect(clampedPop.cells.filter((c) => c === 'black').length).toBe(2);
      expect(clampedPop.cells.every((c) => c !== 'empty')).toBe(true);

      // Negative count sanitization
      const negPop = createPopulatedFrame(10, -5, -3);
      expect(negPop.totalCount).toBe(0);
      expect(negPop.redCount).toBe(0);
      expect(negPop.blackCount).toBe(0);
      expect(negPop.cells.every((c) => c === 'empty')).toBe(true);
    });

    it('safely shrinks a 20-frame to 10-frame truncating counters and updating counts without desync', () => {
      let grid20 = createEmptyFrame(20);
      // Place 15 counters (10 in frame 1, 5 in frame 2)
      for (let i = 0; i < 15; i++) {
        grid20 = placeCounter(grid20, i < 10 ? 'black' : 'red');
      }
      expect(grid20.totalCount).toBe(15);
      expect(grid20.blackCount).toBe(10);
      expect(grid20.redCount).toBe(5);

      const grid10 = setFrameCapacity(grid20, 10);
      expect(grid10.capacity).toBe(10);
      expect(grid10.cells.length).toBe(10);
      expect(grid10.totalCount).toBe(10);
      expect(grid10.blackCount).toBe(10);
      expect(grid10.redCount).toBe(0);
      expect(grid10.cells.every((c) => c === 'black')).toBe(true);
      expect(Object.isFrozen(grid10)).toBe(true);
      expect(Object.isFrozen(grid10.cells)).toBe(true);
    });

    it('strictly satisfies teen decomposition across all values 10..20 and clamps out-of-range inputs', () => {
      for (let total = 10; total <= 20; total++) {
        const teenGrid = createTeenDecomposition(total, 'black', 'red');
        expect(teenGrid.capacity).toBe(20);
        expect(teenGrid.totalCount).toBe(total);
        expect(teenGrid.blackCount).toBe(10);
        expect(teenGrid.redCount).toBe(total - 10);

        const decomp = decomposeTeen(teenGrid);
        expect(decomp.tens).toBe(10);
        expect(decomp.ones).toBe(total - 10);
        expect(decomp.isValidTeen).toBe(true);

        const rows = getFrameRows(teenGrid);
        expect(rows.length).toBe(4);
        expect(rows[0].every((c) => c === 'black')).toBe(true);
        expect(rows[1].every((c) => c === 'black')).toBe(true);

        const ones = total - 10;
        const row2Expected = Math.min(5, ones);
        const row3Expected = Math.max(0, ones - 5);
        expect(rows[2].filter((c) => c === 'red').length).toBe(row2Expected);
        expect(rows[3].filter((c) => c === 'red').length).toBe(row3Expected);
      }

      // Out of range clamping
      const clampedLow = createTeenDecomposition(5);
      expect(clampedLow.totalCount).toBe(10);
      expect(decomposeTeen(clampedLow).ones).toBe(0);

      const clampedHigh = createTeenDecomposition(30);
      expect(clampedHigh.totalCount).toBe(20);
      expect(decomposeTeen(clampedHigh).ones).toBe(10);

      // Invalid teen decomposition checks
      let corruptedGrid = createEmptyFrame(20);
      corruptedGrid = placeCounter(corruptedGrid, 'black', 0); // only 1 in frame 1
      corruptedGrid = placeCounter(corruptedGrid, 'red', 10); // 1 in frame 2
      const invalidDecomp = decomposeTeen(corruptedGrid);
      expect(invalidDecomp.tens).toBe(1);
      expect(invalidDecomp.ones).toBe(1);
      expect(invalidDecomp.isValidTeen).toBe(false);

      // Single frame passed to decomposeTeen
      const singleFrame = createEmptyFrame(10);
      expect(decomposeTeen(singleFrame).isValidTeen).toBe(false);
    });
  });

  describe('Challenge 9: Singapore Zero Partition Number Bonds & Boundary Invariants', () => {
    it('strictly satisfies W = PartA + PartB across 1,000 zero partition number bonds', () => {
      let zeroPartCount = 0;

      for (let i = 0; i < 1000; i++) {
        const bond = generateNumberBond({
          minWhole: 2,
          maxWhole: 10,
          allowZero: true,
        });

        expect(bond.whole).toBe(bond.partA + bond.partB);
        expect(bond.partA).toBeGreaterThanOrEqual(0);
        expect(bond.partB).toBeGreaterThanOrEqual(0);
        expect(bond.partA).toBeLessThanOrEqual(bond.whole);
        expect(bond.partB).toBeLessThanOrEqual(bond.whole);

        if (bond.partA === 0 || bond.partB === 0) {
          zeroPartCount++;
        }

        expect(validateNumberBondAnswer(bond, bond.answer)).toBe(true);
        expect(validateNumberBondAnswer(bond, bond.answer + 10)).toBe(false);
        expect(validateNumberBondAnswer(bond, NaN)).toBe(false);
      }

      // Over 1,000 random trials with allowZero: true, zero partitions MUST occur empirically
      expect(zeroPartCount).toBeGreaterThan(0);
    });

    it('safely handles extreme whole = 0 and whole = 1 boundaries', () => {
      // Whole = 0 with allowZero: true
      const zeroBond = generateNumberBond({ minWhole: 0, maxWhole: 0, allowZero: true });
      expect(zeroBond.whole).toBe(0);
      expect(zeroBond.partA).toBe(0);
      expect(zeroBond.partB).toBe(0);
      expect(validateNumberBondAnswer(zeroBond, 0)).toBe(true);

      // Whole = 1 with allowZero: true
      for (let i = 0; i < 20; i++) {
        const oneBond = generateNumberBond({ minWhole: 1, maxWhole: 1, allowZero: true });
        expect(oneBond.whole).toBe(1);
        expect(oneBond.partA + oneBond.partB).toBe(1);
        expect(oneBond.partA >= 0 && oneBond.partB >= 0).toBe(true);
      }

      // Non-zero bonds (allowZero: false) must never have 0 parts for whole >= 2
      for (let i = 0; i < 200; i++) {
        const normalBond = generateNumberBond({ minWhole: 2, maxWhole: 10, allowZero: false });
        expect(normalBond.partA).toBeGreaterThanOrEqual(1);
        expect(normalBond.partB).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Challenge 10: Exhaustive Boundary Stress on BUG DOMAIN-1 & DOMAIN-2', () => {
    it('defensively rejects all non-integer and non-finite slot indices without mutating state', () => {
      const invalidSlots = [
        NaN,
        Infinity,
        -Infinity,
        -0.001,
        0.5,
        1.0001,
        9.999,
        -1,
        -100,
        10,
        20,
        1000,
        '0' as unknown as number,
        'NaN' as unknown as number,
        null as unknown as number,
        {} as unknown as number,
      ];

      // Test on empty 10-frame
      const empty10 = createEmptyFrame(10);
      for (const badSlot of invalidSlots) {
        const result = removeCounter(empty10, badSlot);
        expect(result).toBe(empty10);
        expect(result.totalCount).toBe(0);
        expect(result.cells.length).toBe(10);
      }
      // undefined in removeCounter must also be rejected
      expect(removeCounter(empty10, undefined as unknown as number)).toBe(empty10);

      // Test on partially full 10-frame
      let partial10 = createEmptyFrame(10);
      partial10 = placeCounter(partial10, 'red', 0);
      partial10 = placeCounter(partial10, 'black', 1);
      expect(partial10.totalCount).toBe(2);

      for (const badSlot of invalidSlots) {
        const result = removeCounter(partial10, badSlot);
        expect(result).toBe(partial10);
        expect(result.totalCount).toBe(2);
        expect(result.cells[0]).toBe('red');
        expect(result.cells[1]).toBe('black');
      }

      // Test placeCounter with bad slots (both signatures)
      for (const badSlot of invalidSlots) {
        const res1 = placeCounter(empty10, 'red', badSlot);
        expect(res1).toBe(empty10);
        const res2 = placeCounter(empty10, badSlot, 'red');
        expect(res2).toBe(empty10);
      }

      // Verify that undefined slotIndex in placeCounter executes 5-wise placement as specified by API
      const unindexedWithUndefined = placeCounter(empty10, 'red', undefined);
      expect(unindexedWithUndefined.totalCount).toBe(1);
      expect(unindexedWithUndefined.cells[0]).toBe('red');
    });

    it('defensively rejects all invalid colors across all placeCounter signatures without count corruption', () => {
      const invalidColors = [
        'yellow',
        'blue',
        'green',
        'white',
        'purple',
        'RED',
        'BLACK',
        '',
        ' ',
        null,
        undefined,
        123,
        true,
        {},
      ];

      const empty10 = createEmptyFrame(10);

      for (const badColor of invalidColors) {
        // Unindexed
        const resUnindexed = placeCounter(empty10, badColor as unknown as CounterColor);
        expect(resUnindexed).toBe(empty10);
        expect(resUnindexed.totalCount).toBe(0);

        // Indexed (color, slot)
        const resIndexed1 = placeCounter(empty10, badColor as unknown as CounterColor, 0);
        expect(resIndexed1).toBe(empty10);
        expect(resIndexed1.totalCount).toBe(0);

        // Indexed (slot, color)
        const resIndexed2 = placeCounter(empty10, 0, badColor as unknown as CounterColor);
        expect(resIndexed2).toBe(empty10);
        expect(resIndexed2.totalCount).toBe(0);
      }
    });
  });
});

