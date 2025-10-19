# Quest Components

This folder contains all quest-related components for the ChoreQuest application. The components are organized into feature-specific subdirectories following a modular, composable architecture.

## Structure

```
quests/
├── quest-dashboard/        # Main quest viewing and management interface
├── quest-create-modal/     # Quest creation and editing interface
├── quest-conversion-wizard.tsx
├── quest-template-manager.tsx
└── index.ts               # Barrel export
```

## Components

### Quest Dashboard (`quest-dashboard/`)

The quest dashboard is the main interface for viewing and managing quest instances. It's decomposed into small, focused components:

- **`index.tsx`** (334 LOC) - Main orchestrator component that:
  - Uses `useQuests`, `useFamilyMembers`, `useCharacter`, and `useQuestFilters` hooks
  - Manages quest state and user interactions
  - Composes sub-components into a cohesive dashboard
  - Handles quest actions (start, complete, approve)

- **`quest-item.tsx`** - Individual quest card component
  - Displays a single quest instance with all relevant details
  - Shows quest status, difficulty, rewards (XP, gold, bonus)
  - Provides action buttons (Start, Complete, Approve) based on quest state
  - Uses `React.memo` for performance optimization
  - Contains `useMemo` for computed values (statusLabel, bonuses, timestamps)

- **`quest-list.tsx`** - Quest list view component
  - Renders a scrollable list of quest items
  - Handles empty state messaging
  - Uses `React.memo` for performance
  - Memoizes filtered quest rendering

- **`quest-filters.tsx`** - Filter controls component
  - Provides UI for filtering quests by status and assignee
  - Includes search input for filtering by title/description
  - Uses `React.memo` for performance
  - Integrated with `useQuestFilters` hook

- **`quest-stats.tsx`** - Statistics panel component
  - Calculates and displays quest statistics (total, completed, pending, etc.)
  - Uses `useMemo` for efficient stat calculations
  - Provides at-a-glance quest metrics

- **`quest-helpers.ts`** - Helper functions
  - Quest filtering logic
  - Permission checking utilities
  - Keeps main component under 400 LOC

**Key Features:**
- Realtime quest updates via Supabase subscriptions
- Optimistic UI updates for better UX
- Comprehensive filtering and search
- Role-based permissions (Guild Master vs Player)
- Performance optimized with memoization

### Quest Create Modal (`quest-create-modal/`)

Modal interface for creating and editing quests, supporting multiple quest types:

- **`index.tsx`** (391 LOC) - Modal orchestrator that:
  - Manages form state and mode (adhoc, recurring, template-based)
  - Uses `useFamilyMembers` hook for assignee selection
  - Composes form sections based on selected mode
  - Handles quest creation and submission

- **`adhoc-quest-form.tsx`** (137 LOC) - Ad-hoc quest form
  - Fields: title, description, difficulty, assignee, due date
  - Rewards: XP and gold configuration
  - Uses `React.memo` for performance

- **`recurring-quest-form.tsx`** (172 LOC) - Recurring quest form
  - All adhoc quest fields plus recurrence settings
  - Recurrence patterns (daily, weekly, monthly)
  - Template-based quest creation for recurring tasks
  - Uses `React.memo` for performance

- **`template-quest-form.tsx`** (73 LOC) - Template-based quest form
  - Template selection from existing templates
  - Override capability for template values
  - Uses `React.memo` and `useMemo` for performance

- **`quest-modal-helpers.ts`** - Helper functions
  - Form validation logic
  - Quest submission handlers
  - Keeps main modal component under 400 LOC

**Key Features:**
- Three quest creation modes (adhoc, recurring, template)
- Form validation with helpful error messages
- Family member assignment
- Difficulty-based reward suggestions
- Performance optimized with memoization

### Other Quest Components

- **`quest-conversion-wizard.tsx`** - Converts one-time quests to recurring templates
- **`quest-template-manager.tsx`** - Manages quest templates for recurring quests

## Related Hooks

The quest components use several custom hooks from `/hooks`:

- **`useQuests`** - Fetches and manages quest instances with realtime updates
- **`useFamilyMembers`** - Loads family member data for assignee selection
- **`useCharacter`** - Loads current user's character for permission checks
- **`useQuestFilters`** - Manages quest filtering and search logic

## Related Utilities

Quest components use utilities from `/lib/utils`:

- **`colors.ts`** - `getDifficultyColor()`, `getStatusColor()`
- **`formatting.ts`** - `formatDueDate()`, `formatXP()`, `formatGold()`
- **`data.ts`** - `deduplicateQuests()`, `getQuestTimestamp()`

## Usage

```tsx
import { QuestDashboard } from '@/components/quests';
import { QuestCreateModal } from '@/components/quests/quest-create-modal';

function QuestsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <QuestDashboard onCreateQuest={() => setIsCreateModalOpen(true)} />
      <QuestCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
```

## Testing

All components have comprehensive unit tests located in `__tests__/` subdirectories:
- Quest item rendering and interactions (25 tests)
- Quest list display and empty states (15 tests)
- Quest filters and search (23 tests)
- Quest statistics calculations (21 tests)
- Adhoc quest form validation (20 tests)
- Recurring quest form (26 tests)
- Template quest form (21 tests)

Run tests: `npm test -- quests`

## Architecture Principles

1. **Small Components** - No component exceeds 400 LOC
2. **Single Responsibility** - Each component has one clear purpose
3. **Composition** - Complex UIs built from simple, reusable pieces
4. **Performance** - Memoization with `React.memo`, `useMemo`, `useCallback`
5. **Type Safety** - Full TypeScript coverage with strict types
6. **Testability** - Comprehensive unit test coverage
