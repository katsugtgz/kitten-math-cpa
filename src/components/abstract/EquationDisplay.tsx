import React from 'react';
import type { EquationProblem } from '../../domain/types';

export interface EquationDisplayProps {
  readonly problem: EquationProblem;
  readonly currentInput: string;
  readonly isCorrect?: boolean | null;
  readonly className?: string;
}

export function EquationDisplay({
  problem,
  currentInput,
  isCorrect = null,
  className = '',
}: EquationDisplayProps): React.JSX.Element {
  const isOp1Missing = problem.missing === 'operand1';
  const isOp2Missing = problem.missing === 'operand2';
  const isResMissing = problem.missing === 'result';

  const renderSlot = (isMissing: boolean, value: number, slotName: string): React.JSX.Element => {
    if (!isMissing) {
      return (
        <span
          aria-label={`${slotName}: ${value}`}
          className="w-14 sm:w-16 h-14 sm:h-16 bg-white border-2 border-slate-300 rounded-2xl flex items-center justify-center font-mono font-black text-2xl sm:text-3xl text-slate-800 shadow-sm"
        >
          {value}
        </span>
      );
    }

    let borderClass = 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-200 animate-pulse';
    if (isCorrect === true) {
      borderClass = 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-300';
    } else if (isCorrect === false) {
      borderClass = 'border-rose-500 bg-rose-50 text-rose-700 ring-4 ring-rose-300';
    }

    const displayValue = currentInput !== '' ? currentInput : '?';

    return (
      <span
        role="status"
        aria-label={`Missing ${slotName}: ${displayValue}`}
        className={`w-14 sm:w-16 h-14 sm:h-16 border-3 rounded-2xl flex items-center justify-center font-mono font-black text-2xl sm:text-3xl shadow-md transition-colors ${borderClass}`}
      >
        {displayValue}
      </span>
    );
  };

  return (
    <div
      role="region"
      aria-label="Equation Display"
      data-testid="equation-display"
      className={`flex items-center justify-center gap-2 sm:gap-3 p-4 bg-slate-50 border-2 border-slate-200 rounded-3xl shadow-sm ${className}`}
    >
      {renderSlot(isOp1Missing, problem.operand1, 'first operand')}
      <span className="text-2xl sm:text-3xl font-black text-slate-600 font-mono select-none">
        {problem.operator}
      </span>
      {renderSlot(isOp2Missing, problem.operand2, 'second operand')}
      <span className="text-2xl sm:text-3xl font-black text-slate-600 font-mono select-none">
        =
      </span>
      {renderSlot(isResMissing, problem.result, 'result')}
    </div>
  );
}
