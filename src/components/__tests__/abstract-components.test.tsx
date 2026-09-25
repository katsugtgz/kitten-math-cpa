import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NumberBondTree } from '../abstract/NumberBondTree';
import { EquationDisplay } from '../abstract/EquationDisplay';
import { VirtualKeypad } from '../abstract/VirtualKeypad';
import { AbstractModeView } from '../abstract/AbstractModeView';
import { createInitialState } from '../../state/game-reducer';
import type { EquationProblem } from '../../domain/types';

describe('Abstract Presentation Components', () => {
  describe('NumberBondTree', () => {
    it('renders whole, partA, and partB with missing whole', () => {
      render(
        <NumberBondTree
          whole={10}
          partA={7}
          partB={3}
          missing="whole"
          currentInput=""
        />
      );

      expect(screen.getByTestId('number-bond-tree')).toBeInTheDocument();
      expect(screen.getByLabelText('Whole circle: ?')).toBeInTheDocument();
      expect(screen.getByLabelText('Part A circle: 7')).toBeInTheDocument();
      expect(screen.getByLabelText('Part B circle: 3')).toBeInTheDocument();
    });

    it('renders currentInput in missing part node', () => {
      render(
        <NumberBondTree
          whole={8}
          partA={5}
          partB={3}
          missing="partB"
          currentInput="3"
        />
      );

      expect(screen.getByLabelText('Part B circle: 3')).toBeInTheDocument();
    });
  });

  describe('EquationDisplay', () => {
    it('renders equation operands, operator, and missing result', () => {
      const problem: EquationProblem = {
        id: 'eq-1',
        operand1: 10,
        operator: '+',
        operand2: 4,
        result: 14,
        missing: 'result',
        answer: 14,
      };

      render(<EquationDisplay problem={problem} currentInput="14" />);

      expect(screen.getByTestId('equation-display')).toBeInTheDocument();
      expect(screen.getByLabelText('first operand: 10')).toBeInTheDocument();
      expect(screen.getByLabelText('second operand: 4')).toBeInTheDocument();
      expect(screen.getByLabelText('Missing result: 14')).toBeInTheDocument();
    });
  });

  describe('VirtualKeypad', () => {
    it('fires onDigit, onDelete, and onSubmit callbacks', () => {
      const handleDigit = vi.fn();
      const handleDelete = vi.fn();
      const handleSubmit = vi.fn();

      render(
        <VirtualKeypad
          onDigit={handleDigit}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Digit 7' }));
      expect(handleDigit).toHaveBeenCalledWith(7);

      fireEvent.click(screen.getByRole('button', { name: 'Delete last digit' }));
      expect(handleDelete).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('AbstractModeView', () => {
    it('renders abstract workspace and handles input submission', () => {
      const state = createInitialState({ mode: 'abstract', stage: 3 });
      const mockDispatch = vi.fn();

      render(<AbstractModeView state={state} dispatch={mockDispatch} />);

      expect(screen.getByTestId('abstract-mode-view')).toBeInTheDocument();
      expect(screen.getByTestId('virtual-keypad')).toBeInTheDocument();

      // Enter a digit and submit
      fireEvent.click(screen.getByRole('button', { name: 'Digit 5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SUBMIT_ANSWER', answer: 5 })
      );
    });
  });
});
