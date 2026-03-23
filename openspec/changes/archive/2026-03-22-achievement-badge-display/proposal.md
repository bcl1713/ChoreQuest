# Proposal

## Why

Players earn achievements through gameplay but have no way to
view, browse, or showcase them. The achievement system backend
(schema, progress tracking, evaluation engine, notifications)
is complete, but badges are invisible beyond the unlock toast.
Displaying achievements on the character profile closes the
feedback loop and gives players a reason to pursue goals —
critical for the v0.8.0 achievement milestone.

## What Changes

- New `AchievementBadge` component with distinct visual
  states: unlocked, locked (with progress), and hidden ("???")
- New `AchievementGrid` component displaying all achievements
  organized by category tabs
- Achievement progress bars for in-progress (locked)
  achievements showing current/threshold
- Achievement count summary
  (e.g., "12/30 Achievements Unlocked")
- Achievement detail modal on badge click showing full
  description, unlock date, and XP/gold rewards
- Hidden achievements displayed with obscured name and
  description until unlocked
- New API route to fetch all achievements with character
  progress for the authenticated user
- Achievements section integrated into the character
  profile/dashboard

## Capabilities

### New Capabilities

- `achievement-badge-display`: UI components for rendering
  achievement badges in locked, unlocked, hidden, and
  in-progress states, organized in a category-based grid
  with detail modal and progress indicators

### Modified Capabilities

None — this change is purely additive UI on top of the
existing achievement schema and progress tracking system.

## Impact

- **New components:** `components/achievements/` —
  AchievementBadge, AchievementGrid,
  AchievementDetailModal, AchievementSummary
- **New API route:** `/api/achievements` — fetches all
  achievements with character progress joined
- **New hook:** `useAchievements` — client-side data
  fetching and state management
- **Modified pages:** Character profile/dashboard gains
  an achievements tab or section
- **Dependencies:** Relies on existing `achievements`,
  `achievement_categories`, and `character_achievements`
  tables; `AchievementProgressService`; existing UI
  primitives (FantasyCard, ProgressBar, TabBar, FantasyIcon)
- **No breaking changes** to existing code or APIs
