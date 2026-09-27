import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ManipulativeWorkbench } from '../ManipulativeWorkbench';
import { createPopulatedFrame } from '../../../domain/ten-frame';

describe('ManipulativeWorkbench (Deep Manipulative Module)', () => {
  it('renders both TenFrameGrid and PaperTray with only grid and dispatch props', () => {
    const grid = createPopulatedFrame(10, 2, 1);
    const dispatch = vi.fn();

    render(<ManipulativeWorkbench grid={grid} dispatch={dispatch} />);

    // Renders TenFrameGrid elements
    expect(screen.getByLabelText('Slot 1: red')).toBeInTheDocument();
    expect(screen.getByLabelText('Slot 2: red')).toBeInTheDocument();
    expect(screen.getByLabelText('Slot 3: black')).toBeInTheDocument();
    expect(screen.getByLabelText('Slot 4: empty')).toBeInTheDocument();

    // Renders PaperTray elements
    expect(screen.getByText('📦 Paper Tray Manipulatives')).toBeInTheDocument();
    expect(screen.getByText('1-10 Number Track')).toBeInTheDocument();
  });

  it('dispatches PLACE_COUNTER on empty slot click with internally managed color', () => {
    const grid = createPopulatedFrame(10, 0, 0);
    const dispatch = vi.fn();

    render(<ManipulativeWorkbench grid={grid} dispatch={dispatch} />);

    const slot0 = screen.getByLabelText('Slot 1: empty');
    fireEvent.click(slot0);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'PLACE_COUNTER',
      slotIndex: 0,
      color: 'red',
    });
  });

  it('dispatches REMOVE_COUNTER on occupied slot click', () => {
    const grid = createPopulatedFrame(10, 1, 0);
    const dispatch = vi.fn();

    render(<ManipulativeWorkbench grid={grid} dispatch={dispatch} />);

    const slot0 = screen.getByLabelText('Slot 1: red');
    fireEvent.click(slot0);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'REMOVE_COUNTER',
      slotIndex: 0,
    });
  });

  it('handles clearing, filling, and capacity toggling from internal paper tray controls', () => {
    const grid = createPopulatedFrame(10, 0, 0);
    const dispatch = vi.fn();

    render(<ManipulativeWorkbench grid={grid} dispatch={dispatch} />);

    // Clear
    const clearBtn = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearBtn);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLEAR_FRAME' });

    // Fill 5: exactly five placements across slots 0-4
    const fill5Btn = screen.getByRole('button', { name: /fill 5/i });
    fireEvent.click(fill5Btn);
    const placeCalls = dispatch.mock.calls.filter(
      ([action]) => action.type === 'PLACE_COUNTER'
    );
    expect(placeCalls).toHaveLength(5);
    expect(placeCalls.map(([action]) => action.slotIndex)).toEqual([0, 1, 2, 3, 4]);
    expect(placeCalls.every(([action]) => action.color === 'red')).toBe(true);

    // Toggle capacity
    const toggleBtn = screen.getByRole('button', { name: /switch to double/i });
    fireEvent.click(toggleBtn);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_CAPACITY',
      capacity: 20,
    });
  });

  it('supports controlled selectedColor and onSelectColor if provided', () => {
    const grid = createPopulatedFrame(10, 0, 0);
    const dispatch = vi.fn();
    const onSelectColor = vi.fn();

    render(
      <ManipulativeWorkbench
        grid={grid}
        dispatch={dispatch}
        selectedColor="black"
        onSelectColor={onSelectColor}
      />
    );

    const slot0 = screen.getByLabelText('Slot 1: empty');
    fireEvent.click(slot0);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'PLACE_COUNTER',
      slotIndex: 0,
      color: 'black',
    });

    // Tray color selection is surfaced through onSelectColor
    fireEvent.click(screen.getByRole('button', { name: 'Select and Add Red Counter' }));
    expect(onSelectColor).toHaveBeenCalledWith('red');
    fireEvent.click(screen.getByRole('button', { name: 'Select and Add Black Counter' }));
    expect(onSelectColor).toHaveBeenCalledWith('black');
  });
});
