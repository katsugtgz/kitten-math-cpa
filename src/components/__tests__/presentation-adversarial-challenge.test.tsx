import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { KittenMascot } from '../common/KittenMascot';
import { TenFrameGrid } from '../concrete/TenFrameGrid';
import { PaperTray } from '../concrete/PaperTray';
import { ScoreBar } from '../hud/ScoreBar';
import { CelebrationModal } from '../hud/CelebrationModal';
import { KittenCard } from '../pictorial/KittenCard';
import App from '../../App';
import { createEmptyFrame, createPopulatedFrame } from '../../domain/ten-frame';
import { soundService } from '../../services/sound-service';

describe('Adversarial Challenger: Presentation Components Edge Cases', () => {
  describe('Challenge 1: KittenMascot Invalid Props & Hostile Inputs', () => {
    it('gracefully renders with invalid emotions, coats, and paw states without throwing', () => {
      expect(() => {
        render(
          <KittenMascot
            // @ts-expect-error hostile invalid emotion
            emotion="furious"
            // @ts-expect-error hostile invalid coat
            coat="neon-green"
            // @ts-expect-error hostile invalid paw state
            pawState="dancing"
            // @ts-expect-error hostile invalid size
            size="gargantuan"
          />
        );
      }).not.toThrow();

      const mascot = screen.getByTestId('kitten-mascot');
      expect(mascot).toBeInTheDocument();
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
    });

    it('renders with null, undefined, or empty string props', () => {
      expect(() => {
        render(
          <KittenMascot
            // @ts-expect-error hostile null
            emotion={null}
            // @ts-expect-error hostile null
            coat={null}
            // @ts-expect-error hostile null
            pawState={null}
            speechBubble=""
          />
        );
      }).not.toThrow();
    });

    it('safely renders an extremely long speech bubble and special characters', () => {
      const hostileText = '😻 <script>alert("xss")</script> &amp; '.repeat(40);
      render(<KittenMascot speechBubble={hostileText} />);

      const bubble = screen.getByRole('status');
      expect(bubble).toBeInTheDocument();
      expect(bubble.textContent).toContain('alert("xss")');
    });

    it('empirically reveals that KittenMascot fires mouse clicks even when interactive=false (DEFECT)', () => {
      const handleClick = vi.fn();
      render(
        <KittenMascot interactive={false} onMascotClick={handleClick} />
      );

      const svg = screen.getByRole('img');
      fireEvent.click(svg);

      // DEFECT CONFIRMATION:
      // KittenMascot.tsx line 57 binds onClick={onMascotClick} unconditionally,
      // ignoring the `interactive` prop (unlike onKeyDown which checks `interactive`).
      expect(handleClick).toHaveBeenCalledTimes(1);

      // However, keyboard navigation correctly blocks activation when interactive=false:
      fireEvent.keyDown(svg, { key: 'Enter' });
      fireEvent.keyDown(svg, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard navigation and clicks when interactive=true', () => {
      const handleClick = vi.fn();
      render(<KittenMascot interactive={true} onMascotClick={handleClick} />);

      const svg = screen.getByRole('img');
      fireEvent.click(svg);
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(svg, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(2);

      fireEvent.keyDown(svg, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(3);

      // Non-activation keys should not trigger click
      fireEvent.keyDown(svg, { key: 'Escape' });
      fireEvent.keyDown(svg, { key: 'ArrowDown' });
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Challenge 2: TenFrameGrid Boundary Grids (Empty, Full 10, Full 20) & Drag Events', () => {
    it('correctly renders an empty 10-frame grid (0/10)', () => {
      const grid = createEmptyFrame(10);
      render(<TenFrameGrid grid={grid} />);

      const slots = screen.getAllByRole('button');
      expect(slots).toHaveLength(10);
      expect(screen.getByText('0 / 10')).toBeInTheDocument();
      expect(screen.queryByLabelText(/tactile counter chip/)).not.toBeInTheDocument();
    });

    it('correctly renders an empty 20-frame grid (0/20)', () => {
      const grid = createEmptyFrame(20);
      render(<TenFrameGrid grid={grid} />);

      const slots = screen.getAllByRole('button');
      expect(slots).toHaveLength(20);
      const counts = screen.getAllByText('0 / 10');
      expect(counts).toHaveLength(2); // Frame 1 and Frame 2 both 0/10
    });

    it('correctly renders a completely full 10-frame grid (10/10)', () => {
      const grid = createPopulatedFrame(10, 5, 5);
      render(<TenFrameGrid grid={grid} />);

      expect(screen.getByText('10 / 10')).toBeInTheDocument();
      const counters = screen.getAllByRole('img');
      expect(counters).toHaveLength(10);
    });

    it('correctly renders a completely full 20-frame double grid (20/20)', () => {
      const grid = createPopulatedFrame(20, 10, 10);
      render(<TenFrameGrid grid={grid} />);

      const counts = screen.getAllByText('10 / 10');
      expect(counts).toHaveLength(2); // Both frames 10/10
      const counters = screen.getAllByRole('img');
      expect(counters).toHaveLength(20);
    });

    it('handles dragOver, dragLeave, and drop events with color data', () => {
      const handleDropCounter = vi.fn();
      const grid = createEmptyFrame(10);
      render(<TenFrameGrid grid={grid} onDropCounter={handleDropCounter} />);

      const slots = screen.getAllByRole('button');
      const firstSlot = slots[0];

      // DragOver
      fireEvent.dragOver(firstSlot, {
        dataTransfer: { dropEffect: 'none' },
      });

      // DragLeave
      fireEvent.dragLeave(firstSlot);

      // Drop with red color data
      fireEvent.drop(firstSlot, {
        dataTransfer: {
          getData: () => 'red',
        },
      });
      expect(handleDropCounter).toHaveBeenCalledWith(0, 'red');

      // Drop with black color data
      fireEvent.drop(firstSlot, {
        dataTransfer: {
          getData: () => 'black',
        },
      });
      expect(handleDropCounter).toHaveBeenCalledWith(0, 'black');

      // Drop with invalid data string should fall back to selectedColor ('red')
      fireEvent.drop(firstSlot, {
        dataTransfer: {
          getData: () => 'invalid-color',
        },
      });
      expect(handleDropCounter).toHaveBeenCalledWith(0, 'red');
    });

    it('disables slot interactions when interactive=false', () => {
      const handleClick = vi.fn();
      const grid = createEmptyFrame(10);
      render(<TenFrameGrid grid={grid} interactive={false} onSlotClick={handleClick} />);

      const slots = screen.getAllByRole('button');
      expect(slots[0]).toBeDisabled();
      fireEvent.click(slots[0]);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Challenge 3: ScoreBar Extreme and Pathological Values', () => {
    it('handles extreme positive scores and streaks without UI breakage', () => {
      render(<ScoreBar score={9999999} streak={500} bestStreak={1000} />);

      expect(screen.getByText('Streak Goal: 10 in a row')).toBeInTheDocument();
      // progressPercent is clamped at 100%
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('9999999')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    it('handles streak = 0, streak = 1, streak = 2, streak = 3, streak = 4, streak = 5', () => {
      const { rerender } = render(<ScoreBar score={0} streak={0} bestStreak={0} />);
      expect(screen.getByText('Streak Goal: 3 in a row')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();

      rerender(<ScoreBar score={100} streak={2} bestStreak={2} />);
      expect(screen.getByText('Streak Goal: 3 in a row')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument();

      rerender(<ScoreBar score={300} streak={3} bestStreak={3} />);
      expect(screen.getByText('Streak Goal: 5 in a row')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();

      rerender(<ScoreBar score={500} streak={5} bestStreak={5} />);
      expect(screen.getByText('Streak Goal: 10 in a row')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('safely tolerates negative and non-standard numeric inputs', () => {
      expect(() => {
        render(<ScoreBar score={-50} streak={-5} bestStreak={-1} />);
      }).not.toThrow();

      expect(() => {
        render(<ScoreBar score={NaN} streak={NaN} bestStreak={NaN} />);
      }).not.toThrow();

      expect(() => {
        render(<ScoreBar score={Infinity} streak={Infinity} bestStreak={Infinity} />);
      }).not.toThrow();
    });
  });

  describe('Challenge 4: CelebrationModal Edge Cases & Interaction', () => {
    it('renders and dismisses milestone 3, 5, 10 dialogs correctly', () => {
      const handleDismiss = vi.fn();
      const clickSpy = vi.spyOn(soundService, 'playButtonClick');

      const { rerender } = render(
        <CelebrationModal isOpen={true} streak={3} milestone={3} onDismiss={handleDismiss} />
      );

      expect(screen.getByText(/3-in-a-Row/)).toBeInTheDocument();
      expect(screen.getByText(/3 Problem Streak/)).toBeInTheDocument();

      const continueBtn = screen.getByRole('button', { name: /Continue Playing/i });
      fireEvent.click(continueBtn);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);

      // Milestone 5
      rerender(
        <CelebrationModal isOpen={true} streak={5} milestone={5} onDismiss={handleDismiss} />
      );
      expect(screen.getByText(/5-in-a-Row/)).toBeInTheDocument();

      // Milestone 10
      rerender(
        <CelebrationModal isOpen={true} streak={10} milestone={10} onDismiss={handleDismiss} />
      );
      expect(screen.getByText(/Grand Mastery Milestone/)).toBeInTheDocument();
    });

    it('tolerates non-standard milestone values without throwing', () => {
      expect(() => {
        render(
          <CelebrationModal
            isOpen={true}
            streak={99}
            // @ts-expect-error non-standard milestone
            milestone={99}
            onDismiss={() => {}}
          />
        );
      }).not.toThrow();
    });

    it('returns null when isOpen is false', () => {
      const { container } = render(
        <CelebrationModal isOpen={false} streak={3} milestone={3} onDismiss={() => {}} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Challenge 5: KittenCard Presentation Edge Cases', () => {
    it('renders single frame (10) and double frame (20) KittenCards with empty and full grids', () => {
      const empty10 = createEmptyFrame(10);
      const { rerender } = render(<KittenCard grid={empty10} title="Empty Card" />);
      expect(screen.getByTestId('kitten-card')).toBeInTheDocument();
      expect(screen.getByText('Empty Card')).toBeInTheDocument();

      const full20 = createPopulatedFrame(20, 10, 10);
      rerender(<KittenCard grid={full20} title="Full Double Card" />);
      expect(screen.getByText('Full Double Card')).toBeInTheDocument();
      expect(screen.getByText('Frame 1')).toBeInTheDocument();
      expect(screen.getByText('Frame 2')).toBeInTheDocument();
    });

    it('handles interactive card cell clicks', () => {
      const handleCellClick = vi.fn();
      const grid = createPopulatedFrame(10, 2, 0);
      render(
        <KittenCard
          grid={grid}
          interactive={true}
          onCellClick={handleCellClick}
        />
      );

      const cellButtons = screen.getAllByRole('button');
      fireEvent.click(cellButtons[0]);
      expect(handleCellClick).toHaveBeenCalledWith(0);
    });
  });

  describe('Challenge 6: PaperTray Counter Bank & Live Number Track', () => {
    it('renders number track up to capacity 10 and 20 with live highlighted count', () => {
      const handleSelectColor = vi.fn();
      const handleAddCounter = vi.fn();
      const handleClear = vi.fn();
      const handleFillFive = vi.fn();
      const handleFillTen = vi.fn();
      const handleToggleCap = vi.fn();

      const { rerender } = render(
        <PaperTray
          selectedColor="red"
          onSelectColor={handleSelectColor}
          currentCount={4}
          capacity={10}
          onAddCounter={handleAddCounter}
          onClearFrame={handleClear}
          onFillFive={handleFillFive}
          onFillTen={handleFillTen}
          onToggleCapacity={handleToggleCap}
        />
      );

      expect(screen.getByText('1-10 Number Track')).toBeInTheDocument();
      expect(screen.getByText('Count: 4')).toBeInTheDocument();

      // Click Add Red Chip
      const redBtn = screen.getByRole('button', { name: /Select and Add Red Counter/i });
      fireEvent.click(redBtn);
      expect(handleSelectColor).toHaveBeenCalledWith('red');
      expect(handleAddCounter).toHaveBeenCalledWith('red');

      // Click Add Black Chip
      const blackBtn = screen.getByRole('button', { name: /Select and Add Black Counter/i });
      fireEvent.click(blackBtn);
      expect(handleSelectColor).toHaveBeenCalledWith('black');
      expect(handleAddCounter).toHaveBeenCalledWith('black');

      // Action buttons
      fireEvent.click(screen.getByRole('button', { name: /Fill 5/i }));
      expect(handleFillFive).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /Fill 10/i }));
      expect(handleFillTen).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /Clear All/i }));
      expect(handleClear).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /Switch to Double/i }));
      expect(handleToggleCap).toHaveBeenCalledTimes(1);

      // Re-render with capacity 20
      rerender(
        <PaperTray
          selectedColor="black"
          onSelectColor={handleSelectColor}
          currentCount={14}
          capacity={20}
          onClearFrame={handleClear}
        />
      );
      expect(screen.getByText('1-20 Number Track')).toBeInTheDocument();
      expect(screen.getByText('Count: 14')).toBeInTheDocument();
    });
  });

  describe('Challenge 7: Rapid CPA Mode Toggling & App Tree Stability', () => {
    it('survives rapid mode toggling across Concrete, Pictorial, and Abstract modes without crashing', () => {
      render(<App />);

      const concreteTab = screen.getByRole('tab', { name: /Concrete/i });
      const pictorialTab = screen.getByRole('tab', { name: /Pictorial/i });
      const abstractTab = screen.getByRole('tab', { name: /Abstract/i });

      expect(concreteTab).toBeInTheDocument();
      expect(pictorialTab).toBeInTheDocument();
      expect(abstractTab).toBeInTheDocument();

      // Rapidly toggle between all 3 modes 30 times
      act(() => {
        for (let i = 0; i < 30; i++) {
          fireEvent.click(pictorialTab);
          fireEvent.click(abstractTab);
          fireEvent.click(concreteTab);
        }
      });

      // App should remain stable and responsive
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('survives rapid stage level switching (1 -> 2 -> 3 -> 4 -> 1)', () => {
      render(<App />);

      const stageBtns = screen.getAllByRole('button', { name: /Stage \d:/i });
      expect(stageBtns).toHaveLength(4);

      act(() => {
        for (let i = 0; i < 20; i++) {
          stageBtns.forEach((btn) => fireEvent.click(btn));
        }
      });

      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('toggles mute repeatedly via header button', () => {
      render(<App />);

      const muteBtn = screen.getByRole('button', { name: /Mute Audio/i });
      expect(muteBtn).toBeInTheDocument();

      act(() => {
        for (let i = 0; i < 20; i++) {
          fireEvent.click(muteBtn);
        }
      });

      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });
});
