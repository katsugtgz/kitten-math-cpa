import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { KittenMascot } from '../common/KittenMascot';

export interface HeaderProps {
  readonly score: number;
  readonly streak: number;
  readonly isMuted: boolean;
  readonly onToggleMute: () => void;
}

export function Header({
  score,
  streak,
  isMuted,
  onToggleMute,
}: HeaderProps): React.JSX.Element {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30 px-4 py-2.5 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-2">
        {/* Title and Mascot Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 overflow-hidden flex items-center justify-center rounded-xl bg-sky-100 border border-sky-300 shadow-inner">
            <KittenMascot size="sm" coat="calico" emotion="peeking" pawState="resting" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
              Kitten Math
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide">
              Singapore CPA Ten-Frame Adventure
            </p>
          </div>
        </div>

        {/* Controls and Counters */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors active:scale-95"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            )}
          </button>

          {/* Score Counter */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
              Score
            </span>
            <span className="text-lg sm:text-xl font-black text-indigo-600">
              <AnimatedNumber value={score} />
            </span>
          </div>

          <div className="h-7 w-[1px] bg-slate-200" />

          {/* Streak Counter */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
              Streak
            </span>
            <div className="flex items-center gap-1">
              <span className="text-lg sm:text-xl font-black text-amber-500">
                <AnimatedNumber value={streak} />
              </span>
              {streak >= 3 && (
                <span role="img" aria-label="Streak on fire" className="text-base animate-pulse">
                  🔥
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
