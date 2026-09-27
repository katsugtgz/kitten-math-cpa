import { useMemo, useSyncExternalStore } from 'react';
import { defaultSynthesizer } from './default-synthesizer';
import type { AudioContextValue } from './audio-context';

// The provider-less useAudio fallback reads mute state through this tiny
// external store so mute toggles re-render consumers even outside AudioProvider.
const fallbackMuteSubscribers = new Set<() => void>();

function subscribeFallbackMute(onStoreChange: () => void): () => void {
  fallbackMuteSubscribers.add(onStoreChange);
  return () => {
    fallbackMuteSubscribers.delete(onStoreChange);
  };
}

function readFallbackMute(): boolean {
  return defaultSynthesizer.getMuted();
}

function notifyFallbackMute(): void {
  fallbackMuteSubscribers.forEach((listener) => listener());
}

/**
 * Fallback audio context value for components rendered outside an
 * AudioProvider (unit tests, isolated composition). Backed by the shared
 * production singleton; mute state stays reactive through an external store.
 */
export function useAudioFallbackValue(): AudioContextValue {
  const isMuted = useSyncExternalStore(subscribeFallbackMute, readFallbackMute, readFallbackMute);

  return useMemo<AudioContextValue>(
    () => ({
      audio: defaultSynthesizer,
      isMuted,
      setMuted: (muted: boolean) => {
        defaultSynthesizer.setMuted(muted);
        notifyFallbackMute();
      },
      toggleMute: () => {
        defaultSynthesizer.setMuted(!defaultSynthesizer.getMuted());
        notifyFallbackMute();
      },
    }),
    [isMuted]
  );
}
