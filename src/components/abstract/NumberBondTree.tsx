import React from 'react';

export interface NumberBondTreeProps {
  readonly whole: number;
  readonly partA: number;
  readonly partB: number;
  readonly missing: 'whole' | 'partA' | 'partB';
  readonly currentInput: string;
  readonly isCorrect?: boolean | null;
  readonly className?: string;
}

export function NumberBondTree({
  whole,
  partA,
  partB,
  missing,
  currentInput,
  isCorrect = null,
  className = '',
}: NumberBondTreeProps): React.JSX.Element {
  const isWholeMissing = missing === 'whole';
  const isPartAMissing = missing === 'partA';
  const isPartBMissing = missing === 'partB';

  const getNodeContent = (isMissing: boolean, val: number): string => {
    if (!isMissing) return String(val);
    return currentInput !== '' ? currentInput : '?';
  };

  const getBorderColor = (isMissing: boolean): string => {
    if (!isMissing) return 'border-slate-700 bg-white text-slate-800';
    if (isCorrect === true) return 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-300';
    if (isCorrect === false) return 'border-rose-500 bg-rose-50 text-rose-700 ring-4 ring-rose-300';
    return 'border-purple-600 bg-purple-50 text-purple-700 ring-4 ring-purple-200 animate-pulse';
  };

  return (
    <div
      role="region"
      aria-label="Singapore Number Bond Tree"
      data-testid="number-bond-tree"
      className={`relative flex flex-col items-center select-none w-full max-w-sm mx-auto p-4 ${className}`}
    >
      {/* Whole Node at Top */}
      <div className="flex flex-col items-center z-10">
        <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 mb-1">
          Whole
        </span>
        <div
          aria-label={`Whole circle: ${getNodeContent(isWholeMissing, whole)}`}
          className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 flex items-center justify-center font-mono font-black text-2xl sm:text-3xl shadow-lg transition-colors ${getBorderColor(
            isWholeMissing
          )}`}
        >
          {getNodeContent(isWholeMissing, whole)}
        </div>
      </div>

      {/* Connecting SVG Branches */}
      <svg
        className="w-64 h-16 pointer-events-none -my-1 z-0 overflow-visible"
        viewBox="0 0 256 64"
        aria-hidden="true"
      >
        <path
          d="M 128 0 C 128 32, 54 32, 54 64"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 128 0 C 128 32, 202 32, 202 64"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      {/* Part Nodes at Bottom */}
      <div className="flex items-center justify-between w-full max-w-[280px] z-10">
        {/* Part A (Left) */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
            Part A
          </span>
          <div
            aria-label={`Part A circle: ${getNodeContent(isPartAMissing, partA)}`}
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center font-mono font-black text-2xl shadow-lg transition-colors ${getBorderColor(
              isPartAMissing
            )}`}
          >
            {getNodeContent(isPartAMissing, partA)}
          </div>
        </div>

        {/* Plus Symbol in Center */}
        <div className="text-2xl font-black text-slate-400 font-mono select-none">+</div>

        {/* Part B (Right) */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 mb-1">
            Part B
          </span>
          <div
            aria-label={`Part B circle: ${getNodeContent(isPartBMissing, partB)}`}
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center font-mono font-black text-2xl shadow-lg transition-colors ${getBorderColor(
              isPartBMissing
            )}`}
          >
            {getNodeContent(isPartBMissing, partB)}
          </div>
        </div>
      </div>
    </div>
  );
}
