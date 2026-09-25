import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KittenCard } from '../pictorial/KittenCard';
import { PictorialModeView } from '../pictorial/PictorialModeView';
import { createInitialState } from '../../state/game-reducer';
import type { TenFrameGrid as DomainTenFrameGrid } from '../../domain/types';

describe('Pictorial Presentation Components', () => {
  describe('KittenCard', () => {
    it('renders single 10-frame card with cute mascot and counters', () => {
      const mockGrid: DomainTenFrameGrid = {
        capacity: 10,
        cells: ['red', 'red', 'red', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
        redCount: 3,
        blackCount: 0,
        totalCount: 3,
      };

      render(<KittenCard grid={mockGrid} title="Card 3" coat="calico" />);

      expect(screen.getByTestId('kitten-card')).toBeInTheDocument();
      expect(screen.getByTestId('kitten-mascot')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
      expect(screen.getByLabelText('Card cell 1: red')).toBeInTheDocument();
      expect(screen.getByLabelText('Card cell 4: empty')).toBeInTheDocument();
    });

    it('renders double 20-frame card when capacity is 20', () => {
      const mockGrid: DomainTenFrameGrid = {
        capacity: 20,
        cells: [
          ...Array(10).fill('black'),
          'red',
          ...Array(9).fill('empty'),
        ],
        redCount: 1,
        blackCount: 10,
        totalCount: 11,
      };

      render(<KittenCard grid={mockGrid} coat="white" />);

      expect(screen.getByLabelText('Card cell 11: red')).toBeInTheDocument();
      expect(screen.getByLabelText('Card cell 1: black')).toBeInTheDocument();
    });
  });

  describe('PictorialModeView', () => {
    it('renders subitizing flashcard and responds to answer button click', () => {
      const state = createInitialState({ mode: 'pictorial', stage: 1 });
      const mockDispatch = vi.fn();

      render(<PictorialModeView state={state} dispatch={mockDispatch} />);

      expect(screen.getByTestId('pictorial-mode-view')).toBeInTheDocument();
      expect(screen.getByText(/How many counters does the kitten see\?/i)).toBeInTheDocument();

      // Find an option button and click it
      const optionButtons = screen.getAllByRole('button', { name: /Select \d+ counters/i });
      expect(optionButtons.length).toBeGreaterThanOrEqual(2);

      fireEvent.click(optionButtons[0]);
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SUBMIT_ANSWER' })
      );
    });
  });
});
