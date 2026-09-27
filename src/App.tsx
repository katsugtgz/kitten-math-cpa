import React, { useReducer, useState } from 'react';
import { createInitialState, gameReducer } from './state/game-reducer';
import type { CounterColor, GameMode, StageLevel } from './state/types';
import { AudioProvider } from './services/audio/audio-context';
import { useAudio } from './services/audio/use-audio';
import { useAudioFeedback } from './services/audio/use-audio-feedback';
import type { AudioPort } from './services/audio/audio-port';
import { Header } from './components/hud/Header';
import { StageSelector } from './components/hud/StageSelector';
import { ScoreBar } from './components/hud/ScoreBar';
import { CelebrationModal } from './components/hud/CelebrationModal';
import { InstallBanner } from './components/pwa/InstallBanner';
import { ConcreteModeView } from './components/concrete/ConcreteModeView';
import { PictorialModeView } from './components/pictorial/PictorialModeView';
import { AbstractModeView } from './components/abstract/AbstractModeView';

export interface AppProps {
  readonly audio?: AudioPort;
}

function GameApp(): React.JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const { audio, isMuted, toggleMute } = useAudio();

  // Counter color lives at the app root so it survives Concrete mode-view unmounts.
  const [selectedColor, setSelectedColor] = useState<CounterColor>('red');

  // Attach reactive audio feedback listener (observing state transitions and counters)
  useAudioFeedback(state, audio);

  const handleModeChange = (mode: GameMode): void => {
    dispatch({ type: 'SET_MODE', mode });
  };

  const handleStageChange = (stage: StageLevel): void => {
    dispatch({ type: 'SET_STAGE', stage });
  };

  const handleDismissCelebration = (): void => {
    dispatch({ type: 'DISMISS_CELEBRATION' });
  };

  return (
    <div
      role="application"
      aria-label="Kitten Math CPA Learning Application"
      className="min-h-screen bg-[#fdfdfd] text-slate-900 flex flex-col font-sans selection:bg-orange-200"
    >
      {/* HUD Header with Branding, Mute Toggle, Score & Streak */}
      <Header
        score={state.score}
        streak={state.streak}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5 sm:gap-6">
        {/* PWA Install Banner */}
        <InstallBanner />

        {/* CPA Mode & Stage Navigation */}
        <StageSelector
          mode={state.mode}
          stage={state.stage}
          onModeChange={handleModeChange}
          onStageChange={handleStageChange}
        />

        {/* Player Streak Meter & Best Score Bar */}
        <ScoreBar
          score={state.score}
          streak={state.streak}
          bestStreak={state.bestStreak}
        />

        {/* CPA Stage View Routing */}
        <div className="flex-1 flex flex-col items-center justify-start py-2">
          {state.mode === 'concrete' && (
            <ConcreteModeView
              state={state}
              dispatch={dispatch}
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
            />
          )}

          {state.mode === 'pictorial' && (
            <PictorialModeView state={state} dispatch={dispatch} />
          )}

          {state.mode === 'abstract' && (
            <AbstractModeView state={state} dispatch={dispatch} />
          )}
        </div>
      </main>

      {/* Victory Celebration Modal */}
      <CelebrationModal
        isOpen={state.isCelebrating}
        streak={state.streak}
        milestone={state.celebrationMilestone}
        onDismiss={handleDismissCelebration}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400 bg-white">
        <p>
          Singapore Concrete-Pictorial-Abstract (CPA) Early Mathematics PWA • Built with React 18 & Web Audio API
        </p>
      </footer>
    </div>
  );
}

export default function App({ audio }: AppProps = {}): React.JSX.Element {
  return (
    <AudioProvider audio={audio}>
      <GameApp />
    </AudioProvider>
  );
}
