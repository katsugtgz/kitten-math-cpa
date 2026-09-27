import { createContext } from 'react';
import type { AudioContextValue } from './audio-context';

/**
 * Ambient audio context instance. Lives in its own module so component files
 * stay fast-refresh clean and non-component modules can import the type alone.
 */
export const AudioContext = createContext<AudioContextValue | null>(null);
