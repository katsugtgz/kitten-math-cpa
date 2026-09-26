import React, { useState, useEffect, useCallback } from 'react';
import type { GameState, GameAction } from '../../state/types';
import type { NumberBondProblem, EquationProblem } from '../../domain/types';
import { KittenMascot } from '../common/KittenMascot';
import { NumberBondTree } from './NumberBondTree';
import { EquationDisplay } from './EquationDisplay';
import { VirtualKeypad } from './VirtualKeypad';
import { TypoText } from '../common/TypoText';
import type { MascotEmotion, MascotPawState } from '../common/KittenMascot';

export interface AbstractModeViewProps {
  readonly state: GameState;
  readonly dispatch: React.Dispatch<GameAction>;
}

function getMascotDetails(
  isAnswered: boolean,
  isCorrect: boolean
): { emotion: MascotEmotion; pawState: MascotPawState; speech: string } {
  if (!isAnswered) {
    return { emotion: 'peeking', pawState: 'waving', speech: 'What number belongs in the box?' };
  }
  if (isCorrect) {
    return { emotion: 'cheering', pawState: 'both-raised', speech: 'Awesome math wizard!' };
  }
  return { emotion: 'thinking', pawState: 'resting', speech: 'Keep trying! You got this!' };
}

function renderProblem(
  problem: GameState['activeProblem'],
  currentInput: string,
  isAnswered: boolean,
  isCorrect: boolean
): React.JSX.Element | null {
  if (!problem) return null;

  if (problem.type === 'number-bond') {
    const bond = problem as NumberBondProblem;
    return (
      <NumberBondTree
        whole={bond.whole}
        partA={bond.partA}
        partB={bond.partB}
        missing={bond.missing}
        currentInput={currentInput}
        isCorrect={isAnswered ? isCorrect : null}
      />
    );
  }

  if (problem.type === 'equation') {
    const eq = problem as EquationProblem;
    return (
      <EquationDisplay
        problem={eq}
        currentInput={currentInput}
        isCorrect={isAnswered ? isCorrect : null}
      />
    );
  }

  return null;
}

export function AbstractModeView({
  state,
  dispatch,
}: AbstractModeViewProps): React.JSX.Element {
  const [currentInput, setCurrentInput] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const activeProblem = state.activeProblem;
  const isAnswered = state.lastAnswerFeedback !== null;
  const isCorrect = state.lastAnswerFeedback === 'correct';

  const mascot = getMascotDetails(isAnswered && !isRetrying, isCorrect);

  const handleDigit = useCallback(
    (digit: number): void => {
      if (isCorrect) return;
      if (state.lastAnswerFeedback === 'incorrect' && !isRetrying) {
        setIsRetrying(true);
        setCurrentInput(String(digit));
        return;
      }
      setCurrentInput((prev) => (prev.length < 3 ? prev + String(digit) : prev));
    },
    [isCorrect, state.lastAnswerFeedback, isRetrying]
  );

  const handleDelete = useCallback((): void => {
    if (isCorrect) return;
    if (state.lastAnswerFeedback === 'incorrect' && !isRetrying) {
      setIsRetrying(true);
      setCurrentInput('');
      return;
    }
    setCurrentInput((prev) => prev.slice(0, -1));
  }, [isCorrect, state.lastAnswerFeedback, isRetrying]);

  const handleSubmit = useCallback((): void => {
    if (isCorrect || currentInput === '' || !activeProblem) return;
    const num = Number(currentInput);
    setIsRetrying(false);
    dispatch({ type: 'SUBMIT_ANSWER', answer: num });
  }, [isCorrect, currentInput, activeProblem, dispatch]);

  const handleRetry = (): void => {
    setIsRetrying(true);
    setCurrentInput('');
  };

  const handleNextProblem = (): void => {
    setIsRetrying(false);
    setCurrentInput('');
    dispatch({ type: 'NEXT_PROBLEM' });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(Number(e.key));
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleSubmit]);

  return (
    <div
      data-testid="abstract-mode-view"
      className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto"
    >
      <div className="text-center">
        <span className="text-xs uppercase tracking-wider font-extrabold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
          ✏️ Abstract Mode: Symbolic Equations
        </span>
        <h2 className="text-lg font-bold text-slate-800 mt-2">
          <TypoText>Solve the mathematical equation!</TypoText>
        </h2>
        <p className="text-xs text-slate-500">
          <TypoText>Find the missing number using your ten-frame knowledge.</TypoText>
        </p>
      </div>

      <KittenMascot
        coat="white"
        emotion={mascot.emotion}
        pawState={mascot.pawState}
        size="md"
        speechBubble={mascot.speech}
      />

      {renderProblem(activeProblem, currentInput, isAnswered && !isRetrying, isCorrect)}

      {state.scaffoldActive && (
        <div
          role="status"
          className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs flex items-center gap-2 max-w-md w-full shadow-sm"
        >
          <span className="text-xl">💡</span>
          <span>
            <TypoText>Hint: Think of making ten! 10 plus the remaining ones gives the teen number.</TypoText>
          </span>
        </div>
      )}

      {isCorrect ? (
        <div className="flex flex-col items-center gap-3 animate-fade-in w-full max-w-xs">
          <div
            role="status"
            className="text-sm font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2 w-full bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <span>✨ Bravo! Correct equation!</span>
          </div>

          <button
            type="button"
            onClick={handleNextProblem}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-base rounded-2xl shadow-md transition-colors"
          >
            Next Problem →
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          {isAnswered && !isRetrying && (
            <div className="flex flex-col items-center gap-2 w-full max-w-xs animate-fade-in">
              <div
                role="status"
                className="text-sm font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2 w-full bg-rose-50 text-rose-700 border border-rose-200"
              >
                <span>❌ Try reviewing the parts of the number.</span>
              </div>
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm rounded-xl shadow transition-colors"
                >
                  Try Again 🔄
                </button>
                <button
                  type="button"
                  onClick={handleNextProblem}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow transition-colors"
                >
                  Next Problem →
                </button>
              </div>
            </div>
          )}

          <VirtualKeypad
            onDigit={handleDigit}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
            disabled={isCorrect}
          />
        </div>
      )}
    </div>
  );
}
