import { useReducer } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../../App';
import { PictorialModeView } from '../pictorial/PictorialModeView';
import { createInitialState, gameReducer } from '../../state/game-reducer';
import type { SubitizeProblem } from '../../domain/types';

describe('AppFlowChallenger: End-to-End User Flow & Adversarial Stress Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. CPA Stage and Mode Navigation Integration', () => {
    it('transitions cleanly through all CPA stages (1 -> 2 -> 3 -> 4) in Concrete mode', () => {
      render(<App />);

      // Initial Stage is 1, capacity 10
      expect(screen.getByRole('button', { name: /stage 1/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/Capacity:/i)).toHaveTextContent('Capacity: 10');
      expect(screen.getAllByRole('button', { name: /^Slot \d+: empty$/i })).toHaveLength(10);

      // Switch to Stage 2 (still capacity 10)
      fireEvent.click(screen.getByRole('button', { name: /stage 2/i }));
      expect(screen.getByRole('button', { name: /stage 2/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/Capacity:/i)).toHaveTextContent('Capacity: 10');
      expect(screen.getAllByRole('button', { name: /^Slot \d+: empty$/i })).toHaveLength(10);

      // Switch to Stage 3 (capacity expands to 20)
      fireEvent.click(screen.getByRole('button', { name: /stage 3/i }));
      expect(screen.getByRole('button', { name: /stage 3/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/Capacity:/i)).toHaveTextContent('Capacity: 20');
      expect(screen.getAllByRole('button', { name: /^Slot \d+: empty$/i })).toHaveLength(20);

      // Switch to Stage 4 (mastery, capacity 20)
      fireEvent.click(screen.getByRole('button', { name: /stage 4/i }));
      expect(screen.getByRole('button', { name: /stage 4/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/Capacity:/i)).toHaveTextContent('Capacity: 20');
      expect(screen.getAllByRole('button', { name: /^Slot \d+: empty$/i })).toHaveLength(20);

      // Switch back to Stage 1 (shrinks capacity to 10)
      fireEvent.click(screen.getByRole('button', { name: /stage 1/i }));
      expect(screen.getByRole('button', { name: /stage 1/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/Capacity:/i)).toHaveTextContent('Capacity: 10');
      expect(screen.getAllByRole('button', { name: /^Slot \d+: empty$/i })).toHaveLength(10);
    });

    it('transitions across Concrete -> Pictorial -> Abstract -> Concrete maintaining UI stability', () => {
      render(<App />);

      // Verify Concrete mode view
      expect(screen.getByTestId('concrete-mode-view')).toBeInTheDocument();

      // Switch to Pictorial mode
      fireEvent.click(screen.getByRole('tab', { name: /pictorial/i }));
      expect(screen.getByTestId('pictorial-mode-view')).toBeInTheDocument();
      expect(screen.queryByTestId('concrete-mode-view')).not.toBeInTheDocument();

      // Switch to Abstract mode
      fireEvent.click(screen.getByRole('tab', { name: /abstract/i }));
      expect(screen.getByTestId('abstract-mode-view')).toBeInTheDocument();
      expect(screen.getByTestId('virtual-keypad')).toBeInTheDocument();
      expect(screen.queryByTestId('pictorial-mode-view')).not.toBeInTheDocument();

      // Switch back to Concrete mode
      fireEvent.click(screen.getByRole('tab', { name: /concrete/i }));
      expect(screen.getByTestId('concrete-mode-view')).toBeInTheDocument();
      expect(screen.queryByTestId('abstract-mode-view')).not.toBeInTheDocument();
    });

    it('retains stage level across mode switches', () => {
      render(<App />);

      // Set stage to 3 in Concrete mode
      fireEvent.click(screen.getByRole('button', { name: /stage 3/i }));
      expect(screen.getByRole('button', { name: /stage 3/i })).toHaveAttribute('aria-pressed', 'true');

      // Switch to Pictorial mode: stage 3 should still be selected
      fireEvent.click(screen.getByRole('tab', { name: /pictorial/i }));
      expect(screen.getByRole('button', { name: /stage 3/i })).toHaveAttribute('aria-pressed', 'true');

      // Switch to Abstract mode: stage 3 should still be selected
      fireEvent.click(screen.getByRole('tab', { name: /abstract/i }));
      expect(screen.getByRole('button', { name: /stage 3/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('2. Answer Submissions, Streaks and Celebratory Modals at 3, 5, 10', () => {
    it('submits consecutive correct answers in Abstract mode and triggers celebration modals at streaks 3, 5, and 10', () => {
      render(<App />);

      // Switch to Abstract mode (stage 1 has number bonds)
      fireEvent.click(screen.getByRole('tab', { name: /abstract/i }));

      // Helper function to solve the current problem
      const solveCurrentNumberBond = (expectedStreak: number) => {
        // Read the numbers from the number bond circles
        const wholeEl = screen.getByLabelText(/Whole circle:/i);
        const partAEl = screen.getByLabelText(/Part A circle:/i);
        const partBEl = screen.getByLabelText(/Part B circle:/i);

        const wholeStr = wholeEl.getAttribute('aria-label')?.replace('Whole circle: ', '');
        const partAStr = partAEl.getAttribute('aria-label')?.replace('Part A circle: ', '');
        const partBStr = partBEl.getAttribute('aria-label')?.replace('Part B circle: ', '');

        let answer: number;
        if (wholeStr === '?') {
          answer = Number(partAStr) + Number(partBStr);
        } else if (partAStr === '?') {
          answer = Number(wholeStr) - Number(partBStr);
        } else {
          answer = Number(wholeStr) - Number(partAStr);
        }

        // Enter digits via VirtualKeypad
        const answerDigits = String(answer).split('');
        for (const digit of answerDigits) {
          fireEvent.click(screen.getByRole('button', { name: `Digit ${digit}` }));
        }

        // Submit answer
        fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));

        // Check if modal triggered at milestones 3, 5, 10
        if (expectedStreak === 3) {
          expect(screen.getByTestId('celebration-modal')).toBeInTheDocument();
          expect(screen.getByText(/3-in-a-Row/i)).toBeInTheDocument();
          fireEvent.click(screen.getByRole('button', { name: /Continue Playing/i }));
          expect(screen.queryByTestId('celebration-modal')).not.toBeInTheDocument();
        } else if (expectedStreak === 5) {
          expect(screen.getByTestId('celebration-modal')).toBeInTheDocument();
          expect(screen.getByText(/5-in-a-Row/i)).toBeInTheDocument();
          fireEvent.click(screen.getByRole('button', { name: /Continue Playing/i }));
          expect(screen.queryByTestId('celebration-modal')).not.toBeInTheDocument();
        } else if (expectedStreak === 10) {
          expect(screen.getByTestId('celebration-modal')).toBeInTheDocument();
          expect(screen.getByText(/Grand Mastery/i)).toBeInTheDocument();
          fireEvent.click(screen.getByRole('button', { name: /Continue Playing/i }));
          expect(screen.queryByTestId('celebration-modal')).not.toBeInTheDocument();
        } else {
          expect(screen.queryByTestId('celebration-modal')).not.toBeInTheDocument();
        }

        // Click next problem to continue
        fireEvent.click(screen.getByRole('button', { name: /Next Problem/i }));
      };

      // Execute 10 consecutive correct answers
      for (let s = 1; s <= 10; s++) {
        solveCurrentNumberBond(s);
      }
    });

    it('allows retry on incorrect answer and triggers dynamic scaffolding after 2 consecutive errors on current problem', () => {
      render(<App />);

      // Switch to Abstract mode
      fireEvent.click(screen.getByRole('tab', { name: /abstract/i }));

      // Error 1: Type impossible answer '99'
      fireEvent.click(screen.getByRole('button', { name: 'Digit 9' }));
      fireEvent.click(screen.getByRole('button', { name: 'Digit 9' }));
      fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));

      // First error feedback shown
      expect(screen.getByText(/Try reviewing the parts of the number/i)).toBeInTheDocument();
      // Scaffolding is false after 1 error
      expect(screen.queryByText(/Hint: Think of making ten/i)).not.toBeInTheDocument();

      // Retry: Type impossible answer '99' again on the current problem
      fireEvent.click(screen.getByRole('button', { name: 'Digit 9' }));
      fireEvent.click(screen.getByRole('button', { name: 'Digit 9' }));
      fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));

      // Dynamic scaffolding activates after 2 consecutive errors on the current problem
      expect(screen.getByText(/Hint: Think of making ten/i)).toBeInTheDocument();

      // Advancing to the next problem resets errors and dismisses scaffolding cleanly
      fireEvent.click(screen.getByRole('button', { name: /Next Problem/i }));
      expect(screen.queryByText(/Hint: Think of making ten/i)).not.toBeInTheDocument();
    });

    it('proves that incorrect answers never result in negative scores', () => {
      render(<App />);

      fireEvent.click(screen.getByRole('tab', { name: /abstract/i }));

      // Submit 5 wrong answers starting from 0 points
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByRole('button', { name: 'Digit 9' }));
        fireEvent.click(screen.getByRole('button', { name: 'Digit 9' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));
        fireEvent.click(screen.getByRole('button', { name: /Next Problem/i }));
      }

      // Verify points display is 0, never negative
      const pointsEl = screen.getByText('Total Points:').parentElement;
      expect(pointsEl).toHaveTextContent('0');
    });
  });

  describe('3. Keyboard Navigation and Accessibility Interactions', () => {
    it('supports physical keyboard input (digits, Backspace, Enter) in Abstract mode', () => {
      render(<App />);

      fireEvent.click(screen.getByRole('tab', { name: /abstract/i }));

      // Type digit '7' via physical keydown
      fireEvent.keyDown(window, { key: '7' });
      expect(screen.getByLabelText(/circle: 7/i)).toBeInTheDocument();

      // Type digit '4'
      fireEvent.keyDown(window, { key: '4' });
      expect(screen.getByLabelText(/circle: 74/i)).toBeInTheDocument();

      // Press Backspace
      fireEvent.keyDown(window, { key: 'Backspace' });
      expect(screen.getByLabelText(/circle: 7/i)).toBeInTheDocument();

      // Press Enter to submit
      fireEvent.keyDown(window, { key: 'Enter' });
      expect(screen.getByRole('button', { name: /Next Problem/i })).toBeInTheDocument();
    });

    it('virtual keypad OK button handles empty input safely without crashing or submitting', () => {
      render(<App />);
      fireEvent.click(screen.getByRole('tab', { name: /abstract/i }));

      // Clicking OK when input is empty should be a no-op
      const submitBtn = screen.getByRole('button', { name: 'Submit Answer' });
      fireEvent.click(submitBtn);

      // Should not transition to answered state
      expect(screen.queryByRole('button', { name: /Next Problem/i })).not.toBeInTheDocument();
    });

    it('provides accessible ARIA attributes across navigation tabs, buttons, and status regions', () => {
      render(<App />);

      expect(screen.getByRole('application')).toHaveAttribute('aria-label', 'Kitten Math CPA Learning Application');
      expect(screen.getByRole('tablist', { name: /Game Modes/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /Player Progress and Streak Meter/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /Interactive Ten-Frame Grid/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mute audio/i })).toBeInTheDocument();
    });
  });

  describe('4. Empirical Adversarial Challenge: Pictorial Mode Flashcard Display', () => {
    it('renders KittenCard in PictorialModeView with the active problem counters', () => {
      const mockSubitize: SubitizeProblem = {
        id: 'sub-test-1',
        targetCount: 4,
        redCount: 4,
        blackCount: 0,
        options: [2, 3, 4, 5],
        layout: 'single',
        grid: {
          capacity: 10,
          cells: ['red', 'red', 'red', 'red', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
          redCount: 4,
          blackCount: 0,
          totalCount: 4,
        },
      };

      const state = createInitialState({
        mode: 'pictorial',
        stage: 1,
        activeProblem: mockSubitize,
      });

      const mockDispatch = vi.fn();
      render(<PictorialModeView state={state} dispatch={mockDispatch} />);

      const card = screen.getByTestId('kitten-card');
      const redCells = within(card).queryAllByLabelText(/Card cell \d+: red/i);

      // Verifies the fix: PictorialModeView passes activeProblem.grid, rendering all 4 counters
      expect(redCells.length).toBe(4);
    });

    it('supports retry and triggers dynamic scaffolding in Pictorial mode after 2 consecutive errors', () => {
      const mockSubitize: SubitizeProblem = {
        id: 'sub-test-2',
        targetCount: 3,
        redCount: 3,
        blackCount: 0,
        options: [1, 2, 3, 4],
        layout: 'single',
        grid: {
          capacity: 10,
          cells: ['red', 'red', 'red', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
          redCount: 3,
          blackCount: 0,
          totalCount: 3,
        },
      };

      function PictorialTestWrapper() {
        const [state, dispatch] = useReducer(
          gameReducer,
          createInitialState({
            mode: 'pictorial',
            stage: 1,
            activeProblem: mockSubitize,
          })
        );
        return <PictorialModeView state={state} dispatch={dispatch} />;
      }

      render(<PictorialTestWrapper />);

      // First incorrect attempt: select 1
      fireEvent.click(screen.getByRole('button', { name: 'Select 1 counters' }));
      expect(screen.getByText(/Not quite! Look closely at the pattern/i)).toBeInTheDocument();
      expect(screen.queryByText(/Hint: Think of making ten/i)).not.toBeInTheDocument();

      // Retry: second incorrect attempt: select 2
      fireEvent.click(screen.getByRole('button', { name: 'Select 2 counters' }));
      // Consecutive errors is now 2 -> triggers scaffoldActive!
      expect(screen.getByText(/Hint: Think of making ten/i)).toBeInTheDocument();

      // Third attempt: correct answer: select 3
      fireEvent.click(screen.getByRole('button', { name: 'Select 3 counters' }));
      expect(screen.getByText(/Excellent! Count is 3!/i)).toBeInTheDocument();
      expect(screen.queryByText(/Hint: Think of making ten/i)).not.toBeInTheDocument();
    });
  });
});
