# PRD-0008: Visual & UI Enhancement - Fantasy RPG Theme

## Introduction/Overview

ChoreQuest currently has a basic fantasy RPG color scheme and minimal animations. This feature will transform the application into an immersive, visually engaging fantasy RPG experience through comprehensive theming, animations, progress visualizations, and interactive feedback systems. The goal is to increase user engagement and make completing household tasks feel like an exciting adventure.

## Goals

1. **Enhance Visual Identity**: Establish a cohesive medieval fantasy aesthetic throughout the entire application
2. **Improve User Engagement**: Use animations and visual feedback to make interactions more rewarding and fun
3. **Celebrate Achievements**: Create memorable moments when users complete quests and level up
4. **Provide Clear Feedback**: Implement intuitive progress indicators and visual cues for all user actions
5. **Maintain Performance**: Ensure smooth animations even on mobile/low-end devices
6. **Respect Accessibility**: Support reduced motion preferences and maintain usability

## User Stories

1. **As a hero**, I want to see smooth, fantasy-themed animations when I complete a quest, so that I feel a sense of accomplishment and excitement.

2. **As a guild master**, I want the interface to feel like a medieval quest board with RPG-styled components, so that the chore management experience is more engaging.

3. **As a user on mobile**, I want the animations to be smooth and performant, so that my experience isn't degraded by lag or stuttering.

4. **As a user with motion sensitivity**, I want to have reduced or no animations when my system preferences indicate reduced motion, so that I can use the app comfortably.

5. **As a hero**, I want to see my XP progress toward the next level with an animated progress bar, so that I understand how close I am to leveling up.

6. **As a hero**, I want to hear optional sound effects when I complete quests and level up (that I can toggle off), so that achievements feel more celebratory.

7. **As a user**, I want to see fantasy-themed loading animations instead of generic spinners, so that even waiting feels on-theme.

8. **As a hero**, I want prominent, full-screen celebrations when I level up, so that reaching new levels feels like a major achievement.

## Functional Requirements

### 1. Fantasy Theme Implementation (MVP)

**FR-1.1**: The application must use a consistent medieval fantasy design language across all pages and components.

**FR-1.2**: All cards and containers must use the `.fantasy-card` styling or enhanced variations with subtle texture effects (parchment-like or stone backgrounds).

**FR-1.3**: Buttons must use fantasy-themed styling with gradient effects, hover states, and subtle glow effects.

**FR-1.4**: The color palette must use the existing theme colors (primary/pink, gold, gem/blue, xp/green, dark grays) consistently throughout the app.

**FR-1.5**: Typography must leverage existing fantasy fonts (var(--font-fantasy), var(--font-game)) for headings and important UI elements.

**FR-1.6**: All quest difficulty indicators must use color-coded theming (EASY=green, MEDIUM=yellow, HARD=red) with appropriate icons.

### 2. Animation System with Framer Motion (MVP)

**FR-2.1**: The system must use Framer Motion for all animations (already installed as a dependency).

**FR-2.2**: All list items (quests, rewards, activity feed entries) must have staggered fade-in animations when first rendered.

**FR-2.3**: All interactive elements (buttons, cards) must have smooth hover and press animations (scale, shadow, glow effects).

**FR-2.4**: Page transitions must include subtle fade and slide effects.

**FR-2.5**: The animation system must respect the user's `prefers-reduced-motion` system preference and disable/minimize animations accordingly.

**FR-2.6**: All animations must target 60fps performance on desktop and acceptable performance (30fps+) on mobile devices.

### 3. Quest Completion Animations (MVP)

**FR-3.1**: When a hero marks a quest as completed, a prominent overlay animation must appear showing:
   - A celebratory header (e.g., "Quest Complete!")
   - The quest title
   - Rewards earned (XP, gold, gems, honor)
   - Particle effects (stars, sparkles, or gold coins)
   - A "Continue" button to dismiss

**FR-3.2**: The overlay must be a semi-transparent backdrop that doesn't block the entire screen but clearly shows the achievement.

**FR-3.3**: The animation must include smooth entrance (scale up + fade in) and exit (scale down + fade out) transitions.

**FR-3.4**: Particle effects must be subtle and performant (limit to 20-30 particles maximum).

**FR-3.5**: The quest completion animation must auto-dismiss after 5 seconds or when the user clicks "Continue".

### 4. Level Up Celebrations (MVP)

**FR-4.1**: When a character levels up, a full-screen modal must appear with:
   - Dramatic entrance animation (burst effect from center)
   - Large "LEVEL UP!" text with glow/pulse effect
   - Old level → New level display
   - Character name and class
   - Particle effects (stars, light rays, or magical effects)
   - A prominent "Continue Adventure" button

**FR-4.2**: The level up celebration must pause or overlay all other UI elements.

**FR-4.3**: The animation must include sound effect trigger point (even if sound is muted/disabled).

**FR-4.4**: The celebration must remain visible until the user explicitly dismisses it.

**FR-4.5**: If multiple level-ups occur simultaneously (e.g., gaining 3 levels), show a single celebration with "LEVEL UP x3!" or similar.

### 5. Progress Bars & Visual Feedback (MVP)

**FR-5.1**: Character XP progress must be displayed as an animated progress bar showing:
   - Current XP / XP needed for next level
   - Percentage complete
   - Smooth animated fill when XP is gained
   - RPG-style gradient (green to bright green glow at high values)

**FR-5.2**: Quest progress tracking (for multi-step quests, future feature) must use segmented progress indicators.

**FR-5.3**: All progress bars must use smooth CSS or Framer Motion animations when values change.

**FR-5.4**: Reward redemption cooldowns (if applicable) must show countdown timers with circular or linear progress indicators.

**FR-5.5**: Loading states must replace generic spinners with themed animations (see FR-8).

### 6. Sound Effects System (Nice-to-have)

**FR-6.1**: The application must support sound effects for the following events:
   - Quest completion
   - Level up
   - Quest accepted/picked up
   - Reward redemption
   - Button clicks (subtle, optional)

**FR-6.2**: A sound settings panel must be added to user settings with:
   - Master on/off toggle
   - Individual volume control (0-100%)
   - Per-category toggles (effects, UI sounds)

**FR-6.3**: Sound preferences must be stored in local storage and persist across sessions.

**FR-6.4**: All sounds must be royalty-free or appropriately licensed.

**FR-6.5**: Sound files must be optimized (compressed MP3 or OGG format, <100KB each).

**FR-6.6**: The system must gracefully handle browsers that don't support audio playback.

**FR-6.7**: Sounds must respect the user's reduced motion preference (auto-disable if reduced motion is enabled).

### 7. Fantasy-Themed Icon Library Integration (MVP)

**FR-7.1**: The application must use icons from **Lucide React** (already installed) supplemented with custom fantasy-themed SVG icons where needed.

**FR-7.2**: Common RPG icons must be defined:
   - Quest scroll (quest instances)
   - Sword/shield (character/combat)
   - Coins (gold rewards)
   - Gem/crystal (gem rewards)
   - Lightning bolt (XP)
   - Crown (guild master)
   - Star (level/rank)
   - Trophy (achievements)

**FR-7.3**: Icons must be consistently sized and colored according to context (gold for gold rewards, green for XP, etc.).

**FR-7.4**: Icon components must support optional glow effects (using CSS box-shadow).

**FR-7.5**: All icons must be accessible with appropriate ARIA labels.

### 8. Loading Animations (MVP)

**FR-8.1**: Global page loading states must use a custom fantasy-themed loader:
   - Option A: Spinning sword or shield icon
   - Option B: Pulsing quest scroll
   - Option C: Animated coin flip

**FR-8.2**: Component-level loading states (e.g., fetching quests) must use skeleton screens styled with fantasy theme (dark gradient cards).

**FR-8.3**: Button loading states must show inline spinners or animated dots with "Loading..." text.

**FR-8.4**: All loading animations must loop smoothly and indicate progress is happening.

**FR-8.5**: Loading animations must respect reduced motion preferences (use simpler pulse effects instead of rotation).

## Non-Goals (Out of Scope)

1. **3D Graphics**: No three.js or WebGL 3D models/scenes
2. **Video Backgrounds**: No animated video backgrounds
3. **Complex Physics**: No advanced particle physics engines
4. **Custom Audio Composition**: Sound effects will be sourced from existing libraries, not custom-composed
5. **Accessibility-breaking Animations**: No animations that cannot be disabled via system preferences
6. **Background Music**: Only sound effects, no ambient music or soundtrack
7. **Custom Illustration Assets**: Will use existing icon libraries and CSS effects, not custom character illustrations
8. **Complex Gesture Controls**: Animations triggered by standard clicks/taps only, no swipe gestures or multi-touch

## Design Considerations

### Existing Design System

The application already has a fantasy color palette defined in `app/globals.css`:

- **Primary** (Pink): #ec4899 (primary-500) - Used for hero/character elements
- **Gold**: #f59e0b (gold-500) - Used for gold currency and important highlights
- **Gem** (Blue): #0ea5e9 (gem-500) - Used for gem currency
- **XP** (Green): #22c55e (xp-500) - Used for experience points
- **Dark** (Slate): #0f172a to #1e293b - Used for backgrounds and cards

### Visual Design Requirements

1. **Color Usage**:
   - Use gold accents for important CTAs and achievements
   - Use XP green for progress and growth indicators
   - Use primary pink for character/hero-specific elements
   - Use gem blue for premium/special items
   - Maintain dark theme as primary (with light theme support for accessibility)

2. **Animation Timing**:
   - Quick interactions: 150-250ms (button hovers, clicks)
   - Medium transitions: 300-500ms (page transitions, modal appearances)
   - Celebrations: 800-1200ms (quest completion, level up entrances)
   - Particle effects: 1500-2500ms (floating up and fading out)

3. **Typography**:
   - Use `var(--font-fantasy)` for headings and dramatic text (level up, quest titles)
   - Use `var(--font-game)` for UI labels and buttons
   - Use system fonts for body text (readability)

4. **Spacing & Layout**:
   - Maintain existing responsive grid layouts
   - Ensure touch targets meet 44px minimum (already defined in `.touch-target` class)
   - Use consistent padding and borders from `.fantasy-card` class

### Component Examples

#### Quest Completion Overlay (Wireframe)
```
┌─────────────────────────────────────────────┐
│   [Semi-transparent dark backdrop]          │
│                                              │
│     ┌───────────────────────────────────┐   │
│     │  ⚔️ Quest Complete! ⚔️           │   │
│     │                                   │   │
│     │  "Take out the trash"            │   │
│     │                                   │   │
│     │  Rewards Earned:                 │   │
│     │  ⚡ +50 XP    💰 +25 Gold        │   │
│     │                                   │   │
│     │  ✨[particle effects floating]   │   │
│     │                                   │   │
│     │     [Continue]                   │   │
│     └───────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

#### Level Up Modal (Wireframe)
```
┌─────────────────────────────────────────────┐
│   [Full screen, dark backdrop with rays]    │
│                                              │
│              ⭐ LEVEL UP! ⭐               │
│                                              │
│             Level 3 → Level 4               │
│                                              │
│              [Character Name]                │
│                 [Knight]                     │
│                                              │
│         ✨ [burst particle effects] ✨      │
│                                              │
│        [Continue Adventure]                 │
└─────────────────────────────────────────────┘
```

#### XP Progress Bar (Wireframe)
```
Character Stats:
┌─────────────────────────────────────────────┐
│ Level 3                            750/1000 │
│ ████████████████░░░░░░░░           75%     │
│ [Green gradient fill with glow]             │
└─────────────────────────────────────────────┘
```

## Technical Considerations

### Dependencies

- **Framer Motion** (v12.23.12) - Already installed, will be primary animation library
- **Lucide React** (v0.544.0) - Already installed for icons
- **CSS Custom Properties** - Leverage existing theme variables
- **React Context** (if needed) - For global animation/sound settings state

### Animation Performance Strategy

1. **Use GPU-accelerated properties**: `transform`, `opacity` (avoid animating `width`, `height`, `top`, `left`)
2. **Lazy load heavy animations**: Only render celebration modals when triggered
3. **Throttle particle effects**: Limit particle count based on device performance
4. **Use `will-change` CSS hint** for elements that will animate (sparingly)
5. **Implement animation budget**: Disable non-essential animations on low-end devices (detect via performance API)

### File Organization

```
components/
  animations/
    QuestCompleteOverlay.tsx
    LevelUpModal.tsx
    ParticleEffect.tsx
    ProgressBar.tsx
  icons/
    FantasyIcon.tsx (wrapper for lucide icons with fantasy styling)
  ui/
    FantasyButton.tsx
    FantasyCard.tsx
    LoadingSpinner.tsx
lib/
  animations/
    constants.ts (timing, easing functions)
    variants.ts (framer motion variants)
  audio/
    sound-manager.ts (sound effect player)
    sounds/ (sound effect files)
hooks/
  useReducedMotion.ts
  useSoundEffects.ts
  useParticles.ts
```

### Browser Support

- **Chrome/Edge**: 90+ (full support)
- **Firefox**: 88+ (full support)
- **Safari**: 14+ (full support, some reduced motion quirks)
- **Mobile Safari/Chrome**: iOS 14+, Android 8+ (performance-optimized animations)

### Integration Points

This feature will touch:
- `components/quest-dashboard.tsx` - Add quest completion animations
- `components/character/CharacterCreation.tsx` - Enhanced class selection animations
- `components/reward-store.tsx` - Add reward redemption animations
- `app/globals.css` - Expand fantasy theme utilities
- All dashboard pages - Apply consistent theme and loading states

## Success Metrics

1. **User Engagement**: 20% increase in daily active users (measured via analytics)
2. **Quest Completion Rate**: 15% increase in quests marked as complete
3. **Session Duration**: 10% increase in average session time
4. **User Satisfaction**: Positive feedback in user surveys about "fun factor"
5. **Performance**: Maintain Lighthouse performance score >85 on mobile
6. **Accessibility**: Zero new accessibility violations in axe DevTools
7. **Animation Smoothness**: <3% of users report lag or performance issues

## Open Questions

1. **Sound Effect Sourcing**: Which royalty-free sound library should we use? (Options: Freesound.org, OpenGameArt.org, Zapsplat)
2. **Particle Effect Library**: Should we use a lightweight particle library (tsparticles) or build custom with Framer Motion?
3. **Animation Complexity**: Should we A/B test simpler vs. richer animations to measure impact on engagement?
4. **Mobile Performance**: What's our minimum supported device spec? Should we disable particles on devices with <4GB RAM?
5. **Theme Variations**: Should we plan for future theme variations (e.g., "Dark Knight" vs "Bright Paladin" visual themes)?
6. **Reward Animation Stacking**: If a user completes multiple quests rapidly, should animations queue or merge?

## Implementation Phases

### Phase 1: MVP Foundation (Week 1)
- FR-1 (Fantasy Theme)
- FR-2 (Animation System)
- FR-7 (Icon Library)
- FR-8 (Loading Animations)

### Phase 2: Core Celebrations (Week 2)
- FR-3 (Quest Completion)
- FR-4 (Level Up)
- FR-5 (Progress Bars)

### Phase 3: Polish & Sounds (Week 3)
- FR-6 (Sound Effects - if desired)
- Performance optimization
- Accessibility refinement
- Cross-browser testing

## Acceptance Criteria

✅ **Fantasy Theme**: All pages use consistent `.fantasy-card`, `.fantasy-button`, and theme colors

✅ **Animations**: Quest list items fade in with stagger, all interactive elements have hover effects

✅ **Quest Completion**: Overlay appears with particle effects, shows rewards, auto-dismisses after 5s

✅ **Level Up**: Full-screen modal appears with dramatic animation, requires user dismissal

✅ **Progress Bars**: XP bar animates smoothly when XP changes, shows percentage and values

✅ **Icons**: All reward types (XP, gold, gems, honor) have consistent themed icons

✅ **Loading**: Custom fantasy-themed loaders replace all generic spinners

✅ **Reduced Motion**: All animations respect `prefers-reduced-motion: reduce` preference

✅ **Performance**: Animations run at 60fps on desktop, no jank on mid-range mobile devices

✅ **Sound Effects (if implemented)**: Sounds play for key events, can be toggled off in settings

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Animations cause performance issues on mobile | High | Implement performance detection, disable heavy effects on low-end devices |
| Users find animations annoying/distracting | Medium | Ensure reduced motion support, add per-user animation intensity settings |
| Sound effects increase bundle size significantly | Low | Lazy load audio files, use compressed formats, make sounds optional feature flag |
| Framer Motion version conflicts or bugs | Medium | Pin version, test thoroughly, have fallback CSS animations |
| Accessibility violations with overlays | High | Implement proper focus trapping, ARIA labels, keyboard navigation |
| Development time exceeds estimates | Medium | Prioritize MVP features (Phase 1-2), defer sound effects if needed |

---

**Document Version**: 1.0
**Created**: 2025-10-10
**Status**: Draft - Awaiting Approval
