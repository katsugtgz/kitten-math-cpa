import { WebAudioSynthesizer } from './web-audio-adapter';

/**
 * Production singleton audio adapter.
 * Lives in its own React-free module so non-React consumers (tests, legacy
 * sound-service facade) do not pull React side effects into their import graph.
 */
export const defaultSynthesizer = new WebAudioSynthesizer();
