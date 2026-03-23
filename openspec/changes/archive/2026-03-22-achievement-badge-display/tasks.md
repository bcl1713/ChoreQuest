# Tasks

## 1. API and Data Layer

- [x] 1.1 Create GET /api/achievements route that returns
  all achievements grouped by category with character
  progress joined via left join on character_achievements
- [x] 1.2 Create useAchievements hook for client-side
  data fetching with loading, error, and retry states
- [x] 1.3 Write tests for /api/achievements route covering
  authenticated fetch, unauthenticated 401, and character
  with no progress records

## 2. Achievement Badge Component

- [x] 2.1 Create AchievementBadge component with four
  visual states: unlocked (gold/glow), locked with
  progress (default + progress bar), locked without
  progress (dimmed), hidden locked (??? with lock icon)
- [x] 2.2 Write tests for AchievementBadge rendering all
  four states plus hidden-unlocked showing as normal
  unlocked

## 3. Achievement Grid and Filtering

- [x] 3.1 Create AchievementGrid component with responsive
  grid layout (1/2/3 columns) and category tab filtering
  using TabBar
- [x] 3.2 Add "All" default tab and per-category tabs with
  icon and achievement count, ordered by display_order
- [x] 3.3 Write tests for AchievementGrid tab filtering,
  default "All" view, and category ordering

## 4. Achievement Detail Modal

- [x] 4.1 Create AchievementDetailModal component showing
  full achievement info: icon, name, description, rewards,
  unlock date (if unlocked), progress bar (if in-progress),
  and hidden state (??? with no rewards shown)
- [x] 4.2 Write tests for modal rendering in unlocked,
  locked, and hidden states, plus close behavior

## 5. Achievement Summary

- [x] 5.1 Create AchievementSummary component showing
  unlock count (e.g., "12/30 Achievements Unlocked")
  and overall progress bar, excluding locked hidden
  achievements from total
- [x] 5.2 Write tests for summary count logic including
  hidden achievement exclusion

## 6. Profile Integration

- [x] 6.1 Add achievements section/tab to the character
  profile/dashboard page composing AchievementSummary
  and AchievementGrid
- [x] 6.2 Wire up loading and error states with retry
  capability
- [x] 6.3 Verify mobile-responsive layout and touch
  interactions across breakpoints
