import React, { useState } from 'react';
import type { GameState, GameAction } from '../../state/types';
import type { SubitizeProblem } from '../../domain/types';
import { KittenCard } from './KittenCard';
import { TypoText } from '../common/TypoText';
import type { MascotCoat, MascotEmotion, MascotPawState } from '../common/KittenMascot';
import { useAudio } from '../../services/audio/use-audio';

export interface PictorialModeViewProps {
  readonly state: GameState;
  readonly dispatch: React.Dispatch<GameAction>;
}

function getOptionStyle(
  opt: number,
  selectedAnswer: number | null,
  targetCount: number,
  isAnswered: boolean,
  isCorrect: boolean
): string {
  if (!isAnswered) {
    return 'bg-white text-slate-800 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50';
  }
  if (isCorrect && opt === targetCount) {
    return 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300';
  }
  if (selectedAnswer === opt && !isCorrect) {
    return 'bg-rose-500 text-white border-rose-600 shadow-md ring-2 ring-rose-300';
  }
  if (isCorrect) {
    return 'bg-slate-100 text-slate-400 border-slate-200 opacity-60';
  }
  return 'bg-white text-slate-800 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50';
}

function getMascotProps(
  isAnswered: boolean,
  isCorrect: boolean,
  stage: number
): { coat: MascotCoat; emotion: MascotEmotion; pawState: MascotPawState; speech: string } {
  const coat: MascotCoat = stage === 1 ? 'calico' : stage === 2 ? 'tabby' : 'white';
  if (!isAnswered) {
    return { coat, emotion: 'peeking', pawState: 'waving', speech: 'Can you tell how many?' };
  }
  if (isCorrect) {
    return { coat, emotion: 'cheering', pawState: 'both-raised', speech: 'Purr-fect! You got it!' };
  }
  return { coat, emotion: 'thinking', pawState: 'resting', speech: 'Nice try! Look closely at the rows!' };
}

export function PictorialModeView({
  state,
  dispatch,
}: PictorialModeViewProps): React.JSX.Element {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const { audio } = useAudio();

  const activeProblem = state.activeProblem as SubitizeProblem | null;
  const isAnswered = state.lastAnswerFeedback !== null;
  const isCorrect = state.lastAnswerFeedback === 'correct';
  const isFeedbackVisible = isAnswered && !isRetrying;

  const mascot = getMascotProps(isFeedbackVisible, isCorrect, state.stage);

  const handleSelectOption = (option: number): void => {
    if (isCorrect) return;
    setIsRetrying(false);
    setSelectedAnswer(option);
    dispatch({ type: 'SUBMIT_ANSWER', answer: option });
  };

  const handleRetry = (): void => {
    audio.playButtonClick();
    setIsRetrying(true);
    setSelectedAnswer(null);
  };

  const handleNextProblem = (): void => {
    setIsRetrying(false);
    setSelectedAnswer(null);
    dispatch({ type: 'NEXT_PROBLEM' });
  };

  return (
    <div
      data-testid="pictorial-mode-view"
      className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto"
    >
      <div className="text-center">
        <span className="text-xs uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          👀 Pictorial Mode: Flash Card Challenge
        </span>
        <h2 className="text-lg font-bold text-slate-800 mt-2">
          <TypoText>How many counters does the kitten see?</TypoText>
        </h2>
        <p className="text-xs text-slate-500">
          <TypoText>Recognize the patterns quickly without counting one by one!</TypoText>
        </p>
      </div>

      {/* Ten-Frame Flash Card Matching asdasd.png */}
      <div className="transform hover:scale-[1.02] transition-transform">
        <KittenCard
          grid={activeProblem?.grid ?? state.grid}
          coat={mascot.coat}
          emotion={mascot.emotion}
          pawState={mascot.pawState}
          speechBubble={mascot.speech}
        />
      </div>

      {/* Dynamic Pedagogical Scaffolding Hint */}
      {state.scaffoldActive && (
        <div
          role="status"
          className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs flex items-center gap-2 max-w-md w-full shadow-sm"
        >
          <span className="text-xl">💡</span>
          <span>
            <TypoText>Hint: Think of making ten! Look at the full row of 5 to count on.</TypoText>
          </span>
        </div>
      )}

      {/* Multiple-Choice Answer Buttons */}
      {activeProblem && (
        <div className="w-full max-w-md">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {activeProblem.options.map((opt) => (
              <button
                key={`subitize-opt-${opt}`}
                type="button"
                aria-label={`Select ${opt} counters`}
                disabled={isCorrect}
                onClick={() => handleSelectOption(opt)}
                className={`py-3.5 sm:py-4 rounded-2xl text-xl sm:text-2xl font-mono font-extrabold border-2 shadow-sm transition-colors active:scale-95 flex items-center justify-center ${getOptionStyle(
                  opt,
                  isRetrying ? null : selectedAnswer,
                  activeProblem.targetCount,
                  isFeedbackVisible,
                  isCorrect
                )}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Post-Answer Feedback and Next Button */}
      {isFeedbackVisible && (
        <div className="flex flex-col items-center gap-3 animate-fade-in w-full max-w-md">
          <div
            role="status"
            className={`text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 ${
              isCorrect
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {isCorrect ? (
              <span>✨ Excellent! Count is {activeProblem?.targetCount}!</span>
            ) : (
              <span>❌ Not quite! Look closely at the pattern.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isCorrect ? (
              <button
                type="button"
                onClick={handleNextProblem}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
              >
                Next Flash Card →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRetry}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
              >
                Try Again 🔄
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
