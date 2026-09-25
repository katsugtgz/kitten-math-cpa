import { describe, expect, it } from 'vitest';
import {
  generateConceptualProblem,
  generateDistractors,
  generatePerceptualProblem,
  generateSubitizeProblem,
  validateSubitizeAnswer,
} from '../subitize';

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
});
