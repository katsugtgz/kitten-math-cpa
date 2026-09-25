import React from 'react';
import type { CounterColor, FrameCapacity } from '../../domain/types';
import { TactileCounter } from '../common/TactileCounter';

export interface PaperTrayProps {
  readonly selectedColor: CounterColor;
  readonly onSelectColor: (c: CounterColor) => void;
  readonly currentCount: number;
  readonly capacity: FrameCapacity;
  readonly onAddCounter?: (color: CounterColor) => void;
  readonly onClearFrame: () => void;
  readonly onFillFive?: () => void;
  readonly onFillTen?: () => void;
  readonly onToggleCapacity?: () => void;
}

export function PaperTray({
  selectedColor,
  onSelectColor,
  currentCount,
  capacity,
  onAddCounter,
  onClearFrame,
  onFillFive,
  onFillTen,
  onToggleCapacity,
}: PaperTrayProps): React.JSX.Element {
  const numberTrackLength = capacity;
  const numbers = Array.from({ length: numberTrackLength }, (_, i) => i + 1);

  return (
    <section
      aria-label="Origami Paper Tray Bank and Number Track"
      className="relative w-full max-w-2xl bg-white border-2 border-slate-300 rounded-3xl p-4 sm:p-5 shadow-md flex flex-col gap-4 overflow-hidden"
      style={{
        boxShadow:
          '0 8px 16px -2px rgba(15, 23, 42, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(15, 23, 42, 0.05)',
      }}
    >
      {/* Origami Box Diagonal Corner Fold Creases */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-8 h-8 border-r border-b border-slate-200 pointer-events-none -rotate-45 -translate-x-4 -translate-y-4"
      />
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-8 h-8 border-l border-b border-slate-200 pointer-events-none rotate-45 translate-x-4 -translate-y-4"
      />

      {/* Header with Title and Mode Indicator */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-extrabold text-slate-500">
            📦 Paper Tray Manipulatives
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Origami Bank
          </span>
        </div>
        <div className="text-xs font-bold text-slate-500">
          Capacity: <span className="text-indigo-600 font-mono">{capacity}</span>
        </div>
      </div>

      {/* Two-Bay Compartment (Manipulative Basin & Number Track Strip) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bay 1: Manipulative Basin (Loose Red & Black Counters) */}
        <div
          className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 flex flex-col justify-between relative shadow-inner"
          style={{ minHeight: '120px' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              Token Basin
            </span>
            <span className="text-[11px] text-slate-400">
              Active: <strong className="capitalize text-slate-700">{selectedColor}</strong>
            </span>
          </div>

          {/* Interactive Chips Selector & Stack */}
          <div className="flex items-center justify-around py-2">
            <button
              type="button"
              aria-label="Select and Add Red Counter"
              onClick={() => {
                onSelectColor('red');
                onAddCounter?.('red');
              }}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-transform ${
                selectedColor === 'red'
                  ? 'bg-rose-100/70 ring-2 ring-rose-500 scale-105'
                  : 'hover:bg-slate-200/50'
              }`}
            >
              <TactileCounter
                color="red"
                size="md"
                interactive
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', 'red');
                }}
              />
              <span className="text-xs font-bold text-rose-600">Red Chip</span>
            </button>

            {/* Center Origami Rib Divider */}
            <div className="w-[2px] h-14 bg-slate-300 rounded-full" />

            <button
              type="button"
              aria-label="Select and Add Black Counter"
              onClick={() => {
                onSelectColor('black');
                onAddCounter?.('black');
              }}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-transform ${
                selectedColor === 'black'
                  ? 'bg-slate-200/80 ring-2 ring-slate-700 scale-105'
                  : 'hover:bg-slate-200/50'
              }`}
            >
              <TactileCounter
                color="black"
                size="md"
                interactive
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', 'black');
                }}
              />
              <span className="text-xs font-bold text-slate-800">Black Chip</span>
            </button>
          </div>

          <div className="text-center text-[10px] text-slate-400 font-medium">
            Tap to select color or add directly to the grid
          </div>
        </div>

        {/* Bay 2: Number Track Strip (1-10 or 1-20) */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              1-{capacity} Number Track
            </span>
            <span className="text-[11px] font-bold text-indigo-600 font-mono">
              Count: {currentCount}
            </span>
          </div>

          {/* Rolled/Folded Track Strip */}
          <div
            className="flex items-center gap-1 overflow-x-auto py-2 px-1 scrollbar-thin"
            role="group"
            aria-label="Number Track Strip"
          >
            {numbers.map((num) => {
              const isFilled = num <= currentCount;
              const isCurrent = num === currentCount;
              return (
                <div
                  key={`num-track-${num}`}
                  className={`flex-shrink-0 w-7 h-9 rounded-lg flex flex-col items-center justify-center font-mono font-extrabold text-xs transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md scale-110 ring-2 ring-indigo-300'
                      : isFilled
                        ? 'bg-sky-200 text-sky-900 border border-sky-300'
                        : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  <span>{num}</span>
                  {isFilled && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                </div>
              );
            })}
          </div>

          <div className="text-center text-[10px] text-slate-400 font-medium mt-1">
            Tracks total counters in frame in real-time
          </div>
        </div>
      </div>

      {/* Origami Box Shelf Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {onFillFive && (
            <button
              type="button"
              onClick={onFillFive}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
            >
              Fill 5
            </button>
          )}
          {onFillTen && (
            <button
              type="button"
              onClick={onFillTen}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
            >
              Fill 10
            </button>
          )}
          <button
            type="button"
            onClick={onClearFrame}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors"
          >
            Clear All
          </button>
        </div>

        {onToggleCapacity && (
          <button
            type="button"
            onClick={onToggleCapacity}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors"
          >
            Switch to {capacity === 10 ? 'Double (20)' : 'Single (10)'}
          </button>
        )}
      </div>
    </section>
  );
}
