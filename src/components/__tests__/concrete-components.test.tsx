import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaperTray } from '../concrete/PaperTray';
import { TenFrameGrid } from '../concrete/TenFrameGrid';
import { ConcreteModeView } from '../concrete/ConcreteModeView';
import { createInitialState } from '../../state/game-reducer';
import type { TenFrameGrid as DomainTenFrameGrid } from '../../domain/types';

describe('Concrete Manipulative Components', () => {
  describe('PaperTray', () => {
    it('renders with 1-10 number track and counter buttons', () => {
      const handleSelectColor = vi.fn();
      const handleClear = vi.fn();

      render(
        <PaperTray
          selectedColor="red"
          onSelectColor={handleSelectColor}
          currentCount={4}
          capacity={10}
          onClearFrame={handleClear}
        />
      );

      expect(screen.getByText('📦 Paper Tray Manipulatives')).toBeInTheDocument();
      expect(screen.getByText('1-10 Number Track')).toBeInTheDocument();

      // Number 4 should be marked as filled
      expect(screen.getByText('4')).toBeInTheDocument();

      // Click clear button
      const clearBtn = screen.getByRole('button', { name: /clear all/i });
      fireEvent.click(clearBtn);
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('renders 1-20 number track when capacity is 20', () => {
      render(
        <PaperTray
          selectedColor="black"
          onSelectColor={vi.fn()}
          currentCount={11}
          capacity={20}
          onClearFrame={vi.fn()}
        />
      );

      expect(screen.getByText('1-20 Number Track')).toBeInTheDocument();
      expect(screen.getAllByText('20').length).toBeGreaterThan(0);
    });
  });

  describe('TenFrameGrid', () => {
    it('renders 10 interactive slots for capacity 10', () => {
      const mockGrid: DomainTenFrameGrid = {
        capacity: 10,
        cells: ['red', 'empty', 'black', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
        redCount: 1,
        blackCount: 1,
        totalCount: 2,
      };

      const handleSlotClick = vi.fn();
      render(<TenFrameGrid grid={mockGrid} onSlotClick={handleSlotClick} />);

      expect(screen.getByLabelText('Slot 1: red')).toBeInTheDocument();
      expect(screen.getByLabelText('Slot 2: empty')).toBeInTheDocument();
      expect(screen.getByLabelText('Slot 3: black')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Slot 2: empty'));
      expect(handleSlotClick).toHaveBeenCalledWith(1);
    });

    it('renders 20 slots for capacity 20', () => {
      const mockGrid: DomainTenFrameGrid = {
        capacity: 20,
        cells: Array(20).fill('empty'),
        redCount: 0,
        blackCount: 0,
        totalCount: 0,
      };

      render(<TenFrameGrid grid={mockGrid} />);
      expect(screen.getByText('Frame 1 (1-10)')).toBeInTheDocument();
      expect(screen.getByText('Frame 2 (11-20)')).toBeInTheDocument();
      expect(screen.getByLabelText('Slot 20: empty')).toBeInTheDocument();
    });
  });

  describe('ConcreteModeView', () => {
    it('renders full concrete manipulative workspace', () => {
      const initialState = createInitialState({ mode: 'concrete' });
      const mockDispatch = vi.fn();
      const mockSelectColor = vi.fn();

      render(
        <ConcreteModeView
          state={initialState}
          dispatch={mockDispatch}
          selectedColor="red"
          onSelectColor={mockSelectColor}
        />
      );

      expect(screen.getByTestId('concrete-mode-view')).toBeInTheDocument();
      expect(screen.getByTestId('kitten-mascot')).toBeInTheDocument();

      // Click slot 0
      const slot0 = screen.getByLabelText('Slot 1: empty');
      fireEvent.click(slot0);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'PLACE_COUNTER',
        slotIndex: 0,
        color: 'red',
      });
    });

    it('supports moving counter from one slot to another via drag-and-drop', () => {
      const mockGrid: DomainTenFrameGrid = {
        capacity: 10,
        cells: ['red', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
        redCount: 1,
        blackCount: 0,
        totalCount: 1,
      };

      const handleMove = vi.fn();
      render(<TenFrameGrid grid={mockGrid} onMoveCounter={handleMove} />);

      const slot2 = screen.getByLabelText('Slot 2: empty');
      fireEvent.drop(slot2, {
        dataTransfer: {
          getData: (key: string) => (key === 'source-index' ? '0' : 'red'),
        },
      });

      expect(handleMove).toHaveBeenCalledWith(0, 1);
    });

    it('removes counter when dropped into PaperTray basin', () => {
      const handleRemove = vi.fn();
      render(
        <PaperTray
          selectedColor="red"
          onSelectColor={vi.fn()}
          currentCount={1}
          capacity={10}
          onClearFrame={vi.fn()}
          onRemoveCounter={handleRemove}
        />
      );

      const basin = screen.getByTestId('paper-tray-basin');
      fireEvent.drop(basin, {
        dataTransfer: {
          getData: (key: string) => (key === 'source-index' ? '3' : ''),
        },
      });

      expect(handleRemove).toHaveBeenCalledWith(3);
    });
  });
});
