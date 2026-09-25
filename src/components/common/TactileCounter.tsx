import React from 'react';
import type { CounterColor } from '../../domain/types';

export interface TactileCounterProps {
  readonly color: CounterColor;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly interactive?: boolean;
  readonly draggable?: boolean;
  readonly onClick?: () => void;
  readonly onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  readonly onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  readonly onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  readonly onTouchMove?: (e: React.TouchEvent<HTMLDivElement>) => void;
  readonly onTouchEnd?: (e: React.TouchEvent<HTMLDivElement>) => void;
  readonly className?: string;
  readonly isGhost?: boolean;
  readonly animated?: boolean;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 sm:w-9 sm:h-9',
  md: 'w-10 h-10 sm:w-12 sm:h-12',
  lg: 'w-12 h-12 sm:w-14 sm:h-14',
} as const;

export function TactileCounter({
  color,
  size = 'md',
  interactive = false,
  draggable = false,
  onClick,
  onDragStart,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  className = '',
  isGhost = false,
  animated = true,
}: TactileCounterProps): React.JSX.Element {
  const sizeClass = SIZE_CLASSES[size];

  const isRed = color === 'red';

  const backgroundGradient = isRed
    ? 'radial-gradient(circle at 35% 30%, #f87171 0%, #ef4444 35%, #dc2626 70%, #991b1b 100%)'
    : 'radial-gradient(circle at 35% 30%, #64748b 0%, #334155 35%, #1e293b 70%, #090d16 100%)';

  const borderColor = isRed ? '#b91c1c' : '#0f172a';

  return (
    <div
      role="img"
      aria-label={`${color} tactile counter chip`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
      className={`relative rounded-full select-none ${sizeClass} ${
        isGhost ? 'opacity-40 border-2 border-dashed border-slate-400' : 'shadow-md'
      } ${
        interactive
          ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform'
          : ''
      } ${animated ? 'animate-[spring-pop_250ms_var(--ease-spring-pop)]' : ''} ${className}`}
      style={{
        background: backgroundGradient,
        border: `2px solid ${borderColor}`,
        boxShadow: isGhost
          ? 'none'
          : isRed
            ? '0 3px 6px -1px rgba(220, 38, 38, 0.4), inset 0 2px 3px rgba(255, 255, 255, 0.4), inset 0 -2px 3px rgba(0, 0, 0, 0.4)'
            : '0 3px 6px -1px rgba(15, 23, 42, 0.5), inset 0 2px 3px rgba(255, 255, 255, 0.3), inset 0 -2px 3px rgba(0, 0, 0, 0.6)',
      }}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* 3D Specular Highlight Sheen */}
      <span
        aria-hidden="true"
        className="absolute top-[18%] left-[22%] w-[28%] h-[20%] rounded-full bg-white/60 blur-[0.6px] pointer-events-none transform -rotate-12"
      />
    </div>
  );
}
