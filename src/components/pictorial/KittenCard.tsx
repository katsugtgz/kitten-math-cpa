import React from 'react';
import type { TenFrameGrid as DomainTenFrameGrid, CounterColor } from '../../domain/types';
import { KittenMascot } from '../common/KittenMascot';
import type { MascotCoat, MascotEmotion, MascotPawState } from '../common/KittenMascot';
import { TactileCounter } from '../common/TactileCounter';

export interface KittenCardProps {
  readonly grid: DomainTenFrameGrid;
  readonly coat?: MascotCoat;
  readonly emotion?: MascotEmotion;
  readonly pawState?: MascotPawState;
  readonly title?: string;
  readonly interactive?: boolean;
  readonly onCellClick?: (idx: number) => void;
  readonly className?: string;
  readonly speechBubble?: string;
}

export function KittenCard({
  grid,
  coat = 'calico',
  emotion = 'peeking',
  pawState = 'resting',
  title,
  interactive = false,
  onCellClick,
  className = '',
  speechBubble,
}: KittenCardProps): React.JSX.Element {
  const isDouble = grid.capacity === 20;

  const frame1Indices = Array.from({ length: 10 }, (_, i) => i);
  const frame2Indices = isDouble ? Array.from({ length: 10 }, (_, i) => i + 10) : [];

  const renderFrameCells = (indices: number[], frameLabel: string): React.JSX.Element => (
    <div className="w-full">
      <div className="sr-only">{frameLabel}</div>
      <div className="bg-white border-2 border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-5 divide-x-2 divide-slate-800 border-b-2 border-slate-800">
          {indices.slice(0, 5).map((idx) => {
            const cell = grid.cells[idx];
            return (
              <button
                key={`card-cell-${idx}`}
                type="button"
                disabled={!interactive}
                onClick={() => onCellClick?.(idx)}
                aria-label={`Card cell ${idx + 1}: ${cell}`}
                className={`aspect-square p-1 flex items-center justify-center bg-white ${
                  interactive ? 'cursor-pointer hover:bg-sky-50' : 'cursor-default'
                }`}
              >
                {cell !== 'empty' && (
                  <TactileCounter
                    color={cell as CounterColor}
                    size={isDouble ? 'sm' : 'md'}
                    animated={false}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-5 divide-x-2 divide-slate-800">
          {indices.slice(5, 10).map((idx) => {
            const cell = grid.cells[idx];
            return (
              <button
                key={`card-cell-${idx}`}
                type="button"
                disabled={!interactive}
                onClick={() => onCellClick?.(idx)}
                aria-label={`Card cell ${idx + 1}: ${cell}`}
                className={`aspect-square p-1 flex items-center justify-center bg-white ${
                  interactive ? 'cursor-pointer hover:bg-sky-50' : 'cursor-default'
                }`}
              >
                {cell !== 'empty' && (
                  <TactileCounter
                    color={cell as CounterColor}
                    size={isDouble ? 'sm' : 'md'}
                    animated={false}
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
    <article
      aria-label={title || `Kitten Ten-Frame Card, count ${grid.totalCount}`}
      data-testid="kitten-card"
      className={`relative inline-flex flex-col items-center bg-[#bde0fe] border-3 border-slate-800 rounded-3xl p-3 sm:p-4 shadow-lg select-none ${className}`}
      style={{
        width: isDouble ? '320px' : '290px',
        borderWidth: '3px',
        borderColor: '#1e293b',
      }}
    >
      {/* Peeking Mascot positioned directly overlapping top frame border */}
      <div className="-mb-4 z-10">
        <KittenMascot
          coat={coat}
          emotion={emotion}
          pawState={pawState}
          size={isDouble ? 'md' : 'md'}
          speechBubble={speechBubble}
        />
      </div>

      {/* Ten-Frame Grid Container */}
      <div className="w-full flex flex-col gap-2 z-0 relative">
        {renderFrameCells(frame1Indices, 'Frame 1')}
        {isDouble && renderFrameCells(frame2Indices, 'Frame 2')}
      </div>

      {title && (
        <div className="mt-2 text-center text-xs font-bold text-slate-800 font-mono">
          {title}
        </div>
      )}
    </article>
  );
}
