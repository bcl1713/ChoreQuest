# Task List: Visual & UI Enhancement - Fantasy RPG Theme

Based on PRD: `0008-prd-visual-ui-enhancements.md`

## Relevant Files

### New Files Created/To Create
- `hooks/useReducedMotion.ts` - ✅ Custom hook to detect and respect user's motion preferences
- `hooks/useReducedMotion.test.ts` - ✅ Unit tests for useReducedMotion hook
- `lib/animations/constants.ts` - ✅ Animation timing constants and easing functions
- `lib/animations/variants.ts` - ✅ Framer Motion animation variant definitions
- `lib/animations/variants.test.ts` - ✅ Unit tests for animation variants
- `lib/utils.ts` - ✅ Utility functions (cn for className merging)
- `components/ui/FantasyButton.tsx` - ✅ Reusable fantasy-themed button component
- `components/ui/FantasyButton.test.tsx` - ✅ Unit tests for FantasyButton
- `components/ui/FantasyCard.tsx` - ✅ Reusable fantasy-themed card component
- `components/ui/FantasyCard.test.tsx` - ✅ Unit tests for FantasyCard
- `components/ui/LoadingSpinner.tsx` - ✅ Fantasy-themed loading spinner component
- `components/ui/LoadingSpinner.test.tsx` - ✅ Unit tests for LoadingSpinner
- `components/icons/FantasyIcon.tsx` - ✅ Wrapper component for Lucide icons with fantasy styling
- `components/icons/FantasyIcon.test.tsx` - ✅ Unit tests for FantasyIcon
- `components/animations/QuestCompleteOverlay.tsx` - ✅ Quest completion celebration overlay
- `components/animations/QuestCompleteOverlay.test.tsx` - ✅ Unit tests for QuestCompleteOverlay
- `components/animations/LevelUpModal.tsx` - ✅ Level up celebration modal
- `components/animations/LevelUpModal.test.tsx` - ✅ Unit tests for LevelUpModal
- `components/animations/ParticleEffect.tsx` - ✅ Particle effect animation component
- `components/animations/ParticleEffect.test.tsx` - ✅ Unit tests for ParticleEffect
- `components/animations/ProgressBar.tsx` - ✅ Animated XP/progress bar component
- `components/animations/ProgressBar.test.tsx` - ✅ Unit tests for ProgressBar

### Existing Files to Modify
- `app/globals.css` - Expand fantasy theme utilities and add animation classes
- `components/quest-dashboard.tsx` - Integrate quest completion animations and enhance existing animations
- `components/character/CharacterCreation.tsx` - Add enhanced class selection animations
- `components/reward-store.tsx` - Add reward redemption animations
- `app/dashboard/page.tsx` - Integrate character stats with progress bars and level up celebrations
- `app/layout.tsx` - Add global loading state and theme provider if needed
- `lib/character-context.tsx` - Add level up event handling and notification system
- `components/ui/FantasyButton.tsx` - ✅ Added forwardRef support for ref forwarding

### Test Files
- `tests/e2e/quest-completion-animation.spec.ts` - E2E tests for quest completion flow with animations
- `tests/e2e/level-up-celebration.spec.ts` - E2E tests for level up celebration flow
- `tests/e2e/reduced-motion.spec.ts` - E2E tests for reduced motion accessibility

### Notes
- Unit tests should be placed alongside the code files they are testing (e.g., `ProgressBar.tsx` and `ProgressBar.test.tsx` in the same directory).
- Use `npm run test` to run all Jest unit tests.
- Use `npx playwright test` to run E2E tests (requires dev server running on port 3000).
- Follow TDD approach: Write tests first, implement to pass tests, then refactor.

## Tasks

- [x] 1.0 Setup Animation Infrastructure & Foundation
  - [x] 1.1 Create `hooks/useReducedMotion.ts` hook that detects `prefers-reduced-motion` media query and returns boolean
  - [x] 1.2 Write unit tests for `hooks/useReducedMotion.test.ts` covering enabled/disabled states and media query changes
  - [x] 1.3 Create `lib/animations/constants.ts` with timing constants (quick: 200ms, medium: 400ms, celebration: 1000ms), easing functions, and particle limits
  - [x] 1.4 Create `lib/animations/variants.ts` with Framer Motion variants for: fadeIn, slideIn, scaleIn, stagger, and celebration animations
  - [x] 1.5 Write unit tests for `lib/animations/variants.test.ts` to validate variant structure and reduced motion behavior
  - [x] 1.6 Update `app/globals.css` to add new utility classes: `.fantasy-button-primary`, `.fantasy-button-secondary`, `.glow-effect`, `.pulse-animation`
  - [x] 1.7 Run `npm run build` and `npm run lint` to ensure no errors

- [x] 2.0 Implement Core UI Components with Fantasy Theme
  - [x] 2.1 Create `components/ui/FantasyButton.tsx` with variants (primary, secondary, danger), sizes, loading state, and hover animations
  - [x] 2.2 Write unit tests for `components/ui/FantasyButton.test.tsx` covering all variants, disabled state, loading state, and click handlers
  - [x] 2.3 Create `components/ui/FantasyCard.tsx` with gradient backgrounds, borders, optional glow effect, and hover animations
  - [x] 2.4 Write unit tests for `components/ui/FantasyCard.test.tsx` covering rendering, className merging, and children rendering
  - [x] 2.5 Create `components/ui/LoadingSpinner.tsx` with spinning sword/shield animation and reduced motion fallback (pulse)
  - [x] 2.6 Write unit tests for `components/ui/LoadingSpinner.test.tsx` covering size variants and accessibility attributes
  - [x] 2.7 Create `components/icons/FantasyIcon.tsx` wrapper for Lucide icons with consistent sizing, coloring by type (gold, xp, gem), and optional glow
  - [x] 2.8 Write unit tests for `components/icons/FantasyIcon.test.tsx` covering icon types, colors, sizes, and ARIA labels
  - [x] 2.9 Run all unit tests: `npm run test` and verify all pass

- [x] 3.0 Build Celebration & Feedback Animation Components
  - [x] 3.1 Create `components/animations/ParticleEffect.tsx` with configurable particle count, colors, duration, and animation paths (float up + fade)
  - [x] 3.2 Write unit tests for `components/animations/ParticleEffect.test.tsx` covering particle rendering, animation triggers, and reduced motion behavior
  - [x] 3.3 Create `components/animations/ProgressBar.tsx` with animated fill, XP display (current/total), percentage, and smooth transitions
  - [x] 3.4 Write unit tests for `components/animations/ProgressBar.test.tsx` covering progress updates, percentage calculations, and animation behavior
  - [x] 3.5 Create `components/animations/QuestCompleteOverlay.tsx` with semi-transparent backdrop, reward display, particle effects, and auto-dismiss (5s)
  - [x] 3.6 Write unit tests for `components/animations/QuestCompleteOverlay.test.tsx` covering show/hide, reward rendering, auto-dismiss, and manual dismiss
  - [x] 3.7 Create `components/animations/LevelUpModal.tsx` with full-screen modal, burst animation, level display (old→new), character info, and dismiss button
  - [x] 3.8 Write unit tests for `components/animations/LevelUpModal.test.tsx` covering modal visibility, level changes, multi-level-ups (x3), and keyboard navigation
  - [x] 3.9 Run all unit tests: `npm run test` and verify all celebration components pass

- [ ] 4.0 Integrate Animations into Existing Features
  - [ ] 4.1 Update `lib/character-context.tsx` to add `levelUpEvent` state and `triggerLevelUp` function that tracks level changes
  - [ ] 4.2 Modify `components/quest-dashboard.tsx` to import and use `QuestCompleteOverlay` component, triggering on quest approval with calculated rewards
  - [ ] 4.3 Update `components/quest-dashboard.tsx` to use staggered list animations for quest items using Framer Motion variants from `lib/animations/variants.ts`
  - [ ] 4.4 Modify `app/dashboard/page.tsx` to add `ProgressBar` component showing character XP progress and `LevelUpModal` listening to character context
  - [ ] 4.5 Update `components/character/CharacterCreation.tsx` to enhance class selection cards with hover scale and glow animations
  - [ ] 4.6 Modify `components/reward-store.tsx` to add redemption success animation (could reuse `QuestCompleteOverlay` pattern or create subtle feedback)
  - [ ] 4.7 Replace all generic loading spinners across the app with `LoadingSpinner` component (in quest-dashboard, character creation, etc.)
  - [ ] 4.8 Update button components throughout app to use `FantasyButton` component instead of inline button styles
  - [ ] 4.9 Run `npm run build` and manually test all integrated features in dev server

- [ ] 5.0 Add E2E Tests & Accessibility Validation
  - [ ] 5.1 Create `tests/e2e/quest-completion-animation.spec.ts` to test: hero completes quest → overlay appears → shows rewards → auto-dismisses after 5s
  - [ ] 5.2 Create `tests/e2e/level-up-celebration.spec.ts` to test: quest approval gives XP → character levels up → modal appears → shows level change → user dismisses
  - [ ] 5.3 Create `tests/e2e/reduced-motion.spec.ts` to test animations are disabled/simplified when browser has `prefers-reduced-motion: reduce` set
  - [ ] 5.4 Add accessibility checks to E2E tests: verify ARIA labels on icons, keyboard navigation on modals, focus trapping on overlays
  - [ ] 5.5 Run full E2E test suite: `npx playwright test` and verify all tests pass
  - [ ] 5.6 Run Lighthouse audit on dashboard page and verify performance score >85
  - [ ] 5.7 Manually test with screen reader (if available) or automated accessibility scanner (axe DevTools) and fix any violations
  - [ ] 5.8 Update TASKS.md to mark visual enhancement tasks as complete
