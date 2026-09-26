import { describe, it, expect } from 'vitest';
import {
  generateSubitizeProblem,
  generatePerceptualProblem,
  generateConceptualProblem,
} from '../../domain/subitize';
import {
  generateNumberBond,
  generateFriendsOfTenBond,
  generateTeenBond,
} from '../../domain/number-bond';
import {
  generateEquation,
  generateBridgingTenAddition,
  generateBridgingTenSubtraction,
  generateTeenAddition,
} from '../../domain/equation';
import {
  createSubitizeProblem,
  createNumberBondProblem,
  createEquationProblem,
} from '../../domain/types';
import type {
  ActiveProblem,
  DomainProblem,
} from '../../domain/types';
import { asDomainProblem } from '../../domain/adapter';
import {
  getCorrectAnswer,
  evaluateAnswer,
} from '../progression';
import {
  createInitialState,
  gameReducer,
  generateProblemForMode,
} from '../game-reducer';

describe('Milestone 1 Empirical Challenger: Domain Problem Polymorphism & State Integration', () => {
  describe('Task 1: State Machine Integration (getCorrectAnswer & evaluateAnswer)', () => {
    it('evaluates polymorphic SubitizeProblem generator instances', () => {
      const sub1 = generateSubitizeProblem(5, { layout: 'single' });
      expect(sub1.type).toBe('subitize');
      expect(getCorrectAnswer(sub1)).toBe(5);
      expect(evaluateAnswer(sub1, 5)).toBe(true);
      expect(evaluateAnswer(sub1, 4)).toBe(false);
      expect(evaluateAnswer(sub1, 6)).toBe(false);

      const subDouble = generateSubitizeProblem(16, { layout: 'double' });
      expect(getCorrectAnswer(subDouble)).toBe(16);
      expect(evaluateAnswer(subDouble, 16)).toBe(true);
      expect(evaluateAnswer(subDouble, 15)).toBe(false);

      const perceptual = generatePerceptualProblem();
      expect(getCorrectAnswer(perceptual)).toBe(perceptual.targetCount);
      expect(evaluateAnswer(perceptual, perceptual.targetCount)).toBe(true);

      const conceptual = generateConceptualProblem('double');
      expect(getCorrectAnswer(conceptual)).toBe(conceptual.targetCount);
      expect(evaluateAnswer(conceptual, conceptual.targetCount)).toBe(true);
    });

    it('evaluates polymorphic NumberBond generator instances across all missing positions', () => {
      const nbWhole = generateNumberBond({ minWhole: 10, maxWhole: 10, missing: 'whole' });
      expect(nbWhole.type).toBe('number-bond');
      expect(getCorrectAnswer(nbWhole)).toBe(10);
      expect(evaluateAnswer(nbWhole, 10)).toBe(true);
      expect(evaluateAnswer(nbWhole, 9)).toBe(false);

      const nbPartA = generateNumberBond({ minWhole: 8, maxWhole: 8, missing: 'partA' });
      expect(getCorrectAnswer(nbPartA)).toBe(nbPartA.partA);
      expect(evaluateAnswer(nbPartA, nbPartA.partA)).toBe(true);
      expect(evaluateAnswer(nbPartA, nbPartA.partA + 1)).toBe(false);

      const nbPartB = generateNumberBond({ minWhole: 7, maxWhole: 7, missing: 'partB' });
      expect(getCorrectAnswer(nbPartB)).toBe(nbPartB.partB);
      expect(evaluateAnswer(nbPartB, nbPartB.partB)).toBe(true);
      expect(evaluateAnswer(nbPartB, nbPartB.partB - 1)).toBe(false);

      const friendsOfTen = generateFriendsOfTenBond('partB');
      expect(getCorrectAnswer(friendsOfTen)).toBe(friendsOfTen.partB);
      expect(evaluateAnswer(friendsOfTen, friendsOfTen.partB)).toBe(true);

      const teenBond = generateTeenBond('partA');
      expect(getCorrectAnswer(teenBond)).toBe(10);
      expect(evaluateAnswer(teenBond, 10)).toBe(true);
    });

    it('evaluates polymorphic Equation generator instances across operations and missing slots', () => {
      const eqAdd = generateEquation({ operator: '+', minOperand: 2, maxResult: 10, missing: 'result' });
      expect(eqAdd.type).toBe('equation');
      expect(getCorrectAnswer(eqAdd)).toBe(eqAdd.result);
      expect(evaluateAnswer(eqAdd, eqAdd.result)).toBe(true);
      expect(evaluateAnswer(eqAdd, eqAdd.result + 1)).toBe(false);

      const eqSubOp1 = generateEquation({ operator: '-', minOperand: 1, maxResult: 10, missing: 'operand1' });
      expect(getCorrectAnswer(eqSubOp1)).toBe(eqSubOp1.operand1);
      expect(evaluateAnswer(eqSubOp1, eqSubOp1.operand1)).toBe(true);

      const eqSubOp2 = generateEquation({ operator: '-', minOperand: 1, maxResult: 10, missing: 'operand2' });
      expect(getCorrectAnswer(eqSubOp2)).toBe(eqSubOp2.operand2);
      expect(evaluateAnswer(eqSubOp2, eqSubOp2.operand2)).toBe(true);

      const bridgeAdd = generateBridgingTenAddition('result');
      expect(getCorrectAnswer(bridgeAdd)).toBe(bridgeAdd.result);
      expect(bridgeAdd.result).toBeGreaterThan(10);
      expect(evaluateAnswer(bridgeAdd, bridgeAdd.result)).toBe(true);

      const bridgeSub = generateBridgingTenSubtraction('result');
      expect(getCorrectAnswer(bridgeSub)).toBe(bridgeSub.result);
      expect(evaluateAnswer(bridgeSub, bridgeSub.result)).toBe(true);

      const teenAdd = generateTeenAddition('operand2');
      expect(getCorrectAnswer(teenAdd)).toBe(teenAdd.operand2);
      expect(evaluateAnswer(teenAdd, teenAdd.operand2)).toBe(true);
    });

    it('evaluates factory-constructed problems (createSubitizeProblem, createNumberBondProblem, createEquationProblem)', () => {
      const factorySub = createSubitizeProblem({
        id: 'f-sub',
        targetCount: 4,
        redCount: 4,
        blackCount: 0,
        options: [2, 3, 4, 5],
        layout: 'single',
      });
      expect(factorySub.type).toBe('subitize');
      expect(getCorrectAnswer(factorySub)).toBe(4);
      expect(evaluateAnswer(factorySub, 4)).toBe(true);

      const factoryNb = createNumberBondProblem({
        id: 'f-nb',
        whole: 10,
        partA: 6,
        partB: 4,
        missing: 'partB',
        answer: 4,
      });
      expect(factoryNb.type).toBe('number-bond');
      expect(factoryNb.answer).toBe(4);
      expect(getCorrectAnswer(factoryNb)).toBe(4);
      expect(evaluateAnswer(factoryNb, 4)).toBe(true);

      const factoryEq = createEquationProblem({
        id: 'f-eq',
        operand1: 8,
        operator: '+',
        operand2: 5,
        result: 13,
        missing: 'operand1',
        answer: 8,
      });
      expect(factoryEq.type).toBe('equation');
      expect(factoryEq.answer).toBe(8);
      expect(getCorrectAnswer(factoryEq)).toBe(8);
      expect(evaluateAnswer(factoryEq, 8)).toBe(true);
    });

    it('evaluates legacy un-hydrated raw test fixture objects (structural fallbacks & adapter)', () => {
      // Legacy Subitize without validate or getExpectedAnswer
      const rawSub = {
        id: 'raw-sub-1',
        targetCount: 7,
        options: [5, 6, 7, 8],
        layout: 'single',
      } as unknown as ActiveProblem;
      expect(getCorrectAnswer(rawSub)).toBe(7);
      expect(evaluateAnswer(rawSub, 7)).toBe(true);
      expect(evaluateAnswer(rawSub, 6)).toBe(false);

      // Legacy NumberBond without answer field
      const rawNbWhole = {
        id: 'raw-nb-1',
        whole: 9,
        partA: 5,
        partB: 4,
        missing: 'whole',
      } as unknown as ActiveProblem;
      expect(getCorrectAnswer(rawNbWhole)).toBe(9);
      expect(evaluateAnswer(rawNbWhole, 9)).toBe(true);
      expect(evaluateAnswer(rawNbWhole, 8)).toBe(false);

      const rawNbPartA = {
        id: 'raw-nb-2',
        whole: 10,
        partA: 3,
        partB: 7,
        missing: 'partA',
      } as unknown as ActiveProblem;
      expect(getCorrectAnswer(rawNbPartA)).toBe(3);
      expect(evaluateAnswer(rawNbPartA, 3)).toBe(true);

      const rawNbPartB = {
        id: 'raw-nb-3',
        whole: 10,
        partA: 8,
        partB: 2,
        missing: 'partB',
      } as unknown as ActiveProblem;
      expect(getCorrectAnswer(rawNbPartB)).toBe(2);
      expect(evaluateAnswer(rawNbPartB, 2)).toBe(true);

      // Legacy Equation without answer field
      const rawEqResult = {
        id: 'raw-eq-1',
        operand1: 6,
        operator: '+',
        operand2: 4,
        result: 10,
        missing: 'result',
      } as unknown as ActiveProblem;
      expect(getCorrectAnswer(rawEqResult)).toBe(10);
      expect(evaluateAnswer(rawEqResult, 10)).toBe(true);

      const rawEqOp1 = {
        id: 'raw-eq-2',
        operand1: 15,
        operator: '-',
        operand2: 7,
        result: 8,
        missing: 'operand1',
      } as unknown as ActiveProblem;
      expect(getCorrectAnswer(rawEqOp1)).toBe(15);
      expect(evaluateAnswer(rawEqOp1, 15)).toBe(true);

      const rawEqOp2 = {
        id: 'raw-eq-3',
        operand1: 12,
        operator: '-',
        operand2: 5,
        result: 7,
        missing: 'operand2',
      } as unknown as ActiveProblem;
      expect(getCorrectAnswer(rawEqOp2)).toBe(5);
      expect(evaluateAnswer(rawEqOp2, 5)).toBe(true);
    });

    it('safely evaluates frozen legacy objects without attempting mutation', () => {
      const frozenRawSub = Object.freeze({
        id: 'frozen-sub',
        targetCount: 3,
        options: [1, 2, 3, 4],
        layout: 'single',
      }) as unknown as ActiveProblem;

      expect(Object.isFrozen(frozenRawSub)).toBe(true);
      expect(getCorrectAnswer(frozenRawSub)).toBe(3);
      expect(evaluateAnswer(frozenRawSub, 3)).toBe(true);
      expect(evaluateAnswer(frozenRawSub, 2)).toBe(false);
      // Verify object remains frozen and unmodified
      expect(Object.isFrozen(frozenRawSub)).toBe(true);
      expect('validate' in (frozenRawSub as object)).toBe(false);
    });

    it('preserves referential identity in asDomainProblem', () => {
      const polymorphic = generateSubitizeProblem(5);
      // If already polymorphic, asDomainProblem returns the exact same reference
      expect(asDomainProblem(polymorphic)).toBe(polymorphic);

      const raw = { id: 'raw', targetCount: 4 } as unknown as ActiveProblem;
      const adapted1 = asDomainProblem(raw);
      const adapted2 = asDomainProblem(raw);
      // WeakMap cache guarantees exact same adapted instance
      expect(adapted1).toBe(adapted2);
      expect(adapted1).not.toBe(raw);
    });
  });

  describe('Task 2: Referential Equality Invariants in gameReducer', () => {
    it('strictly preserves state.activeProblem === options.activeProblem in createInitialState', () => {
      // 1. Polymorphic subitize fixture
      const subFixture = createSubitizeProblem({
        id: 'fix-sub',
        targetCount: 6,
        redCount: 5,
        blackCount: 1,
        options: [5, 6, 7, 8],
        layout: 'single',
      });
      const stateSub = createInitialState({ activeProblem: subFixture });
      expect(stateSub.activeProblem).toBe(subFixture);
      expect(stateSub.mode).toBe('pictorial');

      // 2. Polymorphic number bond fixture
      const nbFixture = createNumberBondProblem({
        id: 'fix-nb',
        whole: 10,
        partA: 7,
        partB: 3,
        missing: 'partB',
        answer: 3,
      });
      const stateNb = createInitialState({ activeProblem: nbFixture });
      expect(stateNb.activeProblem).toBe(nbFixture);
      expect(stateNb.mode).toBe('abstract');

      // 3. Raw un-hydrated fixture
      const rawFixture = {
        id: 'raw-nb',
        whole: 8,
        partA: 5,
        partB: 3,
        missing: 'whole',
      } as unknown as ActiveProblem;
      const stateRaw = createInitialState({ activeProblem: rawFixture });
      expect(stateRaw.activeProblem).toBe(rawFixture);
      expect(stateRaw.mode).toBe('abstract');

      // 4. Null fixture
      const stateNull = createInitialState({ activeProblem: null, mode: 'concrete' });
      expect(stateNull.activeProblem).toBeNull();
      expect(stateNull.mode).toBe('concrete');
    });

    it('strictly preserves activeProblem reference across NEXT_PROBLEM with explicit fixture', () => {
      const state = createInitialState({ mode: 'abstract', stage: 1 });
      const nextFixture = createEquationProblem({
        id: 'next-eq',
        operand1: 5,
        operator: '+',
        operand2: 5,
        result: 10,
        missing: 'result',
        answer: 10,
      });
      const newState = gameReducer(state, { type: 'NEXT_PROBLEM', problem: nextFixture });
      expect(newState.activeProblem).toBe(nextFixture);
    });

    it('strictly preserves activeProblem reference across SET_MODE with explicit fixture', () => {
      const state = createInitialState({ mode: 'concrete' });
      const picFixture = generateSubitizeProblem(8);
      const newState = gameReducer(state, { type: 'SET_MODE', mode: 'pictorial', problem: picFixture });
      expect(newState.activeProblem).toBe(picFixture);
      expect(newState.mode).toBe('pictorial');
    });

    it('strictly preserves activeProblem reference across SET_STAGE with explicit fixture', () => {
      const state = createInitialState({ mode: 'abstract', stage: 1 });
      const stage2Fixture = generateFriendsOfTenBond();
      const newState = gameReducer(state, { type: 'SET_STAGE', stage: 2, problem: stage2Fixture });
      expect(newState.activeProblem).toBe(stage2Fixture);
      expect(newState.stage).toBe(2);
    });

    it('maintains activeProblem reference equality during SUBMIT_ANSWER (correct and incorrect)', () => {
      const problem = generateNumberBond({ minWhole: 10, maxWhole: 10, missing: 'partB' });
      const state = createInitialState({ activeProblem: problem });
      expect(state.activeProblem).toBe(problem);

      // Incorrect submission
      const wrongAnswer = problem.answer + 1;
      const stateAfterWrong = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: wrongAnswer });
      expect(stateAfterWrong.activeProblem).toBe(problem);
      expect(stateAfterWrong.lastAnswerFeedback).toBe('incorrect');
      expect(stateAfterWrong.consecutiveErrors).toBe(1);

      // Correct submission
      const stateAfterRight = gameReducer(stateAfterWrong, { type: 'SUBMIT_ANSWER', answer: problem.answer });
      expect(stateAfterRight.activeProblem).toBe(problem);
      expect(stateAfterRight.lastAnswerFeedback).toBe('correct');
      expect(stateAfterRight.streak).toBe(1);
    });

    it('maintains activeProblem reference equality during manipulative grid actions', () => {
      const problem = generateSubitizeProblem(5);
      const state = createInitialState({ activeProblem: problem });

      const s1 = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });
      expect(s1.activeProblem).toBe(problem);

      const s2 = gameReducer(s1, { type: 'PLACE_COUNTER', slotIndex: 1, color: 'black' });
      expect(s2.activeProblem).toBe(problem);

      const s3 = gameReducer(s2, { type: 'MOVE_COUNTER', fromIndex: 0, toIndex: 4 });
      expect(s3.activeProblem).toBe(problem);

      const s4 = gameReducer(s3, { type: 'REMOVE_COUNTER', slotIndex: 1 });
      expect(s4.activeProblem).toBe(problem);

      const s5 = gameReducer(s4, { type: 'CLEAR_FRAME' });
      expect(s5.activeProblem).toBe(problem);

      const s6 = gameReducer(s5, { type: 'SET_CAPACITY', capacity: 20 });
      expect(s6.activeProblem).toBe(problem);
    });
  });

  describe('Task 3: Boundary Inputs and Stress Conditions', () => {
    it('handles zero partition number bonds (expected answer = 0)', () => {
      const zeroPartBond = createNumberBondProblem({
        id: 'nb-zero',
        whole: 5,
        partA: 5,
        partB: 0,
        missing: 'partB',
        answer: 0,
      });
      expect(zeroPartBond.answer).toBe(0);
      expect(getCorrectAnswer(zeroPartBond)).toBe(0);
      expect(evaluateAnswer(zeroPartBond, 0)).toBe(true);
      expect(evaluateAnswer(zeroPartBond, 1)).toBe(false);

      // Raw fixture without answer property, missing partB = 0
      const rawZeroPart = {
        id: 'raw-zero',
        whole: 7,
        partA: 7,
        partB: 0,
        missing: 'partB',
      } as unknown as ActiveProblem;
      expect(getCorrectAnswer(rawZeroPart)).toBe(0);
      expect(evaluateAnswer(rawZeroPart, 0)).toBe(true);
      expect(evaluateAnswer(rawZeroPart, 1)).toBe(false);
    });

    it('handles subtraction equations with zero result (expected answer = 0)', () => {
      const zeroEq = createEquationProblem({
        id: 'eq-zero',
        operand1: 4,
        operator: '-',
        operand2: 4,
        result: 0,
        missing: 'result',
        answer: 0,
      });
      expect(zeroEq.answer).toBe(0);
      expect(getCorrectAnswer(zeroEq)).toBe(0);
      expect(evaluateAnswer(zeroEq, 0)).toBe(true);
      expect(evaluateAnswer(zeroEq, 1)).toBe(false);

      // Raw equation without answer property
      const rawZeroEq = {
        id: 'raw-eq-zero',
        operand1: 6,
        operator: '-',
        operand2: 6,
        result: 0,
        missing: 'result',
      } as unknown as ActiveProblem;
      expect(getCorrectAnswer(rawZeroEq)).toBe(0);
      expect(evaluateAnswer(rawZeroEq, 0)).toBe(true);
    });

    it('evaluates answers against null or empty problems safely', () => {
      expect(getCorrectAnswer(null)).toBeNull();
      expect(evaluateAnswer(null, 0)).toBe(false);
      expect(evaluateAnswer(null, 5)).toBe(false);

      expect(getCorrectAnswer(undefined as unknown as ActiveProblem)).toBeNull();
      expect(evaluateAnswer(undefined as unknown as ActiveProblem, 0)).toBe(false);

      expect(getCorrectAnswer({} as unknown as ActiveProblem)).toBeNull();
      expect(evaluateAnswer({} as unknown as ActiveProblem, 0)).toBe(false);
    });

    it('evaluates answers with pathological user input values (NaN, Infinity, negative, float)', () => {
      const problem = generateSubitizeProblem(5);
      expect(evaluateAnswer(problem, NaN)).toBe(false);
      expect(evaluateAnswer(problem, Infinity)).toBe(false);
      expect(evaluateAnswer(problem, -Infinity)).toBe(false);
      expect(evaluateAnswer(problem, -5)).toBe(false);
      expect(evaluateAnswer(problem, 5.0001)).toBe(false);
    });

    it('survives method destructuring and detachment of validate & getExpectedAnswer', () => {
      const sub = generateSubitizeProblem(8);
      const { validate: validateSub, getExpectedAnswer: getSubAns } = sub;
      expect(getSubAns()).toBe(8);
      expect(validateSub(8)).toBe(true);
      expect(validateSub(7)).toBe(false);

      const nb = generateNumberBond({ minWhole: 10, maxWhole: 10, missing: 'partA' });
      const { validate: validateNb, getExpectedAnswer: getNbAns } = nb;
      expect(getNbAns()).toBe(nb.partA);
      expect(validateNb(nb.partA)).toBe(true);

      const eq = generateEquation({ operator: '+', missing: 'result' });
      const { validate: validateEq, getExpectedAnswer: getEqAns } = eq;
      expect(getEqAns()).toBe(eq.result);
      expect(validateEq(eq.result)).toBe(true);
    });

    it('scores correctly in concrete mode when activeProblem is null', () => {
      let state = createInitialState({ mode: 'concrete' });
      expect(state.activeProblem).toBeNull();

      // Place 4 counters on the grid
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 0, color: 'red' });
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 1, color: 'red' });
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 2, color: 'black' });
      state = gameReducer(state, { type: 'PLACE_COUNTER', slotIndex: 3, color: 'black' });
      expect(state.grid.totalCount).toBe(4);

      // Submit 4 (correct count)
      const correctState = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 4 });
      expect(correctState.lastAnswerFeedback).toBe('correct');
      expect(correctState.streak).toBe(1);
      expect(correctState.score).toBeGreaterThan(0);

      // Submit 3 (incorrect count)
      const incorrectState = gameReducer(state, { type: 'SUBMIT_ANSWER', answer: 3 });
      expect(incorrectState.lastAnswerFeedback).toBe('incorrect');
      expect(incorrectState.streak).toBe(0);
    });

    it('fuzzes 100 random problems of each generator type verifying polymorphic self-consistency', () => {
      for (let i = 0; i < 100; i++) {
        // Subitize
        const sub = generateSubitizeProblem();
        const subAns = sub.getExpectedAnswer();
        expect(sub.validate(subAns)).toBe(true);
        expect(sub.validate(subAns + 1)).toBe(false);
        expect(getCorrectAnswer(sub)).toBe(subAns);
        expect(evaluateAnswer(sub, subAns)).toBe(true);

        // Number Bond
        const nb = generateNumberBond({ allowZero: true });
        const nbAns = nb.getExpectedAnswer();
        expect(nb.validate(nbAns)).toBe(true);
        expect(nb.validate(nbAns + 1)).toBe(false);
        expect(getCorrectAnswer(nb)).toBe(nbAns);
        expect(evaluateAnswer(nb, nbAns)).toBe(true);

        // Equation
        const eq = generateEquation({ allowZero: true });
        const eqAns = eq.getExpectedAnswer();
        expect(eq.validate(eqAns)).toBe(true);
        expect(eq.validate(eqAns + 1)).toBe(false);
        expect(getCorrectAnswer(eq)).toBe(eqAns);
        expect(evaluateAnswer(eq, eqAns)).toBe(true);
      }
    });

    it('verifies generateProblemForMode generates fully polymorphic problems across all modes and stages', () => {
      const stages = [1, 2, 3, 4] as const;
      for (const stage of stages) {
        // Concrete mode
        const concreteP = generateProblemForMode('concrete', stage);
        expect(concreteP).toBeNull();

        // Pictorial mode
        const pictorialP = generateProblemForMode('pictorial', stage) as DomainProblem;
        expect(pictorialP).not.toBeNull();
        expect(pictorialP.type).toBe('subitize');
        expect(typeof pictorialP.validate).toBe('function');
        expect(typeof pictorialP.getExpectedAnswer).toBe('function');
        expect(pictorialP.validate(pictorialP.getExpectedAnswer())).toBe(true);

        // Abstract mode
        const abstractP = generateProblemForMode('abstract', stage) as DomainProblem;
        expect(abstractP).not.toBeNull();
        expect(abstractP.type === 'number-bond' || abstractP.type === 'equation').toBe(true);
        expect(typeof abstractP.validate).toBe('function');
        expect(typeof abstractP.getExpectedAnswer).toBe('function');
        expect(abstractP.validate(abstractP.getExpectedAnswer())).toBe(true);
      }
    });
  });
});
