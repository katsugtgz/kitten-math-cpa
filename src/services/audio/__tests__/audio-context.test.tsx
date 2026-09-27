import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AudioProvider } from '../audio-context';
import { useAudio } from '../use-audio';
import { defaultSynthesizer } from '../default-synthesizer';
import { SilentAudioAdapter } from '../silent-audio-adapter';

function TestConsumer(): React.JSX.Element {
  const { isMuted, toggleMute, setMuted, audio } = useAudio();
  return (
    <div>
      <span data-testid="mute-state">{isMuted ? 'muted' : 'unmuted'}</span>
      <button type="button" onClick={toggleMute}>
        Toggle Mute
      </button>
      <button type="button" onClick={() => setMuted(true)}>
        Mute Direct
      </button>
      <button type="button" onClick={() => audio.playButtonClick()}>
        Play Click
      </button>
    </div>
  );
}

describe('AudioContext and AudioProvider', () => {
  beforeEach(() => {
    // Fallback consumers share the production singleton; reset its mute flag
    defaultSynthesizer.setMuted(false);
  });

  it('provides mute state and toggle functionality with custom adapter', () => {
    const silentAdapter = new SilentAudioAdapter(false);

    render(
      <AudioProvider audio={silentAdapter}>
        <TestConsumer />
      </AudioProvider>
    );

    expect(screen.getByTestId('mute-state')).toHaveTextContent('unmuted');
    expect(silentAdapter.getMuted()).toBe(false);

    // Toggle mute
    fireEvent.click(screen.getByText('Toggle Mute'));
    expect(screen.getByTestId('mute-state')).toHaveTextContent('muted');
    expect(silentAdapter.getMuted()).toBe(true);

    // Toggle unmute
    fireEvent.click(screen.getByText('Toggle Mute'));
    expect(screen.getByTestId('mute-state')).toHaveTextContent('unmuted');
    expect(silentAdapter.getMuted()).toBe(false);

    // Direct setMuted
    fireEvent.click(screen.getByText('Mute Direct'));
    expect(screen.getByTestId('mute-state')).toHaveTextContent('muted');
    expect(silentAdapter.getMuted()).toBe(true);

    // Audio port method
    fireEvent.click(screen.getByText('Play Click'));
    expect(silentAdapter.calls.playButtonClick).toBe(1);
  });

  it('provides safe resilient fallback when useAudio is used outside AudioProvider', () => {
    render(<TestConsumer />);

    expect(screen.getByTestId('mute-state')).toBeInTheDocument();
    // Invocations outside provider do not throw
    expect(() => fireEvent.click(screen.getByText('Toggle Mute'))).not.toThrow();
    expect(() => fireEvent.click(screen.getByText('Play Click'))).not.toThrow();
  });

  it('resyncs mute state when the audio adapter is swapped', () => {
    const unmutedAdapter = new SilentAudioAdapter(false);
    const mutedAdapter = new SilentAudioAdapter(true);

    const { rerender } = render(
      <AudioProvider audio={unmutedAdapter}>
        <TestConsumer />
      </AudioProvider>
    );
    expect(screen.getByTestId('mute-state')).toHaveTextContent('unmuted');

    rerender(
      <AudioProvider audio={mutedAdapter}>
        <TestConsumer />
      </AudioProvider>
    );
    expect(screen.getByTestId('mute-state')).toHaveTextContent('muted');

    rerender(
      <AudioProvider audio={unmutedAdapter}>
        <TestConsumer />
      </AudioProvider>
    );
    expect(screen.getByTestId('mute-state')).toHaveTextContent('unmuted');
  });

  it('fallback mute toggle re-renders consumers outside AudioProvider', async () => {
    render(<TestConsumer />);

    const toggle = screen.getByText('Toggle Mute');
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(screen.getByTestId('mute-state')).toHaveTextContent('muted');

    await act(async () => {
      fireEvent.click(screen.getByText('Toggle Mute'));
    });
    expect(screen.getByTestId('mute-state')).toHaveTextContent('unmuted');
  });
});
