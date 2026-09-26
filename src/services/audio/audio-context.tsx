/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { AudioPort } from './audio-port';
import { WebAudioSynthesizer } from './web-audio-adapter';

export interface AudioContextValue {
  readonly audio: AudioPort;
  readonly isMuted: boolean;
  readonly setMuted: (muted: boolean) => void;
  readonly toggleMute: () => void;
}

export const defaultSynthesizer = new WebAudioSynthesizer();

const AudioContext = createContext<AudioContextValue | null>(null);

export interface AudioProviderProps {
  readonly children: React.ReactNode;
  readonly audio?: AudioPort;
}

export function AudioProvider({
  children,
  audio = defaultSynthesizer,
}: AudioProviderProps): React.JSX.Element {
  const [isMuted, setIsMutedState] = useState<boolean>(() => audio.getMuted());

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
    () => ({
      audio,
      isMuted,
      setMuted,
      toggleMute,
    }),
    [audio, isMuted, setMuted, toggleMute]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  if (!context) {
    // Resilient fallback for unit tests rendering components in isolation without AudioProvider
    return {
      audio: defaultSynthesizer,
      isMuted: defaultSynthesizer.getMuted(),
      setMuted: (muted: boolean) => defaultSynthesizer.setMuted(muted),
      toggleMute: () => defaultSynthesizer.setMuted(!defaultSynthesizer.getMuted()),
    };
  }
  return context;
}
