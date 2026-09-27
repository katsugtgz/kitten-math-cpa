/**
 * Audio Port: Singapore CPA Kitten Math Audio & Haptics Interface.
 *
 * Provides a decoupled abstraction seam over browser sound synthesis and haptic vibration,
 * isolating audio implementation details (Web Audio API, AudioContext, OscillatorNode)
 * from React presentation views and the state machine.
 */
export interface AudioPort {
  /**
   * Synthesize tactile counter placement click/clack sound.
   * @param isRed Whether the placed counter chip is red (higher tone) or black (lower tone)
   */
  playCounterPlace(isRed?: boolean): void;

  /**
   * Synthesize popping/removal sound when lifting a counter off the grid.
   */
  playCounterRemove(): void;

  /**
   * Synthesize smooth card-flip whoosh sound when presenting a new challenge card.
   */
  playCardFlip(): void;

  /**
   * Synthesize cheerful ascending chime arpeggio on correct answer.
   * Extends the arpeggio with an extra note when streak >= 3.
   * @param streak Current consecutive streak count
   */
  playCorrect(streak?: number): void;

  /**
   * Synthesize gentle descending boop sound encouraging another attempt on incorrect answer.
   */
  playTryAgain(): void;

  /**
   * Synthesize triumphant celebration fanfare and sustained harmonic chord on streak milestones.
   */
  playCelebrationFanfare(): void;

  /**
   * Synthesize subtle high-frequency tactile click on button or tab press.
   */
  playButtonClick(): void;

  /**
   * Trigger haptic vibration pulse on supported mobile touch devices.
   * @param pattern Milliseconds duration or vibration pattern array
   */
  triggerHaptic(pattern?: number | number[]): void;

  /**
   * Update audio and haptic mute setting.
   * @param muted True to silence audio and haptics, false to unmute
   */
  setMuted(muted: boolean): void;

  /**
   * Inspect current mute status.
   */
  getMuted(): boolean;
}
