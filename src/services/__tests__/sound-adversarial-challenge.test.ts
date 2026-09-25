import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SoundSynthesizer } from '../sound-service';

describe('Adversarial Challenger: Procedural Sound Synthesizer Stress Suite', () => {
  let synth: SoundSynthesizer;
  const originalAudioContext = window.AudioContext;
  const originalWebkitAudioContext = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  beforeEach(() => {
    localStorage.clear();
    synth = new SoundSynthesizer();
  });

  afterEach(() => {
    window.AudioContext = originalAudioContext;
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext = originalWebkitAudioContext;
    vi.restoreAllMocks();
  });

  describe('Challenge 1: Rapid Consecutive Burst Invocations (1,000 Invocations)', () => {
    it('executes 1,000 rapid sequential invocations across all 7 sound methods without crashing', () => {
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          const mod = i % 7;
          switch (mod) {
            case 0:
              synth.playCounterPlace(i % 2 === 0);
              break;
            case 1:
              synth.playCounterRemove();
              break;
            case 2:
              synth.playCardFlip();
              break;
            case 3:
              synth.playCorrect(i % 10);
              break;
            case 4:
              synth.playTryAgain();
              break;
            case 5:
              synth.playCelebrationFanfare();
              break;
            case 6:
              synth.playButtonClick();
              break;
          }
        }
      }).not.toThrow();
    });

    it('executes rapid repeated burst calls to complex synthesis methods without exhaustion', () => {
      expect(() => {
        for (let i = 0; i < 200; i++) {
          synth.playCounterPlace(true);
          synth.playCorrect(5);
          synth.playCelebrationFanfare();
        }
      }).not.toThrow();
    }, 10000);
  });

  describe('Challenge 2: Invalid Frequencies, Extreme Parameters & Non-Numeric Inputs', () => {
    it('handles extreme, boundary, and non-numeric streak inputs in playCorrect', () => {
      const extremeStreaks = [
        -1000,
        -1,
        0,
        1,
        2,
        3,
        4,
        5,
        10,
        999999,
        Number.MAX_SAFE_INTEGER,
        NaN,
        Infinity,
        -Infinity,
        undefined as unknown as number,
        null as unknown as number,
        'five' as unknown as number,
      ];

      for (const streak of extremeStreaks) {
        expect(() => synth.playCorrect(streak)).not.toThrow();
      }
    });

    it('handles unexpected argument types in playCounterPlace', () => {
      const strangeArgs = [
        true,
        false,
        undefined,
        null as unknown as boolean,
        0 as unknown as boolean,
        1 as unknown as boolean,
        'red' as unknown as boolean,
        {} as unknown as boolean,
        NaN as unknown as boolean,
      ];

      for (const arg of strangeArgs) {
        expect(() => synth.playCounterPlace(arg)).not.toThrow();
      }
    });
  });

  describe('Challenge 3: Mute/Unmute State Churn & Storage Resilience', () => {
    it('survives 1,000 rapid mute/unmute state changes interleaved with sound triggers', () => {
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          const isMute = i % 2 === 0;
          synth.setMuted(isMute);
          expect(synth.getMuted()).toBe(isMute);

          synth.playButtonClick();
          synth.playCounterPlace();
        }
      }).not.toThrow();
    });

    it('gracefully handles localStorage throwing SecurityError or QuotaExceededError', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      });
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

      // Constructing new instance with failing storage must not crash
      let resilientSynth: SoundSynthesizer | null = null;
      expect(() => {
        resilientSynth = new SoundSynthesizer();
      }).not.toThrow();
      expect(resilientSynth).not.toBeNull();
      expect(resilientSynth!.getMuted()).toBe(false);

      // Mutating mute state with failing storage must not crash
      expect(() => {
        resilientSynth!.setMuted(true);
      }).not.toThrow();
      expect(resilientSynth!.getMuted()).toBe(true);

      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });

    it('strictly guarantees zero audio node allocation when muted', () => {
      synth.setMuted(true);

      const oscSpy = vi.spyOn(AudioContext.prototype, 'createOscillator');
      const bufferSpy = vi.spyOn(AudioContext.prototype, 'createBufferSource');
      const gainSpy = vi.spyOn(AudioContext.prototype, 'createGain');

      synth.playCounterPlace(true);
      synth.playCounterPlace(false);
      synth.playCounterRemove();
      synth.playCardFlip();
      synth.playCorrect(1);
      synth.playCorrect(5);
      synth.playTryAgain();
      synth.playCelebrationFanfare();
      synth.playButtonClick();

      expect(oscSpy).not.toHaveBeenCalled();
      expect(bufferSpy).not.toHaveBeenCalled();
      expect(gainSpy).not.toHaveBeenCalled();
    });
  });

  describe('Challenge 4: AudioContext Lifecycle, Suspension & Hardware Failures', () => {
    it('automatically resumes suspended AudioContext on user sound event', () => {
      const resumeSpy = vi.spyOn(AudioContext.prototype, 'resume');

      // Trigger initial sound to initialize context
      synth.playButtonClick();

      // Simulate browser suspending context due to backgrounding or user inactivity
      const ctx = (synth as unknown as { ctx: AudioContext }).ctx;
      expect(ctx).toBeDefined();
      Object.defineProperty(ctx, 'state', { value: 'suspended', configurable: true, writable: true });

      resumeSpy.mockClear();
      synth.playButtonClick();
      expect(resumeSpy).toHaveBeenCalledTimes(1);
    });

    it('gracefully degrades when AudioContext constructor throws (e.g. device denied or unavailable)', () => {
      // Mock AudioContext to throw
      window.AudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Hardware audio device not available');
      }) as unknown as typeof AudioContext;

      const failingSynth = new SoundSynthesizer();

      // All methods must fail gracefully without throwing unhandled exceptions
      expect(() => failingSynth.playButtonClick()).not.toThrow();
      expect(() => failingSynth.playCounterPlace()).not.toThrow();
      expect(() => failingSynth.playCounterRemove()).not.toThrow();
      expect(() => failingSynth.playCardFlip()).not.toThrow();
      expect(() => failingSynth.playCorrect()).not.toThrow();
      expect(() => failingSynth.playTryAgain()).not.toThrow();
      expect(() => failingSynth.playCelebrationFanfare()).not.toThrow();
    });

    it('gracefully degrades when AudioContext is completely undefined (SSR or unsupported browser)', () => {
      window.AudioContext = undefined as unknown as typeof AudioContext;
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext = undefined;

      const noAudioSynth = new SoundSynthesizer();
      expect(() => noAudioSynth.playButtonClick()).not.toThrow();
      expect(() => noAudioSynth.playCounterPlace()).not.toThrow();
      expect(() => noAudioSynth.playCelebrationFanfare()).not.toThrow();
    });
  });

  describe('Challenge 5: Noise Buffer Generator Edge Cases', () => {
    it('safely generates transient noise buffers without NaN or zero-length errors', () => {
      expect(() => synth.playCardFlip()).not.toThrow();
      expect(() => synth.playCounterPlace(true)).not.toThrow();
      expect(() => synth.playCounterPlace(false)).not.toThrow();
    });
  });
});
