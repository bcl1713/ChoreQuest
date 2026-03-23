# Design

## Context

The achievement system backend is fully implemented:
database schema with 26 seeded achievements across 6
categories, progress tracking service, evaluation engine,
and real-time unlock notifications. However, there is no
UI for players to browse achievements, view progress, or
revisit past unlocks. The only visibility is a transient
toast notification on unlock.

Existing UI primitives (FantasyCard, ProgressBar, TabBar,
FantasyIcon, ConfirmationModal) provide a solid foundation.
The reward store's catalog grid is the closest pattern to
follow for the achievement grid layout.

## Goals / Non-Goals

**Goals:**

- Display all achievements organized by category with
  visual distinction between unlocked, locked, and hidden
  states
- Show progress toward locked achievements
- Provide achievement detail view with unlock date and
  rewards
- Integrate into the existing character profile/dashboard
- Follow existing fantasy-card design patterns
- Mobile-responsive layout

**Non-Goals:**

- Achievement sharing or social features
- Achievement comparison between characters
- Custom achievement creation by Guild Masters
- Achievement leaderboards or rankings
- Avatar integration with achievement badges
- Animated unlock sequences (beyond existing toast)

## Decisions

### 1. Single API route with joined data

Fetch all achievements, categories, and character progress
in a single `/api/achievements` GET request that returns
achievements grouped by category with progress merged in.

**Rationale:** Avoids waterfall requests. The dataset is
small (26 achievements) so pagination is unnecessary.
A single query with joins is simple and performant.

**Alternative considered:** Separate endpoints for
achievements and progress — rejected due to added
complexity with no benefit at this data scale.

### 2. Client component with useAchievements hook

A custom `useAchievements(characterId)` hook handles
fetching and caching achievement data. The grid and badge
components are client components using Framer Motion for
hover/reveal animations.

**Rationale:** Consistent with existing patterns
(useAchievementNotifications, reward store). Client
components are needed for interactivity (click handlers,
animations, tab switching).

**Alternative considered:** Server components with
client islands — added complexity for minimal benefit
since the entire grid is interactive.

### 3. Category tabs using existing TabBar

Organize achievements by category using the existing
TabBar component, with an "All" tab as default. Each
category tab shows its icon and achievement count.

**Rationale:** Reuses existing component. Categories are
already defined in the database with display_order and
icons. TabBar is the established navigation pattern.

### 4. FantasyCard-based badge component

Each achievement badge uses FantasyCard with variant and
glow based on state:

- **Unlocked:** `variant="gold"` with `glow="strong"`
- **Locked (in-progress):** `variant="default"` with
  `glow="none"`, includes ProgressBar
- **Locked (no progress):** `variant="default"`, dimmed
- **Hidden (locked):** `variant="default"`, shows "???"
  for name and obscured description
- **Hidden (unlocked):** Same as normal unlocked

**Rationale:** Consistent with existing card patterns.
Gold variant with glow creates clear visual hierarchy
between earned and unearned achievements.

### 5. Modal for achievement details

Clicking any badge opens a detail modal (following the
ConfirmationModal pattern with AnimatePresence) showing:
full description, icon, XP/gold rewards, unlock date (if
unlocked), and progress (if in-progress).

**Rationale:** Keeps the grid compact while providing
full details on demand. Existing modal pattern means
minimal new code.

### 6. Summary bar above the grid

A summary component shows total progress
("12/30 Achievements Unlocked") with a ProgressBar
showing overall completion percentage.

**Rationale:** Gives players immediate feedback on
overall achievement progress. Simple to implement with
existing ProgressBar component.

## Risks / Trade-offs

- **[Small dataset assumption]** The design assumes ~30
  achievements. If this grows to hundreds, the single-fetch
  approach and client-side filtering will need revisiting.
  → Acceptable for current scope; can add pagination later.
- **[No real-time grid updates]** The grid does not
  subscribe to real-time achievement unlocks (the toast
  handles that). Users must refresh or navigate back to
  see newly unlocked badges.
  → Mitigation: The existing notification toast provides
  immediate feedback; grid refresh on mount is sufficient.
- **[Hidden achievement spoilers]** Category placement
  reveals which category a hidden achievement belongs to.
  → Acceptable trade-off; the name and description are
  still hidden which preserves the surprise.
