import { useContext } from 'react';
import { AudioContext } from './audio-context-instance';
import type { AudioContextValue } from './audio-context';
import { useAudioFallbackValue } from './use-audio-fallback';

/**
 * Resolves the ambient audio context value. Inside AudioProvider this returns
 * the provider value; outside it falls back to a reactive singleton-backed
 * value so isolated consumers still see live mute state.
 */
export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  const fallback = useAudioFallbackValue();
  return context ?? fallback;
}
