import React from 'react';
import { soundService } from '../../services/sound-service';

export interface VirtualKeypadProps {
  readonly onDigit: (digit: number) => void;
  readonly onDelete: () => void;
  readonly onSubmit: () => void;
  readonly onClear?: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function VirtualKeypad({
  onDigit,
  onDelete,
  onSubmit,
  disabled = false,
  className = '',
}: VirtualKeypadProps): React.JSX.Element {
  const handleDigit = (digit: number): void => {
    if (disabled) return;
    soundService.playButtonClick();
    onDigit(digit);
  };

  const handleDelete = (): void => {
    if (disabled) return;
    soundService.playButtonClick();
    onDelete();
  };

  const handleSubmit = (): void => {
    if (disabled) return;
    soundService.playButtonClick();
    onSubmit();
  };

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div
      role="group"
      aria-label="Virtual Number Keypad"
      data-testid="virtual-keypad"
      className={`w-full max-w-xs mx-auto flex flex-col gap-2.5 p-3 bg-slate-100 border-2 border-slate-300 rounded-3xl shadow-sm ${className}`}
    >
      {/* 3x3 Grid for Digits 1-9 */}
      <div className="grid grid-cols-3 gap-2">
        {digits.map((digit) => (
          <button
            key={`keypad-${digit}`}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(digit)}
            aria-label={`Digit ${digit}`}
            className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-indigo-50 active:bg-indigo-100 border-2 border-slate-200 hover:border-indigo-400 font-mono font-black text-2xl text-slate-800 shadow-sm transition-colors active:scale-95 disabled:opacity-50"
          >
            {digit}
          </button>
        ))}
      </div>

      {/* Bottom Row: Delete, 0, Submit */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={handleDelete}
          aria-label="Delete last digit"
          className="h-14 sm:h-16 rounded-2xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border-2 border-rose-200 font-bold text-rose-700 shadow-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center text-sm"
        >
          ⌫ Del
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit(0)}
          aria-label="Digit 0"
          className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-indigo-50 active:bg-indigo-100 border-2 border-slate-200 hover:border-indigo-400 font-mono font-black text-2xl text-slate-800 shadow-sm transition-colors active:scale-95 disabled:opacity-50"
        >
          0
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={handleSubmit}
          aria-label="Submit Answer"
          className="h-14 sm:h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 border-2 border-emerald-600 font-black text-white shadow-md transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center text-base"
        >
          ✓ OK
        </button>
      </div>
    </div>
  );
}
