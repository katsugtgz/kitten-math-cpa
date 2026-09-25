import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KittenMascot } from '../common/KittenMascot';
import { TactileCounter } from '../common/TactileCounter';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { TypoText } from '../common/TypoText';

describe('Common Presentation Components', () => {
  describe('KittenMascot', () => {
    it('renders with default props and peeking aria label', () => {
      render(<KittenMascot />);
      const mascot = screen.getByRole('img', { name: /calico kitten mascot, peeking/i });
      expect(mascot).toBeInTheDocument();
    });

    it('renders with thinking and cheering emotions', () => {
      const { rerender } = render(<KittenMascot emotion="thinking" coat="tabby" />);
      expect(screen.getByRole('img', { name: /tabby kitten mascot, thinking/i })).toBeInTheDocument();

      rerender(<KittenMascot emotion="cheering" coat="white" pawState="both-raised" />);
      expect(screen.getByRole('img', { name: /white kitten mascot, cheering/i })).toBeInTheDocument();
    });

    it('renders speech bubble when provided', () => {
      render(<KittenMascot speechBubble="Great job!" />);
      expect(screen.getByText('Great job!')).toBeInTheDocument();
    });

    it('handles interactive clicks', () => {
      const handleClick = vi.fn();
      render(<KittenMascot interactive onMascotClick={handleClick} />);
      const mascot = screen.getByRole('img');
      fireEvent.click(mascot);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('TactileCounter', () => {
    it('renders red counter with accessibility label and radial gradient styling', () => {
      render(<TactileCounter color="red" />);
      const counter = screen.getByRole('img', { name: /red tactile counter chip/i });
      expect(counter).toBeInTheDocument();
      expect(counter.getAttribute('style')).toContain('radial-gradient');
    });

    it('renders black counter with accessibility label', () => {
      render(<TactileCounter color="black" />);
      const counter = screen.getByRole('img', { name: /black tactile counter chip/i });
      expect(counter).toBeInTheDocument();
    });

    it('triggers click events when interactive', () => {
      const handleClick = vi.fn();
      render(<TactileCounter color="red" interactive onClick={handleClick} />);
      const counter = screen.getByRole('img');
      fireEvent.click(counter);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('AnimatedNumber', () => {
    it('renders numeric string content correctly', () => {
      render(<AnimatedNumber value={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('TypoText', () => {
    it('glues text and renders cleanly', () => {
      render(<TypoText>Count to 10 with the cute kitten!</TypoText>);
      expect(screen.getByText(/Count to 10 with the cute kitten!/i)).toBeInTheDocument();
    });
  });
});
