# 🐱 Kitten Math: Singapore CPA Ten-Frame Adventure

[![CI/CD & GitHub Pages](https://github.com/katsugtgz/kitten-math-cpa/actions/workflows/ci.yml/badge.svg)](https://github.com/katsugtgz/kitten-math-cpa/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen)](https://katsugtgz.github.io/kitten-math-cpa/)
[![React Doctor Score](https://img.shields.io/badge/React%20Doctor-100%2F100-success)](https://react.doctor)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20%26%20Offline-orange.svg)](https://web.dev/progressive-web-apps/)

An interactive, colorful **Progressive Web App (PWA)** for early childhood mathematics learning engineered around the Singapore Math **Concrete-Pictorial-Abstract (CPA)** framework.

🎮 **Live Application**: [https://katsugtgz.github.io/kitten-math-cpa/](https://katsugtgz.github.io/kitten-math-cpa/)

Inspired by physical Montessori and Singapore Math manipulatives, Kitten Math features cute kitten mascots peeking over ten-frame cards, tactile red & black counters, an origami paper tray bank, a 1-20 number track strip, and an interactive number bond engine.

---

## 🌟 Pedagogical Framework: Singapore Math CPA

The **Concrete-Pictorial-Abstract (CPA)** approach (pioneered by Jerome Bruner and central to Singapore Math) scaffolds mathematical intuition through three progressive learning representations:

```
┌────────────────────────────────┐
│   1. Concrete Representation   │
│   Physical Manipulatives       │
│   • Single & Double Ten-Frames │
│   • Red & Black Tactile Chips  │
│   • Origami Paper Tray         │
│   • 1-20 Number Track Strip    │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│   2. Pictorial Representation  │
│   Visual Pattern Recognition   │
│   • Kitten Flash Cards         │
│   • Subitizing (Perceptual &   │
│     Conceptual Patterns)       │
│   • "Five-Wise" & "Pair-Wise"  │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│   3. Abstract Representation   │
│   Symbolic Mathematics         │
│   • Number Bond Trees (P-P-W)  │
│   • Bridging-Ten Equations     │
│   • Virtual Number Keypad      │
└────────────────────────────────┘
```

### 1. Concrete Stage: Physical Manipulatives
- **Single (1-10) and Double (1-20) Ten-Frames**: Helps young learners internalize base-10 and base-5 anchor structures.
- **Two-Tone Tactile Counters**: Red and black 3D-styled token chips support decomposition (e.g. 7 can be represented as 4 red chips and 3 black chips).
- **Origami Paper Manipulative Tray**: Loose token storage bay and quick-fill manipulatives ("Fill 5", "Fill 10", "Clear All").
- **1-20 Number Track Strip**: Real-time linear number track that highlights current counts in sync with ten-frame capacity.

### 2. Pictorial Stage: Visual Subitizing Cards
- **Cute Kitten Mascots**: Calico, tabby, and white kittens peeking over cards with dynamic expressive states (*peeking*, *thinking*, *cheering*).
- **Subitizing Challenges**: Teaches children to instantly recognize quantities without counting individual items one-by-one.
- **Dynamic Scaffolding**: Automatically offers visual hints (e.g., "Think of making ten! Look at the full row of 5") after 2 consecutive errors.

### 3. Abstract Stage: Symbolic Equations & Number Bonds
- **Singapore Number Bond Trees**: Visual Part-Part-Whole diagrams where learners solve for missing wholes or missing parts.
- **Bridging-Ten Equations**: Arithmetic expressions (e.g., $10 + 4 = 14$, $8 + 5 = 13$, $15 - 5 = 10$) that bridge through 10.
- **Virtual Keypad & Keyboard Support**: Integrated numeric touch keypad and physical keyboard bindings (`0-9`, `Backspace`, `Enter`).

---

## 🛠️ Architecture & Technical Stack

The codebase strictly adheres to **clean decoupled architecture**, separating pure mathematics domain models from state management, audio services, and React presentation:

```
src/
├── domain/                  # Pure, deterministic math models (Zero DOM/React dependencies)
│   ├── ten-frame.ts         # Cell grid representation, capacity & counter manipulation
│   ├── subitize.ts          # Subitizing problem generator with pedagogical distributions
│   ├── number-bond.ts       # Part-Part-Whole bond generator with "Friends of Ten"
│   ├── equation.ts          # Arithmetic equation generator with bridging-ten logic
│   └── types.ts             # Domain interfaces and immutable types
├── state/                   # Redux-style immutable state machine
│   ├── game-reducer.ts      # Pure game reducer (frozen transitions, 0 side effects)
│   ├── progression.ts       # Scoring, multiplier, streak milestones & scaffolding
│   └── types.ts             # Game actions, state schema & mode contracts
├── services/                # External services & hardware interfaces
│   └── sound-service.ts     # Procedural Web Audio API sound synthesizer
├── components/              # Presentation layer (React 18 + Tailwind CSS)
│   ├── concrete/            # TenFrameGrid, PaperTray, TactileCounter
│   ├── pictorial/           # KittenCard, PictorialModeView
│   ├── abstract/            # NumberBondTree, EquationDisplay, VirtualKeypad
│   ├── hud/                 # Header, StageSelector, ScoreBar, CelebrationModal
│   ├── common/              # KittenMascot, AnimatedNumber, TypoText
│   └── pwa/                 # InstallBanner
└── test/                    # Test environment configuration (jsdom, AudioContext mocks)
```

### Motion, Audio & Typography Libraries
- **`torph/react` (`<TextMorph>`)**: Smooth morphing between changing score and counter values without layout shift.
- **`@typehug/en`**: High-polish typographic spacing engine preventing awkward line breaks and ragging.
- **`transitions.dev`**: Spring and cubic-bezier motion tokens for tactile feedback.
- **Web Audio API**: Procedurally synthesized sound effects (counter placement clicks, soft pops, card flips, celebratory chimes, and retry tones). Zero external MP3/WAV network dependencies.

### Progressive Web App (PWA)
- **Offline First**: Powered by `vite-plugin-pwa` and Workbox caching. Pre-caches all app shell assets and icons.
- **Web App Manifest**: Full metadata for standalone installation on iOS, Android, and Desktop.
- **Responsive & Accessible**: High contrast accessible color palette, semantic ARIA roles, live regions, and full keyboard navigation.

---

## 🧪 Quality Verification & Testing

Every layer of the application is validated with rigorous test coverage:

| Gate | Tool | Status | Metrics |
|---|---|---|---|
| **Unit & Integration** | Vitest + React Testing Library | ✅ Passing | 206 tests across 18 test suites |
| **End-to-End (E2E)** | Playwright (Chromium) | ✅ Passing | 21 comprehensive E2E tests |
| **Architecture Audit** | React Doctor | ✅ 100 / 100 | 0 errors, 0 warnings (`--blocking warning`) |
| **Linting** | ESLint 9 | ✅ Passing | 0 errors, 0 warnings (`--max-warnings 0`) |
| **Type Safety** | TypeScript 5.7 (`strict`) | ✅ Passing | 0 diagnostics (`--noEmit`) |
| **Production Build** | Vite 8 + Rollup | ✅ Built | Optimized bundle with PWA precache |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x+
- npm 9.x+

### Installation
```bash
# Clone the repository
git clone https://github.com/katsugtgz/kitten-math-cpa.git
cd kitten-math-cpa

# Install dependencies
npm install
```

### Running Locally
```bash
# Start development server with HMR
npm run dev
# App will run at http://localhost:5173
```

### Running Tests
```bash
# Run Vitest unit & component test suite
npm test

# Run Vitest in watch mode
npm run test:watch

# Run Playwright End-to-End test suite
npm run e2e

# Run with interactive UI
npx playwright test --ui
```

### Code Quality & Build Commands
```bash
# Run ESLint check
npm run lint

# Run TypeScript type check
npm run typecheck

# Run React Doctor quality audit
npm run doctor

# Build production bundle with PWA assets
npm run build

# Preview production build locally
npm run preview
```

---

## 📂 Project Structure

```
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI pipeline with modern stable actions
├── e2e/                         # Playwright End-to-End tests
│   ├── concrete-mode.spec.ts    # Ten-frame counters & paper tray interactions
│   ├── pictorial-mode.spec.ts   # Subitizing cards & answer feedback
│   ├── abstract-mode.spec.ts    # Number bonds, equations & virtual keypad
│   ├── pwa-offline.spec.ts      # Service worker & offline caching
│   └── cpa-journey.spec.ts      # Full CPA progression journey
├── public/                      # Static assets & PWA icons
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── maskable-icon-512x512.png
├── src/                         # Application source code
├── index.html                   # HTML entry point with PWA meta tags
├── playwright.config.ts         # Playwright test runner configuration
├── vitest.config.ts             # Vitest configuration with jsdom & v8 coverage
├── doctor.config.ts             # React Doctor configuration
├── eslint.config.js             # ESLint 9 configuration
└── vite.config.ts               # Vite configuration with VitePWA
```

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
