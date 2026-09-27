import { describe, expect, it } from 'vitest';
import {
  generateFriendsOfTenBond,
  generateNumberBond,
  generateTeenBond,
  validateNumberBondAnswer,
} from '../number-bond';
import { asDomainProblem } from '../adapter';
import type { ActiveProblem } from '../types';

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

  describe('polymorphic domain interface', () => {
    it('exposes type, validate, and getExpectedAnswer on generated number bonds', () => {
      const bond = generateFriendsOfTenBond('partB');
      expect(bond.type).toBe('number-bond');
      expect(bond.getExpectedAnswer()).toBe(bond.partB);
      expect(bond.validate(bond.partB)).toBe(true);
      expect(bond.validate(bond.partB + 1)).toBe(false);

      // Destructuring safety check
      const { validate, getExpectedAnswer } = bond;
      expect(getExpectedAnswer()).toBe(bond.partB);
      expect(validate(bond.partB)).toBe(true);
      expect(validate(bond.partB + 99)).toBe(false);
    });

    it('exposes polymorphic methods on teen number bonds', () => {
      const teen = generateTeenBond('whole');
      expect(teen.type).toBe('number-bond');
      expect(teen.getExpectedAnswer()).toBe(teen.whole);
      expect(teen.validate(teen.whole)).toBe(true);
      expect(teen.validate(teen.whole - 1)).toBe(false);
    });
  });

  describe('asDomainProblem adapter for number-bond', () => {
    it('returns already polymorphic number bond directly', () => {
      const bond = generateNumberBond({ minWhole: 5, maxWhole: 5 });
      const adapted = asDomainProblem(bond);
      expect(adapted).toBe(bond);
    });

    it('adapts plain fixture literal without mutating input object', () => {
      const plainFixture = Object.freeze({
        id: 'test-plain-nb',
        whole: 10,
        partA: 7,
        partB: 3,
        missing: 'partB' as const,
        answer: 3,
      });

      const adapted1 = asDomainProblem(plainFixture as unknown as ActiveProblem);
      expect(adapted1).not.toBeNull();
      expect(adapted1?.type).toBe('number-bond');
      expect(adapted1?.getExpectedAnswer()).toBe(3);
      expect(adapted1?.validate(3)).toBe(true);
      expect(adapted1?.validate(2)).toBe(false);

      // WeakMap cache stability
      const adapted2 = asDomainProblem(plainFixture as unknown as ActiveProblem);
      expect(adapted2).toBe(adapted1);

      // Input was not mutated
      expect('validate' in plainFixture).toBe(false);
    });

    it('adapts plain fixture with missing whole and missing partA when answer property is absent', () => {
      const plainWhole = {
        id: 'plain-whole',
        whole: 10,
        partA: 6,
        partB: 4,
        missing: 'whole' as const,
      };
      const adaptedWhole = asDomainProblem(plainWhole as unknown as ActiveProblem);
      expect(adaptedWhole?.getExpectedAnswer()).toBe(10);
      expect(adaptedWhole?.validate(10)).toBe(true);

      const plainPartA = {
        id: 'plain-partA',
        whole: 10,
        partA: 6,
        partB: 4,
        missing: 'partA' as const,
      };
      const adaptedPartA = asDomainProblem(plainPartA as unknown as ActiveProblem);
      expect(adaptedPartA?.getExpectedAnswer()).toBe(6);
      expect(adaptedPartA?.validate(6)).toBe(true);
    });
  });
});
