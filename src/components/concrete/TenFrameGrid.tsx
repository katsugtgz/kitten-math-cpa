import React, { useState } from 'react';
import type { TenFrameGrid as DomainTenFrameGrid, CounterColor } from '../../domain/types';
import { TactileCounter } from '../common/TactileCounter';

export interface TenFrameGridProps {
  readonly grid: DomainTenFrameGrid;
  readonly selectedColor?: CounterColor;
  readonly onSlotClick?: (index: number) => void;
  readonly onDropCounter?: (index: number, color: CounterColor) => void;
  readonly className?: string;
  readonly interactive?: boolean;
}

export function TenFrameGrid({
  grid,
  selectedColor = 'red',
  onSlotClick,
  onDropCounter,
  className = '',
  interactive = true,
}: TenFrameGridProps): React.JSX.Element {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const frame1Indices = Array.from({ length: 10 }, (_, i) => i);
  const frame2Indices =
    grid.capacity === 20 ? Array.from({ length: 10 }, (_, i) => i + 10) : [];

  const handleDragOver = (e: React.DragEvent, index: number): void => {
    if (!interactive) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (index: number): void => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number): void => {
    if (!interactive) return;
    e.preventDefault();
    setDragOverIndex(null);
    const color = (e.dataTransfer.getData('text/plain') as CounterColor) || selectedColor;
    if (color === 'red' || color === 'black') {
      if (onDropCounter) {
        onDropCounter(index, color);
      } else {
        onSlotClick?.(index);
      }
    }
  };

  const renderFrame = (indices: number[], frameTitle: string): React.JSX.Element => (
    <div className="flex flex-col gap-1.5 w-full max-w-lg">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          {frameTitle}
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          {indices.filter((i) => grid.cells[i] !== 'empty').length} / 10
        </span>
      </div>

      <div
        className="bg-white border-4 border-slate-700 rounded-2xl p-2 sm:p-3 shadow-md"
        style={{
          boxShadow: '0 6px 12px -2px rgba(15, 23, 42, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="grid grid-cols-5 gap-2 sm:gap-3 bg-slate-100 p-2 rounded-xl border border-slate-200">
          {indices.map((index) => {
            const cellState = grid.cells[index];
            const isOccupied = cellState !== 'empty';
            const isHovered = dragOverIndex === index;

            return (
              <button
                key={`grid-slot-${index}`}
                type="button"
                aria-label={`Slot ${index + 1}: ${cellState}`}
                disabled={!interactive}
                onClick={() => onSlotClick?.(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={() => handleDragLeave(index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`relative aspect-square w-12 sm:w-16 rounded-xl flex items-center justify-center transition-colors ${
                  isOccupied
                    ? 'bg-white shadow-sm'
                    : 'bg-white/80 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40'
                } ${isHovered ? 'ring-2 ring-indigo-500 bg-indigo-50 scale-105' : ''} ${
                  interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'
                }`}
              >
                {/* Slot index watermark */}
                {!isOccupied && (
                  <span className="absolute text-[10px] sm:text-xs font-mono font-bold text-slate-300 select-none">
                    {index + 1}
                  </span>
                )}

                {/* Tactile Counter if occupied */}
                {isOccupied && (
                  <TactileCounter
                    color={cellState as CounterColor}
                    size="md"
                    animated
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div
      role="region"
      aria-label={`Interactive Ten-Frame Grid, capacity ${grid.capacity}`}
      className={`flex flex-col items-center gap-4 w-full ${className}`}
    >
      {renderFrame(frame1Indices, grid.capacity === 20 ? 'Frame 1 (1-10)' : 'Ten-Frame (1-10)')}
      {grid.capacity === 20 && renderFrame(frame2Indices, 'Frame 2 (11-20)')}
    </div>
  );
}
