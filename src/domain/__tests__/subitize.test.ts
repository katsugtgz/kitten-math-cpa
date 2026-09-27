import { describe, expect, it } from 'vitest';
import {
  generateConceptualProblem,
  generateDistractors,
  generatePerceptualProblem,
  generateSubitizeProblem,
  validateSubitizeAnswer,
} from '../subitize';
import { asDomainProblem } from '../adapter';
import type { ActiveProblem } from '../types';

describe('subitize generator', () => {
  describe('generateDistractors', () => {
    it('produces exactly requested unique options including correct answer', () => {
      const options = generateDistractors(5, 3, 1, 10);
      expect(options.length).toBe(4);
      expect(options).toContain(5);
      const unique = new Set(options);
      expect(unique.size).toBe(4);
      options.forEach((opt) => {
        expect(opt).toBeGreaterThanOrEqual(1);
        expect(opt).toBeLessThanOrEqual(10);
      });
    });

    it('uses deterministic random function when provided', () => {
      let seed = 0.1;
      const fakeRng = () => {
        seed = (seed + 0.2) % 1;
        return seed;
      };
      const opt1 = generateDistractors(4, 3, 1, 10, fakeRng);
      expect(opt1.length).toBe(4);
      expect(opt1).toContain(4);
    });
  });

  describe('generatePerceptualProblem (1-4)', () => {
    it('always generates targetCount within 1..4 in single frame layout', () => {
      for (let i = 0; i < 20; i++) {
        const prob = generatePerceptualProblem();
        expect(prob.targetCount).toBeGreaterThanOrEqual(1);
        expect(prob.targetCount).toBeLessThanOrEqual(4);
        expect(prob.layout).toBe('single');
        expect(prob.grid?.capacity).toBe(10);
        expect(prob.grid?.totalCount).toBe(prob.targetCount);
        expect(prob.options).toContain(prob.targetCount);
      }
    });
  });

  describe('generateConceptualProblem (5-20)', () => {
    it('generates conceptual single layout problems (5-10)', () => {
      for (let i = 0; i < 20; i++) {
        const prob = generateConceptualProblem('single');
        expect(prob.targetCount).toBeGreaterThanOrEqual(5);
        expect(prob.targetCount).toBeLessThanOrEqual(10);
        expect(prob.layout).toBe('single');
        expect(prob.grid?.totalCount).toBe(prob.targetCount);
        expect(prob.redCount).toBe(5); // Anchor of 5 on top row
        expect(prob.blackCount).toBe(prob.targetCount - 5);
      }
    });

    it('generates conceptual double layout problems (11-20)', () => {
      for (let i = 0; i < 20; i++) {
        const prob = generateConceptualProblem('double');
        expect(prob.targetCount).toBeGreaterThanOrEqual(11);
        expect(prob.targetCount).toBeLessThanOrEqual(20);
        expect(prob.layout).toBe('double');
        expect(prob.grid?.capacity).toBe(20);
        expect(prob.grid?.totalCount).toBe(prob.targetCount);
        expect(prob.blackCount).toBe(10); // Frame 1 full
        expect(prob.redCount).toBe(prob.targetCount - 10);
      }
    });
  });

  describe('validateSubitizeAnswer', () => {
    it('validates correct and incorrect answers', () => {
      const prob = generateSubitizeProblem(7, { layout: 'single' });
      expect(validateSubitizeAnswer(prob, 7)).toBe(true);
      expect(validateSubitizeAnswer(prob, 6)).toBe(false);
      expect(validateSubitizeAnswer(prob, 8)).toBe(false);
    });
  });

  describe('polymorphic domain interface', () => {
    it('exposes type, validate, and getExpectedAnswer on generated subitize problems', () => {
      const prob = generateSubitizeProblem(6);
      expect(prob.type).toBe('subitize');
      expect(prob.getExpectedAnswer()).toBe(6);
      expect(prob.validate(6)).toBe(true);
      expect(prob.validate(5)).toBe(false);

      // Destructuring safety check
      const { validate, getExpectedAnswer } = prob;
      expect(getExpectedAnswer()).toBe(6);
      expect(validate(6)).toBe(true);
      expect(validate(7)).toBe(false);
    });

    it('exposes polymorphic methods on perceptual and conceptual subitize problems', () => {
      const perceptual = generatePerceptualProblem();
      expect(perceptual.type).toBe('subitize');
      expect(perceptual.validate(perceptual.targetCount)).toBe(true);
      expect(perceptual.validate(perceptual.targetCount + 99)).toBe(false);
      expect(perceptual.getExpectedAnswer()).toBe(perceptual.targetCount);

      const conceptual = generateConceptualProblem('double');
      expect(conceptual.type).toBe('subitize');
      expect(conceptual.validate(conceptual.targetCount)).toBe(true);
      expect(conceptual.validate(conceptual.targetCount - 1)).toBe(false);
      expect(conceptual.getExpectedAnswer()).toBe(conceptual.targetCount);
    });
  });

  describe('asDomainProblem adapter for subitize', () => {
    it('returns already polymorphic problem directly (referential identity preserved)', () => {
      const prob = generateSubitizeProblem(4);
      const adapted = asDomainProblem(prob);
      expect(adapted).toBe(prob);
    });

    it('adapts plain fixture literal without mutating input object', () => {
      const plainFixture = Object.freeze({
        id: 'test-plain-sub',
        targetCount: 5,
        redCount: 5,
        blackCount: 0,
        options: [3, 4, 5, 6],
        layout: 'single' as const,
      });

      const adapted1 = asDomainProblem(plainFixture as unknown as ActiveProblem);
      expect(adapted1).not.toBeNull();
      expect(adapted1?.type).toBe('subitize');
      expect(adapted1?.getExpectedAnswer()).toBe(5);
      expect(adapted1?.validate(5)).toBe(true);
      expect(adapted1?.validate(4)).toBe(false);

      // WeakMap cache stability
      const adapted2 = asDomainProblem(plainFixture as unknown as ActiveProblem);
      expect(adapted2).toBe(adapted1);

      // Input was not mutated
      expect('validate' in plainFixture).toBe(false);
    });

    it('handles null/undefined gracefully', () => {
      expect(asDomainProblem(null)).toBeNull();
      expect(asDomainProblem(undefined)).toBeNull();
    });

    it('rejects unsupported problem type discriminators even with polymorphic methods', () => {
      const impostor = {
        id: 'fake-1',
        type: 'quantum-bond',
        validate: (answer: number): boolean => answer === 42,
        getExpectedAnswer: (): number => 42,
      };
      expect(asDomainProblem(impostor as unknown as ActiveProblem)).toBeNull();
    });
  });
});
