import React from 'react';
import type { GameState, GameAction, CounterColor } from '../../state/types';
import { KittenMascot } from '../common/KittenMascot';
import { TenFrameGrid } from './TenFrameGrid';
import { PaperTray } from './PaperTray';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { soundService } from '../../services/sound-service';

export interface ConcreteModeViewProps {
  readonly state: GameState;
  readonly dispatch: React.Dispatch<GameAction>;
  readonly selectedColor: CounterColor;
  readonly onSelectColor: (c: CounterColor) => void;
}

export function ConcreteModeView({
  state,
  dispatch,
  selectedColor,
  onSelectColor,
}: ConcreteModeViewProps): React.JSX.Element {
  const handleSlotClick = (index: number): void => {
    const isOccupied = state.grid.cells[index] !== 'empty';
    if (isOccupied) {
      soundService.playCounterRemove();
      dispatch({ type: 'REMOVE_COUNTER', slotIndex: index });
    } else {
      soundService.playCounterPlace(selectedColor === 'red');
      dispatch({ type: 'PLACE_COUNTER', slotIndex: index, color: selectedColor });
    }
  };

  const handleDropCounter = (index: number, color: CounterColor): void => {
    soundService.playCounterPlace(color === 'red');
    dispatch({ type: 'PLACE_COUNTER', slotIndex: index, color });
  };

  const handleClear = (): void => {
    soundService.playCounterRemove();
    dispatch({ type: 'CLEAR_FRAME' });
  };

  const handleToggleCapacity = (): void => {
    soundService.playButtonClick();
    dispatch({
      type: 'SET_CAPACITY',
      capacity: state.grid.capacity === 10 ? 20 : 10,
    });
  };

  const handleFillFive = (): void => {
    soundService.playCounterPlace(selectedColor === 'red');
    for (let i = 0; i < 5; i++) {
      if (state.grid.cells[i] === 'empty') {
        dispatch({ type: 'PLACE_COUNTER', slotIndex: i, color: selectedColor });
      }
    }
  };

  const handleFillTen = (): void => {
    soundService.playCounterPlace(selectedColor === 'red');
    for (let i = 0; i < 10; i++) {
      if (state.grid.cells[i] === 'empty') {
        dispatch({ type: 'PLACE_COUNTER', slotIndex: i, color: selectedColor });
      }
    }
  };

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
      {/* Top Banner with Kitten Mascot Peeking */}
      <div className="flex flex-col items-center">
        <KittenMascot
          emotion={mascotEmotion}
          pawState={mascotPawState}
          coat="calico"
          size="md"
          speechBubble={speechMessage}
          interactive
          onMascotClick={() => soundService.playButtonClick()}
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

      {/* Main Manipulative Ten-Frame Grid */}
      <TenFrameGrid
        grid={state.grid}
        selectedColor={selectedColor}
        onSlotClick={handleSlotClick}
        onDropCounter={handleDropCounter}
      />

      {/* Origami Paper Tray with Loose Counters & Number Track Strip */}
      <PaperTray
        selectedColor={selectedColor}
        onSelectColor={onSelectColor}
        currentCount={state.grid.totalCount}
        capacity={state.grid.capacity}
        onAddCounter={(color) => {
          // Find first empty slot and place counter
          const firstEmpty = state.grid.cells.findIndex((c) => c === 'empty');
          if (firstEmpty !== -1) {
            soundService.playCounterPlace(color === 'red');
            dispatch({ type: 'PLACE_COUNTER', slotIndex: firstEmpty, color });
          }
        }}
        onClearFrame={handleClear}
        onFillFive={handleFillFive}
        onFillTen={handleFillTen}
        onToggleCapacity={handleToggleCapacity}
      />
    </div>
  );
}
