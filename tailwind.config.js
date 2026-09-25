/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#fdfdfd',
          'bg-dark': '#121212',
          surface: '#ffffff',
          'surface-dark': '#181818',
          card: '#ffffff',
          'card-dark': '#1e1e1e',
        },
        counter: {
          red: {
            light: '#f87171',
            DEFAULT: '#ef4444',
            dark: '#dc2626',
            shadow: '#991b1b',
          },
          black: {
            light: '#334155',
            DEFAULT: '#1e293b',
            dark: '#0f172a',
            shadow: '#020617',
          },
        },
        cpa: {
          concrete: '#10b981',
          pictorial: '#3b82f6',
          abstract: '#8b5cf6',
        },
        kitten: {
          orange: '#f97316',
          cream: '#fef3c7',
          slate: '#94a3b8',
          ear: '#fda4af',
          nose: '#fb7185',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Roboto Mono"', 'monospace'],
      },
      transitionTimingFunction: {
        'spring-pop': 'cubic-bezier(0.34, 1.45, 0.64, 1)',
        'spring-ease': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'spring-hover': 'cubic-bezier(0.34, 3.85, 0.64, 1)',
        'spring-close': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        celebrate: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-12px) scale(1.05)' },
        },
        'counter-clack': {
          '0%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 400ms cubic-bezier(0.34, 1.45, 0.64, 1)',
        shake: 'shake 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        celebrate: 'celebrate 600ms ease-in-out infinite',
        'counter-clack': 'counter-clack 200ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
