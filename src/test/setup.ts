import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const isCssParseError = args.some((arg) => {
    const text =
      typeof arg === 'string'
        ? arg
        : arg instanceof Error
          ? `${arg.message} ${arg.stack ?? ''}`
          : String(arg);
    return (
      text.includes('Could not parse CSS stylesheet') ||
      text.includes('[torph-') ||
      text.includes('--torph-')
    );
  });

  if (isCssParseError) {
    return;
  }
  originalConsoleError(...args);
};

const proc = (
  globalThis as unknown as {
    process?: { stderr?: { write: (...args: unknown[]) => boolean } };
  }
).process;

if (proc && proc.stderr) {
  const originalStderrWrite = proc.stderr.write.bind(proc.stderr);
  proc.stderr.write = (chunk: unknown, ...rest: unknown[]) => {
    const str = String(chunk);
    if (
      str.includes('Could not parse CSS stylesheet') ||
      str.includes('[torph-') ||
      str.includes('--torph-')
    ) {
      return true;
    }
    return originalStderrWrite(chunk, ...rest);
  };
}


// Mock Web Audio API for jsdom environment
class MockAudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = {};

  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        value: 440,
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        value: 1,
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: {
        setValueAtTime: vi.fn(),
        value: 1000,
      },
      Q: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createBuffer() {
    return {
      getChannelData: vi.fn().mockReturnValue(new Float32Array(1024)),
    };
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: MockAudioContext,
});

Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn().mockReturnValue(true),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

if (typeof Element !== 'undefined') {
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = vi.fn().mockReturnValue([]);
  }
  if (!Element.prototype.animate) {
    Element.prototype.animate = vi.fn().mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      reverse: vi.fn(),
      finish: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onfinish: null,
    }));
  }
}


