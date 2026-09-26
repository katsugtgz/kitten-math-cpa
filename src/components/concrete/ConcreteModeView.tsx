import React from 'react';
import type { GameState, GameAction, CounterColor } from '../../state/types';
import { KittenMascot } from '../common/KittenMascot';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { ManipulativeWorkbench } from './ManipulativeWorkbench';
import { useAudio } from '../../services/audio/audio-context';

export interface ConcreteModeViewProps {
  readonly state: GameState;
  readonly dispatch: React.Dispatch<GameAction>;
  readonly selectedColor?: CounterColor;
  readonly onSelectColor?: (c: CounterColor) => void;
}

/**
 * Concrete Mode View (Singapore CPA Concrete Phase).
 *
 * Coordinates top-level motivational Kitten Mascot and live Counter Tally Bar,
 * delegating interactive tactile physics and frame manipulation to the deep
 * ManipulativeWorkbench module.
 */
export function ConcreteModeView({
  state,
  dispatch,
  selectedColor,
  onSelectColor,
}: ConcreteModeViewProps): React.JSX.Element {
  const { audio } = useAudio();

  const mascotEmotion =
    state.grid.totalCount >= state.grid.capacity
      ? 'cheering'
      : state.grid.totalCount > 0
        ? 'peeking'
        : 'thinking';

  const mascotPawState =
    state.grid.totalCount >= state.grid.capacity
      ? 'both-raised'
      : state.grid.totalCount > 0
        ? 'waving'
        : 'resting';

  const speechMessage =
    state.grid.totalCount === 0
      ? 'Place counters in the ten-frame!'
      : state.grid.totalCount >= state.grid.capacity
        ? 'Ten-frame is completely full! Awesome!'
        : `${state.grid.totalCount} counters placed so far!`;

  return (
    <div
      data-testid="concrete-mode-view"
      className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto"
    >
      {/* Top Banner with Kitten Mascot */}
      <div className="flex flex-col items-center">
        <KittenMascot
          emotion={mascotEmotion}
          pawState={mascotPawState}
          coat="calico"
          size="md"
          speechBubble={speechMessage}
          interactive
          onMascotClick={() => audio.playButtonClick()}
        />
      </div>

      {/* Real-time Counter Tally Bar */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex items-center justify-around">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-rose-500 shadow-sm" />
          <span className="text-xs font-bold text-slate-600">
            Red:{' '}
            <strong className="text-rose-600 font-mono text-sm">
              <AnimatedNumber value={state.grid.redCount} />
            </strong>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-slate-800 shadow-sm" />
          <span className="text-xs font-bold text-slate-600">
            Black:{' '}
            <strong className="text-slate-800 font-mono text-sm">
              <AnimatedNumber value={state.grid.blackCount} />
            </strong>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">
            Total:{' '}
            <strong className="text-indigo-600 font-mono text-base">
              <AnimatedNumber value={state.grid.totalCount} />
            </strong>{' '}
            / {state.grid.capacity}
          </span>
        </div>
      </div>

      {/* Deep Manipulative Workbench (TenFrameGrid + PaperTray + Drag & Touch Physics) */}
      <ManipulativeWorkbench
        grid={state.grid}
        dispatch={dispatch}
        selectedColor={selectedColor}
        onSelectColor={onSelectColor}
      />
    </div>
  );
}
