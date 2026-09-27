import React, { useState, useRef } from 'react';
import type { TenFrameGrid as DomainTenFrameGrid } from '../../domain/types';
import type { CounterColor, GameAction } from '../../state/types';
import { TenFrameGrid } from './TenFrameGrid';
import { PaperTray } from './PaperTray';
import { TactileCounter } from '../common/TactileCounter';
import { useAudio } from '../../services/audio/use-audio';

export interface ManipulativeWorkbenchProps {
  readonly grid: DomainTenFrameGrid;
  readonly dispatch: React.Dispatch<GameAction>;
  readonly selectedColor?: CounterColor;
  readonly onSelectColor?: (color: CounterColor) => void;
}

/**
 * Deep Concrete Manipulative Workbench Module.
 *
 * Encapsulates TenFrameGrid, PaperTray, coordinate geometry, touch drag physics,
 * and slot interaction behind a minimal { grid, dispatch } seam.
 */
export function ManipulativeWorkbench({
  grid,
  dispatch,
  selectedColor: controlledColor,
  onSelectColor: controlledOnSelectColor,
}: ManipulativeWorkbenchProps): React.JSX.Element {
  const { audio } = useAudio();
  const [internalColor, setInternalColor] = useState<CounterColor>('red');

  const currentColor = controlledColor ?? internalColor;
  const handleColorChange = (color: CounterColor): void => {
    if (controlledOnSelectColor) {
      controlledOnSelectColor(color);
    } else {
      setInternalColor(color);
    }
  };

  const [touchDrag, setTouchDrag] = useState<{
    color: CounterColor;
    x: number;
    y: number;
    sourceIndex?: number;
  } | null>(null);

  const [touchHoverSlot, setTouchHoverSlot] = useState<number | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTouchDragging = useRef<boolean>(false);

  const handleSlotClick = (index: number): void => {
    const isOccupied = grid.cells[index] !== 'empty';
    if (isOccupied) {
      dispatch({ type: 'REMOVE_COUNTER', slotIndex: index });
    } else {
      dispatch({ type: 'PLACE_COUNTER', slotIndex: index, color: currentColor });
    }
  };

  const handleDropCounter = (index: number, color: CounterColor): void => {
    dispatch({ type: 'PLACE_COUNTER', slotIndex: index, color });
  };

  const handleMoveCounter = (fromIndex: number, toIndex: number): void => {
    const sourceCell = grid.cells[fromIndex];
    if (sourceCell === 'empty') return;
    dispatch({ type: 'MOVE_COUNTER', fromIndex, toIndex });
  };

  const handleTouchStart = (
    e: React.TouchEvent,
    _color: CounterColor,
    _sourceIndex?: number
  ): void => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isTouchDragging.current = false;
  };

  const handleTouchMove = (
    e: React.TouchEvent,
    color: CounterColor,
    sourceIndex?: number
  ): void => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;

    if (!isTouchDragging.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isTouchDragging.current = true;
    }

    if (isTouchDragging.current) {
      setTouchDrag({
        color,
        x: touch.clientX,
        y: touch.clientY,
        sourceIndex,
      });

      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      const slotBtn = elem?.closest('[data-slot-index]');
      if (slotBtn) {
        const slotIdx = Number(slotBtn.getAttribute('data-slot-index'));
        setTouchHoverSlot(slotIdx);
      } else {
        setTouchHoverSlot(null);
      }
    }
  };

  const handleTouchEnd = (
    e: React.TouchEvent,
    color: CounterColor,
    sourceIndex?: number
  ): void => {
    if (isTouchDragging.current) {
      const touch = e.changedTouches[0];
      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      const slotBtn = elem?.closest('[data-slot-index]');

      if (slotBtn) {
        const targetSlot = Number(slotBtn.getAttribute('data-slot-index'));
        if (sourceIndex !== undefined && sourceIndex !== targetSlot) {
          handleMoveCounter(sourceIndex, targetSlot);
        } else {
          handleDropCounter(targetSlot, color);
        }
      } else if (elem?.closest('[data-paper-tray]') && sourceIndex !== undefined) {
        handleSlotClick(sourceIndex);
      }
    }

    setTouchDrag(null);
    setTouchHoverSlot(null);
    isTouchDragging.current = false;
    touchStartPos.current = null;
  };

  const handleClear = (): void => {
    dispatch({ type: 'CLEAR_FRAME' });
  };

  const handleToggleCapacity = (): void => {
    audio.playButtonClick();
    dispatch({
      type: 'SET_CAPACITY',
      capacity: grid.capacity === 10 ? 20 : 10,
    });
  };

  const handleFillFive = (): void => {
    for (let i = 0; i < 5; i++) {
      if (grid.cells[i] === 'empty') {
        dispatch({ type: 'PLACE_COUNTER', slotIndex: i, color: currentColor });
      }
    }
  };

  const handleFillTen = (): void => {
    for (let i = 0; i < 10; i++) {
      if (grid.cells[i] === 'empty') {
        dispatch({ type: 'PLACE_COUNTER', slotIndex: i, color: currentColor });
      }
    }
  };

  return (
    <div
      data-testid="manipulative-workbench"
      className="flex flex-col items-center gap-6 w-full"
      style={{ touchAction: 'none' }}
    >
      {/* Interactive Ten-Frame Grid */}
      <TenFrameGrid
        grid={grid}
        selectedColor={currentColor}
        onSlotClick={handleSlotClick}
        onDropCounter={handleDropCounter}
        onMoveCounter={handleMoveCounter}
        externalDragOverIndex={touchHoverSlot}
        onTouchStartCounter={handleTouchStart}
        onTouchMoveCounter={handleTouchMove}
        onTouchEndCounter={handleTouchEnd}
      />

      {/* Origami Paper Tray with Loose Counters & Action Strip */}
      <PaperTray
        selectedColor={currentColor}
        onSelectColor={handleColorChange}
        currentCount={grid.totalCount}
        capacity={grid.capacity}
        onAddCounter={(color) => {
          const firstEmpty = grid.cells.findIndex((c) => c === 'empty');
          if (firstEmpty !== -1) {
            dispatch({ type: 'PLACE_COUNTER', slotIndex: firstEmpty, color });
          }
        }}
        onRemoveCounter={(slotIndex) => {
          dispatch({ type: 'REMOVE_COUNTER', slotIndex });
        }}
        onClearFrame={handleClear}
        onFillFive={handleFillFive}
        onFillTen={handleFillTen}
        onToggleCapacity={handleToggleCapacity}
        onTouchStartCounter={handleTouchStart}
        onTouchMoveCounter={handleTouchMove}
        onTouchEndCounter={handleTouchEnd}
      />

      {/* Floating Counter Ghost on Touch Drag */}
      {touchDrag && (
        <div
          data-testid="floating-touch-chip"
          className="fixed pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-50 transition-none scale-110 shadow-2xl"
          style={{
            left: `${touchDrag.x}px`,
            top: `${touchDrag.y}px`,
          }}
        >
          <TactileCounter color={touchDrag.color} size="md" animated={false} />
        </div>
      )}
    </div>
  );
}
