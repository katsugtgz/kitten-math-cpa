import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useAudio } from '../../services/audio/audio-context';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallBanner(): React.JSX.Element | null {
  const { audio } = useAudio();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event): void => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!installPrompt || isDismissed) {
    return null;
  }

  const handleInstallClick = async (): Promise<void> => {
    audio.playButtonClick();
    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } catch {
      // Ignore install prompt errors
    }
  };

  const handleDismiss = (): void => {
    audio.playButtonClick();
    setIsDismissed(true);
  };

  return (
    <aside
      role="banner"
      aria-label="PWA Installation Prompt"
      data-testid="pwa-install-banner"
      className="w-full max-w-4xl mx-auto bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3 animate-fade-in"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold leading-tight">Install Kitten Math</h2>
          <p className="text-xs text-sky-100">
            Play offline anytime with fast access from your home screen!
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstallClick}
          className="px-3.5 py-1.5 bg-white text-indigo-700 hover:bg-sky-50 font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          Install App
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss Install Banner"
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
