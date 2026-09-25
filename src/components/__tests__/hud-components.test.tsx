import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Header } from '../hud/Header';
import { StageSelector } from '../hud/StageSelector';
import { ScoreBar } from '../hud/ScoreBar';
import { CelebrationModal } from '../hud/CelebrationModal';
import { InstallBanner } from '../pwa/InstallBanner';

describe('HUD and PWA Components', () => {
  describe('Header', () => {
    it('renders score, streak, title and mute toggle', () => {
      const handleToggleMute = vi.fn();
      render(
        <Header
          score={42}
          streak={3}
          isMuted={false}
          onToggleMute={handleToggleMute}
        />
      );

      expect(screen.getByText('Kitten Math')).toBeInTheDocument();
      expect(screen.getAllByText('42').length).toBeGreaterThan(0);
      expect(screen.getAllByText('3').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /mute audio/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /mute audio/i }));
      expect(handleToggleMute).toHaveBeenCalledTimes(1);
    });
  });

  describe('StageSelector', () => {
    it('renders CPA mode tabs and stage buttons and handles selection', () => {
      const handleModeChange = vi.fn();
      const handleStageChange = vi.fn();

      render(
        <StageSelector
          mode="concrete"
          stage={1}
          onModeChange={handleModeChange}
          onStageChange={handleStageChange}
        />
      );

      expect(screen.getByRole('tab', { name: /pictorial/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('tab', { name: /pictorial/i }));
      expect(handleModeChange).toHaveBeenCalledWith('pictorial');

      const stage3Btn = screen.getByRole('button', { name: /stage 3/i });
      fireEvent.click(stage3Btn);
      expect(handleStageChange).toHaveBeenCalledWith(3);
    });
  });

  describe('ScoreBar', () => {
    it('renders streak goal meter and point stats', () => {
      render(<ScoreBar score={100} streak={2} bestStreak={5} />);
      expect(screen.getByText(/Streak Goal: 3 in a row/i)).toBeInTheDocument();
      expect(screen.getAllByText('100').length).toBeGreaterThan(0);
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    });
  });

  describe('CelebrationModal', () => {
    it('does not render when isOpen is false', () => {
      render(
        <CelebrationModal
          isOpen={false}
          streak={5}
          milestone={5}
          onDismiss={vi.fn()}
        />
      );
      expect(screen.queryByTestId('celebration-modal')).not.toBeInTheDocument();
    });

    it('renders milestone celebration and calls onDismiss when clicked', () => {
      const handleDismiss = vi.fn();
      render(
        <CelebrationModal
          isOpen={true}
          streak={5}
          milestone={5}
          onDismiss={handleDismiss}
        />
      );

      expect(screen.getByTestId('celebration-modal')).toBeInTheDocument();
      expect(screen.getByText(/Super Math Star! 5-in-a-Row!/i)).toBeInTheDocument();

      const continueBtn = screen.getByRole('button', { name: /continue playing/i });
      fireEvent.click(continueBtn);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('InstallBanner', () => {
    it('renders when beforeinstallprompt event is fired', () => {
      render(<InstallBanner />);
      expect(screen.queryByTestId('pwa-install-banner')).not.toBeInTheDocument();

      const event = new Event('beforeinstallprompt');
      Object.assign(event, {
        platforms: ['web'],
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
        prompt: vi.fn().mockResolvedValue(undefined),
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(screen.getByTestId('pwa-install-banner')).toBeInTheDocument();
      expect(screen.getByText('Install Kitten Math')).toBeInTheDocument();

      // Dismiss banner
      fireEvent.click(screen.getByRole('button', { name: /dismiss install banner/i }));
      expect(screen.queryByTestId('pwa-install-banner')).not.toBeInTheDocument();
    });
  });
});
