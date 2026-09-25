import React from 'react';
import { AnimatedNumber } from '../common/AnimatedNumber';

export interface ScoreBarProps {
  readonly score: number;
  readonly streak: number;
  readonly bestStreak: number;
}

export function ScoreBar({
  score,
  streak,
  bestStreak,
}: ScoreBarProps): React.JSX.Element {
  // Next milestone target: 3, 5, or 10
  const nextMilestone = streak < 3 ? 3 : streak < 5 ? 5 : 10;
  const progressPercent = Math.min(100, Math.round((streak / nextMilestone) * 100));

  return (
    <div
      role="region"
      aria-label="Player Progress and Streak Meter"
      className="w-full max-w-4xl mx-auto bg-white/70 backdrop-blur border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-sm flex items-center justify-between gap-4 flex-wrap"
    >
      {/* Streak Progress Meter */}
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
          <span>Streak Goal: {nextMilestone} in a row</span>
          <span className="font-mono text-indigo-600 font-extrabold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-[width] duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
        <div>
          Best Streak:{' '}
          <strong className="text-amber-600 font-mono">
            <AnimatedNumber value={bestStreak} />
          </strong>
        </div>
        <div className="h-4 w-[1px] bg-slate-200" />
        <div>
          Total Points:{' '}
          <strong className="text-indigo-600 font-mono">
            <AnimatedNumber value={score} />
          </strong>
        </div>
      </div>
    </div>
  );
}
