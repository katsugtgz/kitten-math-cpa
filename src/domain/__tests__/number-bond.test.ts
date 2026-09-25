import { describe, expect, it } from 'vitest';
import {
  generateFriendsOfTenBond,
  generateNumberBond,
  generateTeenBond,
  validateNumberBondAnswer,
} from '../number-bond';

describe('number-bond generator', () => {
  it('strictly maintains Singapore Math invariant: whole === partA + partB', () => {
    for (let i = 0; i < 50; i++) {
      const bond = generateNumberBond({ minWhole: 2, maxWhole: 20 });
      expect(bond.whole).toBe(bond.partA + bond.partB);
      expect(bond.whole).toBeGreaterThanOrEqual(2);
      expect(bond.partA).toBeGreaterThanOrEqual(1);
      expect(bond.partB).toBeGreaterThanOrEqual(1);
    }
  });

  it('correctly sets answer based on missing component', () => {
    const wholeMissing = generateNumberBond({ missing: 'whole' });
    expect(wholeMissing.missing).toBe('whole');
    expect(wholeMissing.answer).toBe(wholeMissing.whole);

    const partAMissing = generateNumberBond({ missing: 'partA' });
    expect(partAMissing.missing).toBe('partA');
    expect(partAMissing.answer).toBe(partAMissing.partA);

    const partBMissing = generateNumberBond({ missing: 'partB' });
    expect(partBMissing.missing).toBe('partB');
    expect(partBMissing.answer).toBe(partBMissing.partB);
  });

  it('generates Friends of 10 bonds with whole equal to 10', () => {
    for (let i = 0; i < 20; i++) {
      const bond = generateFriendsOfTenBond();
      expect(bond.whole).toBe(10);
      expect(bond.partA + bond.partB).toBe(10);
    }
  });

  it('generates teen bonds decomposed into 10 + N', () => {
    for (let i = 0; i < 20; i++) {
      const bond = generateTeenBond();
      expect(bond.whole).toBeGreaterThanOrEqual(11);
      expect(bond.whole).toBeLessThanOrEqual(19);
      expect(bond.partA).toBe(10);
      expect(bond.partB).toBe(bond.whole - 10);
    }
  });

  it('validates user answers accurately', () => {
    const bond = generateFriendsOfTenBond('partB');
    expect(validateNumberBondAnswer(bond, bond.partB)).toBe(true);
    expect(validateNumberBondAnswer(bond, bond.partB + 1)).toBe(false);
  });
});
