import React from 'react';
import type { GameMode, StageLevel } from '../../state/types';
import { useAudio } from '../../services/audio/use-audio';

export interface StageSelectorProps {
  readonly mode: GameMode;
  readonly stage: StageLevel;
  readonly onModeChange: (m: GameMode) => void;
  readonly onStageChange: (s: StageLevel) => void;
}

const MODES: readonly { id: GameMode; label: string; icon: string }[] = [
  { id: 'concrete', label: 'Concrete', icon: '🧱' },
  { id: 'pictorial', label: 'Pictorial', icon: '🎨' },
  { id: 'abstract', label: 'Abstract', icon: '✏️' },
];

const STAGES: readonly { level: StageLevel; label: string; desc: string }[] = [
  { level: 1, label: '1', desc: 'Numbers 1-5' },
  { level: 2, label: '2', desc: 'Numbers 1-10' },
  { level: 3, label: '3', desc: 'Teens 10-20' },
  { level: 4, label: '4', desc: 'Mastery 1-20' },
];

export function StageSelector({
  mode,
  stage,
  onModeChange,
  onStageChange,
}: StageSelectorProps): React.JSX.Element {
  const { audio } = useAudio();

  const handleMode = (m: GameMode): void => {
    audio.playButtonClick();
    onModeChange(m);
  };

  const handleStage = (s: StageLevel): void => {
    audio.playButtonClick();
    onStageChange(s);
  };

  return (
    <nav
      aria-label="CPA Mode and Stage Selection"
      className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-3xl border border-slate-200 shadow-sm w-full max-w-4xl mx-auto"
    >
      {/* CPA Mode Tabs */}
      <div
        role="tablist"
        aria-label="Game Modes"
        className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto"
      >
        {MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={`mode-tab-${m.id}`}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => handleMode(m.id)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-colors ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-sm ring-2 ring-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stage Level Buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1">
          Stage:
        </span>
        <div className="flex items-center gap-1.5">
          {STAGES.map((s) => {
            const isActive = stage === s.level;
            return (
              <button
                key={`stage-btn-${s.level}`}
                type="button"
                aria-label={`Stage ${s.level}: ${s.desc}`}
                aria-pressed={isActive}
                onClick={() => handleStage(s.level)}
                className={`w-9 h-9 rounded-xl font-mono font-black text-xs transition-colors active:scale-95 ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300 scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {s.level}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
