import React, { useState, useMemo, useCallback } from 'react';
import type { AudioPort } from './audio-port';
import { defaultSynthesizer } from './default-synthesizer';
import { AudioContext } from './audio-context-instance';

export interface AudioContextValue {
  readonly audio: AudioPort;
  readonly isMuted: boolean;
  readonly setMuted: (muted: boolean) => void;
  readonly toggleMute: () => void;
}

export interface AudioProviderProps {
  readonly children: React.ReactNode;
  readonly audio?: AudioPort;
}

export function AudioProvider({
  children,
  audio = defaultSynthesizer,
}: AudioProviderProps): React.JSX.Element {
  const [isMuted, setIsMutedState] = useState<boolean>(() => audio.getMuted());

  // Resync mute state when the adapter instance changes: each adapter owns its
  // mute flag, so a swap without this would keep showing the old adapter's state.
  const [prevAudio, setPrevAudio] = useState<AudioPort>(audio);
  if (prevAudio !== audio) {
    setPrevAudio(audio);
    const adapterMuted = audio.getMuted();
    if (adapterMuted !== isMuted) {
      setIsMutedState(adapterMuted);
    }
  }

  const setMuted = useCallback(
    (muted: boolean): void => {
      audio.setMuted(muted);
      setIsMutedState(muted);
    },
    [audio]
  );

  const toggleMute = useCallback((): void => {
    const next = !audio.getMuted();
    audio.setMuted(next);
    setIsMutedState(next);
  }, [audio]);

  const value = useMemo<AudioContextValue>(
    () => ({ audio, isMuted, setMuted, toggleMute }),
    [audio, isMuted, setMuted, toggleMute]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}
