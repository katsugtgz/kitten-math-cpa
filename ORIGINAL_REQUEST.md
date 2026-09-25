# Original User Request

## Initial Request — 2026-09-25T05:43:11Z

Build a production-grade, highly engaging, colorful Progressive Web App (PWA) for early mathematics based on the Concrete-Pictorial-Abstract (CPA) framework (featuring interactive ten-frames with draggable counters, cute kitten mascot ten-frame visual cards inspired by the reference image, and abstract number-bond equations), engineered with strict Test-Driven Development (TDD), zero lint/build warnings, a 100/100 react-doctor score, and comprehensive GitHub Actions CI/CD automation.

Working directory: C:\Users\asd\mathgameagy
Integrity mode: development

## Reference Materials
- Physical reference image: C:\Users\asd\Downloads\asdasd.png (demonstrating cute kitten-headed ten-frame cards, double ten-frame 1-20 sets, red & black counters, paper tray manipulatives, and number track strips).
- Motion & UI documentation:
  - transitions.dev CSS motion curves & tokens (https://transitions.dev/skill.html)
  - Torph text & numeric morphing (torph/react, https://github.com/lochie/torph)
  - Typehug typographic spacing engine (@typehug/en, https://github.com/alexszczurek/typehug)
- Engineering methodologies:
  - Matt Pocock Agent Skills: strict TDD (Red-Green-Refactor), decoupled codebase architecture, and agent search workflows strictly utilizing rg (ripgrep).

## Requirements

### R1. CPA Learning Engine & Gameplay Modes
1. Concrete Mode: Physical manipulative simulator featuring single (1-10) and double (1-20) ten-frame grids, a counter tray with tactile red and black counters/chips, smooth drag-and-drop / click-to-place interactions, and sound/haptic feedback.
2. Pictorial Mode: Visual pattern recognition and subitizing challenge cards featuring illustrated cute kitten mascots peeking over ten-frame grids (faithful to asdasd.png), rapid flash-card identification, and comparisons.
3. Abstract Mode: Mathematical symbolic bridge translating ten-frame configurations into number bonds, addition/subtraction equations (e.g. 10 + 1 = 11, 4 + 2 = 6), with an interactive number pad and instant visual validation.
4. Progression & Adaptive Difficulty: Guided step-by-step learning path moving from Concrete to Pictorial to Abstract, with score tracking, streaks, celebratory victory animations, and sound effects.

### R2. Asset Generation, PWA & UI/UX Design
1. Visual Theme & Assets: Playful, vibrant, high-contrast, accessible color palette. Generate complete game assets (cute SVG/vector kitten mascots with multiple expressive states: thinking, cheering, peeking; red and black tactile 3D-styled token chips; celebratory badges and star icons; sound synth audio effects).
2. UI & Micro-interactions: Integrate torph/react (<TextMorph>) for smooth numeric transitions on scores and counters, @typehug/en for polished typographic balance without awkward line breaks, and transitions.dev spring and cubic-bezier tokens for UI transitions.
3. Full PWA Capabilities: Web App Manifest (manifest.json), service worker with offline asset caching, app icons (192px, 512px, maskable), theme-color meta, and install prompt banner.

### R3. Architectural Design & Codebase Principles
1. Clean separation between math domain logic, game state machine, and React presentation components (codebase-design).
2. Pure, deterministic math generators and state transitions fully decoupled from browser APIs for straightforward testability.
3. Code search and inspection tasks executed via rg (ripgrep) for efficiency.

### R4. Quality Verification, TDD & CI/CD
1. Strict TDD & Coverage: Comprehensive test suite using Vitest and React Testing Library covering math generators, ten-frame state models, user interaction events, and scoring logic. Red-Green-Refactor discipline.
2. End-to-End Verification: Playwright test suite validating core game loops: dragging counters, switching CPA modes, completing equations, and verifying offline PWA registration.
3. React Doctor Quality Audit: Codebase must achieve a 100/100 score on npx react-doctor@latest --blocking warning with zero warnings and zero errors.
4. GitHub Actions CI/CD: Fully automated workflow in .github/workflows/ci.yml running lint, typecheck, unit tests, E2E tests, and react-doctor using verified latest stable action versions (actions/checkout@v4, actions/setup-node@v4, etc.).
5. Open Source Repository Polish: Complete README.md with demo screenshots, pedagogical explanations of CPA Singapore math, installation instructions, license (MIT), GitHub release configuration, and topic tags.

## Acceptance Criteria

### Functional & Gameplay Verification
- [ ] Ten-frame manipulative supports placing, removing, and clearing counters (red & black) up to 20 with keyboard and touch/mouse drag-and-drop.
- [ ] Visual kitten cards render accurately matching the style in asdasd.png across single and double frame layouts.
- [ ] Concrete, Pictorial, and Abstract modes are playable with clear visual transitions, score tracking, and animated feedback.
- [ ] PWA passes Lighthouse PWA criteria, caches assets for offline play, and installs to home screen.
- [ ] Numbers and counter values morph smoothly using torph TextMorph without layout shift.

### Automated Testing & Quality Bar
- [ ] npm test runs all unit/integration tests with 100% pass rate.
- [ ] npx playwright test (or dry-run E2E harness) completes end-to-end user journeys with all green results.
- [ ] npx react-doctor@latest --blocking warning exits with code 0, 100/100 score, 0 warnings, and 0 errors.
- [ ] npm run lint and npm run typecheck pass with zero diagnostics.
- [ ] npm run build generates optimized production PWA bundle with zero build errors.
- [ ] .github/workflows/ci.yml is valid YAML and includes all quality gates using modern stable action versions.
- [ ] Comprehensive documentation in README.md including game rules, architecture, CPA pedagogical guide, and release tags.
