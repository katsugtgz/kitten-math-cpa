import { WebAudioSynthesizer } from './audio/web-audio-adapter';
import { defaultSynthesizer } from './audio/default-synthesizer';
import type { AudioPort } from './audio/audio-port';

export type { AudioPort, AudioPort as ISoundService };
export const SoundSynthesizer = WebAudioSynthesizer;
export type SoundSynthesizer = WebAudioSynthesizer;

export const soundService: AudioPort = defaultSynthesizer;
