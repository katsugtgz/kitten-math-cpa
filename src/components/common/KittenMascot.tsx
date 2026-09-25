import React from 'react';

export type MascotEmotion = 'peeking' | 'thinking' | 'cheering';
export type MascotCoat = 'calico' | 'tabby' | 'white';
export type MascotPawState = 'resting' | 'waving' | 'both-raised';

export interface KittenMascotProps {
  readonly emotion?: MascotEmotion;
  readonly coat?: MascotCoat;
  readonly pawState?: MascotPawState;
  readonly className?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly speechBubble?: string;
  readonly interactive?: boolean;
  readonly onMascotClick?: () => void;
}

const SIZE_CLASSES = {
  sm: 'w-24 h-18',
  md: 'w-36 h-28',
  lg: 'w-48 h-36',
} as const;

export function KittenMascot({
  emotion = 'peeking',
  coat = 'calico',
  pawState = 'resting',
  className = '',
  size = 'md',
  speechBubble,
  interactive = false,
  onMascotClick,
}: KittenMascotProps): React.JSX.Element {
  const sizeClass = SIZE_CLASSES[size];
  const ariaLabel = `Cute ${coat} kitten mascot, ${emotion}`;

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${className}`}
      data-testid="kitten-mascot"
    >
      {speechBubble && (
        <div
          role="status"
          className="mb-1.5 px-3 py-1 bg-white border-2 border-slate-700 rounded-2xl shadow-sm text-xs font-bold text-slate-800 relative z-10 animate-bounce"
        >
          {speechBubble}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-slate-700 rotate-45" />
        </div>
      )}

      <svg
        viewBox="0 0 160 120"
        role="img"
        aria-label={ariaLabel}
        className={`${sizeClass} ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''}`}
        onClick={onMascotClick}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onMascotClick?.();
          }
        }}
      >
        <defs>
          <filter id="mascot-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Ears */}
        {/* Left Ear */}
        <path
          d="M 36 50 L 28 14 L 62 26 Z"
          fill="#ffffff"
          stroke="#1e293b"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Left Ear Inner */}
        <path d="M 38 42 L 34 20 L 56 28 Z" fill="#fbcfe8" />

        {/* Right Ear */}
        <path
          d="M 124 50 L 132 14 L 98 26 Z"
          fill="#ffffff"
          stroke="#1e293b"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Right Ear Inner */}
        <path d="M 122 42 L 126 20 L 104 28 Z" fill="#fbcfe8" />

        {/* Coat Patches */}
        {coat === 'calico' && (
          <path
            d="M 36 50 L 28 14 L 62 26 Q 52 42 66 52 Q 46 56 36 50 Z"
            fill="#f97316"
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        )}
        {coat === 'tabby' && (
          <path
            d="M 124 50 L 132 14 L 98 26 Q 108 42 94 52 Q 114 56 124 50 Z"
            fill="#64748b"
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        )}

        {/* Head Contour */}
        <ellipse
          cx="80"
          cy="70"
          rx="52"
          ry="40"
          fill="#ffffff"
          stroke="#1e293b"
          strokeWidth="3.5"
          filter="url(#mascot-soft-shadow)"
        />

        {/* Head Patches Overlay inside Head Contour */}
        {coat === 'calico' && (
          <path
            d="M 32 60 Q 45 42 68 46 Q 60 70 42 78 Q 30 72 32 60 Z"
            fill="#f97316"
            opacity="0.9"
          />
        )}
        {coat === 'tabby' && (
          <path
            d="M 128 60 Q 115 42 92 46 Q 100 70 118 78 Q 130 72 128 60 Z"
            fill="#64748b"
            opacity="0.9"
          />
        )}

        {/* Whiskers */}
        <g stroke="#64748b" strokeWidth="2" strokeLinecap="round">
          <line x1="38" y1="72" x2="20" y2="70" />
          <line x1="38" y1="78" x2="22" y2="80" />
          <line x1="122" y1="72" x2="140" y2="70" />
          <line x1="122" y1="78" x2="138" y2="80" />
        </g>

        {/* Cheeks Blush */}
        <ellipse cx="48" cy="78" rx="8" ry="5" fill="#fda4af" opacity="0.75" />
        <ellipse cx="112" cy="78" rx="8" ry="5" fill="#fda4af" opacity="0.75" />

        {/* Eyes according to emotion */}
        {emotion === 'peeking' && (
          <g fill="#1e293b">
            {/* Left Eye */}
            <circle cx="58" cy="68" r="5.5" />
            <circle cx="56.5" cy="66" r="2" fill="#ffffff" />
            <circle cx="60" cy="69.5" r="0.8" fill="#ffffff" />
            {/* Right Eye */}
            <circle cx="102" cy="68" r="5.5" />
            <circle cx="100.5" cy="66" r="2" fill="#ffffff" />
            <circle cx="104" cy="69.5" r="0.8" fill="#ffffff" />
          </g>
        )}

        {emotion === 'thinking' && (
          <g>
            {/* Left Eye Looking Up Right */}
            <circle cx="58" cy="67" r="5.5" fill="#1e293b" />
            <circle cx="59.5" cy="65" r="2.2" fill="#ffffff" />
            {/* Right Eye slightly squinted */}
            <ellipse cx="102" cy="68" rx="5.5" ry="3.5" fill="#1e293b" />
            <circle cx="103" cy="67" r="1.5" fill="#ffffff" />
            {/* Curious Eyebrows */}
            <path
              d="M 52 58 Q 58 54 64 57"
              stroke="#1e293b"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 96 59 Q 102 56 108 59"
              stroke="#1e293b"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}

        {emotion === 'cheering' && (
          <g stroke="#1e293b" strokeWidth="3.5" fill="none" strokeLinecap="round">
            {/* Happy Crescent Eyes */}
            <path d="M 52 70 Q 58 63 64 70" />
            <path d="M 96 70 Q 102 63 108 70" />
          </g>
        )}

        {/* Nose */}
        <polygon points="76,75 84,75 80,79" fill="#f472b6" stroke="#1e293b" strokeWidth="1" />

        {/* Mouth */}
        {emotion === 'cheering' ? (
          <g>
            <path
              d="M 72 80 Q 80 94 88 80 Z"
              fill="#fb7185"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M 76 86 Q 80 90 84 86" stroke="#f43f5e" strokeWidth="2" fill="none" />
          </g>
        ) : (
          <path
            d="M 72 80 Q 76 84 80 80 Q 84 84 88 80"
            fill="none"
            stroke="#1e293b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* Paws */}
        {/* Resting Paws on Card Rim (default) */}
        {pawState === 'resting' && (
          <g fill="#ffffff" stroke="#1e293b" strokeWidth="3">
            {/* Left Paw */}
            <ellipse cx="54" cy="110" rx="12" ry="9" />
            <line x1="50" y1="108" x2="50" y2="116" stroke="#1e293b" strokeWidth="2" />
            <line x1="56" y1="108" x2="56" y2="116" stroke="#1e293b" strokeWidth="2" />

            {/* Right Paw */}
            <ellipse cx="106" cy="110" rx="12" ry="9" />
            <line x1="102" y1="108" x2="102" y2="116" stroke="#1e293b" strokeWidth="2" />
            <line x1="108" y1="108" x2="108" y2="116" stroke="#1e293b" strokeWidth="2" />
          </g>
        )}

        {/* Waving Paw State */}
        {pawState === 'waving' && (
          <g>
            {/* Right Paw Resting */}
            <ellipse cx="106" cy="110" rx="12" ry="9" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
            <line x1="102" y1="108" x2="102" y2="116" stroke="#1e293b" strokeWidth="2" />
            <line x1="108" y1="108" x2="108" y2="116" stroke="#1e293b" strokeWidth="2" />

            {/* Left Paw Raised Waving */}
            <g transform="translate(24, 46) rotate(-15)">
              <ellipse cx="12" cy="12" rx="11" ry="13" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
              {/* Pink Paw Pad */}
              <ellipse cx="12" cy="14" rx="5" ry="4" fill="#fda4af" />
              {/* Toe beans */}
              <circle cx="6" cy="7" r="2" fill="#fda4af" />
              <circle cx="12" cy="5" r="2.2" fill="#fda4af" />
              <circle cx="18" cy="7" r="2" fill="#fda4af" />
            </g>
          </g>
        )}

        {/* Both Raised Celebrating Paw State */}
        {pawState === 'both-raised' && (
          <g>
            {/* Left Paw Raised */}
            <g transform="translate(18, 38) rotate(-25)">
              <ellipse cx="12" cy="12" rx="11" ry="13" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
              <ellipse cx="12" cy="14" rx="5" ry="4" fill="#fda4af" />
              <circle cx="6" cy="7" r="2" fill="#fda4af" />
              <circle cx="12" cy="5" r="2.2" fill="#fda4af" />
              <circle cx="18" cy="7" r="2" fill="#fda4af" />
            </g>

            {/* Right Paw Raised */}
            <g transform="translate(118, 32) rotate(25)">
              <ellipse cx="12" cy="12" rx="11" ry="13" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
              <ellipse cx="12" cy="14" rx="5" ry="4" fill="#fda4af" />
              <circle cx="6" cy="7" r="2" fill="#fda4af" />
              <circle cx="12" cy="5" r="2.2" fill="#fda4af" />
              <circle cx="18" cy="7" r="2" fill="#fda4af" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
