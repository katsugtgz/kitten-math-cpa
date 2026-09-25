import React, { useEffect } from 'react';
import { KittenMascot } from '../common/KittenMascot';
import { soundService } from '../../services/sound-service';

export interface CelebrationModalProps {
  readonly isOpen: boolean;
  readonly streak: number;
  readonly milestone: 3 | 5 | 10 | null;
  readonly onDismiss: () => void;
}

export function CelebrationModal({
  isOpen,
  streak,
  milestone,
  onDismiss,
}: CelebrationModalProps): React.JSX.Element | null {
  useEffect(() => {
    if (isOpen) {
      soundService.playCelebrationFanfare();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const milestoneTitle =
    milestone === 10
      ? '🌟 Grand Mastery Milestone! 🌟'
      : milestone === 5
        ? '🔥 Super Math Star! 5-in-a-Row! 🔥'
        : '🎉 Awesome Streak! 3-in-a-Row! 🎉';

  const milestoneDesc =
    milestone === 10
      ? 'You mastered ten-frame math! The kitten is purring with pure joy!'
      : milestone === 5
        ? 'Five correct in a row! Your number sense is super sharp!'
        : 'Three in a row! You are on a roll, keep up the fantastic work!';

  return (
    <dialog
      open={isOpen}
      aria-labelledby="celebration-title"
      data-testid="celebration-modal"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onDismiss();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in w-full h-full border-none max-w-none max-h-none m-0"
    >
      <div className="relative bg-white border-4 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-[spring-pop_350ms_var(--ease-spring-pop)]">
        {/* Floating Celebration Stars */}
        <div aria-hidden="true" className="absolute -top-6 left-6 text-3xl animate-bounce">
          ⭐
        </div>
        <div aria-hidden="true" className="absolute -top-6 right-6 text-3xl animate-bounce">
          🌟
        </div>

        {/* Cheering Mascot */}
        <div className="mb-2">
          <KittenMascot
            coat="calico"
            emotion="cheering"
            pawState="both-raised"
            size="lg"
            speechBubble="YOU DID IT! HOORAY!"
          />
        </div>

        {/* Milestone Headline */}
        <h2
          id="celebration-title"
          className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mt-2"
        >
          {milestoneTitle}
        </h2>

        {/* Streak Badge */}
        <div className="my-3 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-sm font-extrabold flex items-center gap-1.5">
          <span>🔥</span>
          <span>{streak} Problem Streak</span>
        </div>

        <p className="text-sm text-slate-600 mb-6 font-medium max-w-xs">
          {milestoneDesc}
        </p>

        {/* Continue Button */}
        <button
          type="button"
          onClick={() => {
            soundService.playButtonClick();
            onDismiss();
          }}
          autoFocus
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          Continue Playing 🐾
        </button>
      </div>
    </dialog>
  );
}
