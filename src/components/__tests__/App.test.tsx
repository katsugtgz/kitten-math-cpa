import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../App';

describe('App Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders application header, mode selector, and concrete mode by default', () => {
    render(<App />);

    expect(screen.getByRole('application')).toBeInTheDocument();
    expect(screen.getByText('Kitten Math')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /concrete/i })).toBeInTheDocument();
    expect(screen.getByTestId('concrete-mode-view')).toBeInTheDocument();
    expect(screen.getByText('📦 Paper Tray Manipulatives')).toBeInTheDocument();
  });

  it('allows placing and removing counters in Concrete mode', () => {
    render(<App />);

    const slot1 = screen.getByLabelText('Slot 1: empty');
    fireEvent.click(slot1);

    expect(screen.getByLabelText('Slot 1: red')).toBeInTheDocument();

    // Clicking slot 1 again removes the counter
    fireEvent.click(screen.getByLabelText('Slot 1: red'));
    expect(screen.getByLabelText('Slot 1: empty')).toBeInTheDocument();
  });

  it('switches between Concrete, Pictorial, and Abstract modes', () => {
    render(<App />);

    // Switch to Pictorial mode
    const pictorialTab = screen.getByRole('tab', { name: /pictorial/i });
    fireEvent.click(pictorialTab);
    expect(screen.getByTestId('pictorial-mode-view')).toBeInTheDocument();

    // Switch to Abstract mode
    const abstractTab = screen.getByRole('tab', { name: /abstract/i });
    fireEvent.click(abstractTab);
    expect(screen.getByTestId('abstract-mode-view')).toBeInTheDocument();

    // Switch back to Concrete mode
    const concreteTab = screen.getByRole('tab', { name: /concrete/i });
    fireEvent.click(concreteTab);
    expect(screen.getByTestId('concrete-mode-view')).toBeInTheDocument();
  });

  it('toggles audio mute button in header', () => {
    render(<App />);

    const muteBtn = screen.getByRole('button', { name: /mute audio/i });
    fireEvent.click(muteBtn);

    expect(screen.getByRole('button', { name: /unmute audio/i })).toBeInTheDocument();
    expect(localStorage.getItem('kitten_math_muted')).toBe('true');
  });

  it('switches stages and updates game state', () => {
    render(<App />);

    const stage3Btn = screen.getByRole('button', { name: /stage 3/i });
    fireEvent.click(stage3Btn);

    expect(stage3Btn).toHaveAttribute('aria-pressed', 'true');
  });
});
