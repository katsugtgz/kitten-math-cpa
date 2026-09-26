import { validateSubitizeAnswer } from './subitize';
import { validateNumberBondAnswer } from './number-bond';
import { validateEquationAnswer } from './equation';
import type {
  ActiveProblem,
  DomainProblem,
  DomainSubitizeProblem,
  DomainNumberBondProblem,
  DomainEquationProblem,
} from './types';

const adapterCache = new WeakMap<object, DomainProblem>();

/**
 * Adapts an ActiveProblem to a polymorphic DomainProblem.
 *
 * Guarantees:
 * 1. If problem is null/undefined, returns null.
 * 2. If problem already implements validate() and getExpectedAnswer(), returns problem as-is (referential identity preserved).
 * 3. If problem is a raw fixture (legacy object literal), adapts it using domain validators and caches the adapted instance in a WeakMap for referential consistency.
 * 4. Never mutates the input problem object, ensuring frozen objects and existing state references remain untouched.
 */
export function asDomainProblem(problem: ActiveProblem | undefined): DomainProblem | null {
  if (!problem) return null;

  // 1. Direct polymorphic duck-typing: already implements DomainProblem
  const p = problem as unknown as Record<string, unknown>;
  if (
    typeof p.validate === 'function' &&
    typeof p.getExpectedAnswer === 'function' &&
    typeof p.type === 'string'
  ) {
    return problem as DomainProblem;
  }

  // 2. Cache hit for previously adapted object literals
  const cached = adapterCache.get(problem as object);
  if (cached) {
    return cached;
  }

  // 3. Adapt raw fixtures based on structural discrimination (legacy fallback only)
  let adapted: DomainProblem | null = null;

  if ('targetCount' in problem) {
    const sub = problem;
    const domainSub: DomainSubitizeProblem = {
      ...sub,
      type: 'subitize',
      validate(this: DomainSubitizeProblem | void, answer: number): boolean {
        return validateSubitizeAnswer(this ?? domainSub, answer);
      },
      getExpectedAnswer(this: DomainSubitizeProblem | void): number {
        return (this ?? domainSub).targetCount;
      },
    };
    adapted = domainSub;
  } else if ('whole' in problem) {
    const nb = problem;
    const expectedAnswer =
      typeof nb.answer === 'number'
        ? nb.answer
        : nb.missing === 'whole'
          ? nb.whole
          : nb.missing === 'partA'
            ? nb.partA
            : nb.partB;

    const domainNb: DomainNumberBondProblem = {
      ...nb,
      answer: expectedAnswer,
      type: 'number-bond',
      validate(this: DomainNumberBondProblem | void, answer: number): boolean {
        return validateNumberBondAnswer(this ?? domainNb, answer);
      },
      getExpectedAnswer(this: DomainNumberBondProblem | void): number {
        return (this ?? domainNb).answer;
      },
    };
    adapted = domainNb;
  } else if ('operator' in problem) {
    const eq = problem;
    const expectedAnswer =
      typeof eq.answer === 'number'
        ? eq.answer
        : eq.missing === 'result'
          ? eq.result
          : eq.missing === 'operand1'
            ? eq.operand1
            : eq.operand2;

    const domainEq: DomainEquationProblem = {
      ...eq,
      answer: expectedAnswer,
      type: 'equation',
      validate(this: DomainEquationProblem | void, answer: number): boolean {
        return validateEquationAnswer(this ?? domainEq, answer);
      },
      getExpectedAnswer(this: DomainEquationProblem | void): number {
        return (this ?? domainEq).answer;
      },
    };
    adapted = domainEq;
  }

  if (adapted) {
    adapterCache.set(problem as object, adapted);
  }

  return adapted;
}
