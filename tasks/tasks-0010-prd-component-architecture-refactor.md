# Task List: Component Architecture Refactoring (v0.4.0)

**Based on:** tasks/0010-prd-component-architecture-refactor.md
**Issue:** #89
**Version:** 0.4.0
**Created:** 2025-10-18

---

## Relevant Files

### Utilities Created
- `lib/utils/colors.ts` - ✅ Color utility functions (getDifficultyColor, getStatusColor)
- `lib/utils/colors.test.ts` - ✅ Tests for color utilities (18 tests passing)
- `lib/utils/formatting.ts` - ✅ Date/time/number formatting functions (formatNumber, formatXP, formatGold, formatPoints, formatPercent, formatDateTime, formatDueDate)
- `lib/utils/formatting.test.ts` - ✅ Tests for formatting utilities (39 tests passing)
- `lib/utils/data.ts` - ✅ Data manipulation utilities (deduplicate, deduplicateQuests, getQuestTimestamp, sortBy, sortByKey, filterByAll, filterByAny, groupBy)
- `lib/utils/data.test.ts` - ✅ Tests for data utilities (47 tests passing)
- `lib/utils/validation.ts` - ✅ Form validation helpers (validateRequired, validateLength, validateMaxLength, validateNumberRange, validateMinNumber, validateFutureDate, validateQuestTitle, validateQuestDescription, validateQuestReward, validateRewardName, validateRewardDescription, validateRewardCost, combineValidations)
- `lib/utils/validation.test.ts` - ✅ Tests for validation utilities (58 tests passing)

### Custom Hooks to Create
- `hooks/useQuests.ts` - Quest data fetching and management
- `hooks/useQuests.test.ts` - Tests for useQuests hook
- `hooks/useRewards.ts` - Reward data fetching and management
- `hooks/useRewards.test.ts` - Tests for useRewards hook
- ✅ `hooks/useFamilyMembers.ts` - Family member data fetching (14 tests passing)
- ✅ `hooks/useFamilyMembers.test.ts` - Tests for useFamilyMembers hook
- ✅ `hooks/useCharacter.ts` - Character data and stats (17 tests passing)
- ✅ `hooks/useCharacter.test.ts` - Tests for useCharacter hook
- `hooks/useQuestFilters.ts` - Quest filtering logic
- `hooks/useQuestFilters.test.ts` - Tests for useQuestFilters hook
- `hooks/useTabNavigation.ts` - Tab navigation state management
- `hooks/useTabNavigation.test.ts` - Tests for useTabNavigation hook

### Large Components to Decompose
- `components/quest-dashboard.tsx` (1,100 LOC) - Will be broken into multiple sub-components
- `components/quest-create-modal.tsx` (735 LOC) - Will be broken into form sections
- `components/reward-manager.tsx` (712 LOC) - Will be broken into list, form, and item components

### New Component Structure (Post-Refactor)
```
components/
├── quests/
│   ├── quest-dashboard/
│   │   ├── index.tsx
│   │   ├── quest-list.tsx
│   │   ├── quest-filters.tsx
│   │   ├── quest-stats.tsx
│   │   ├── quest-item.tsx
│   │   └── __tests__/
│   ├── quest-create-modal/
│   │   ├── index.tsx
│   │   ├── adhoc-quest-form.tsx
│   │   ├── recurring-quest-form.tsx
│   │   ├── template-quest-form.tsx
│   │   └── __tests__/
│   ├── quest-conversion-wizard.tsx
│   ├── quest-template-manager.tsx
│   └── index.ts
├── rewards/
│   ├── reward-manager/
│   │   ├── index.tsx
│   │   ├── reward-list.tsx
│   │   ├── reward-form.tsx
│   │   ├── reward-item.tsx
│   │   ├── redemption-list.tsx
│   │   └── __tests__/
│   ├── reward-store.tsx
│   └── index.ts
├── family/
│   ├── family-management.tsx
│   ├── family-settings.tsx
│   ├── family-quest-claiming.tsx
│   └── index.ts
├── admin/
│   ├── admin-dashboard.tsx
│   ├── guild-master-manager.tsx
│   ├── statistics-panel.tsx
│   ├── activity-feed.tsx
│   └── index.ts
├── character/
│   ├── CharacterCreation.tsx (already exists)
│   └── index.ts
├── ui/
│   ├── FantasyButton.tsx (already exists)
│   ├── FantasyCard.tsx (already exists)
│   ├── LoadingSpinner.tsx (already exists)
│   └── index.ts
├── animations/
│   ├── LevelUpModal.tsx (already exists)
│   ├── QuestCompleteOverlay.tsx (already exists)
│   ├── ProgressBar.tsx (already exists)
│   ├── ParticleEffect.tsx (already exists)
│   └── index.ts
├── auth/
│   ├── AuthForm.tsx (already exists)
│   └── index.ts
├── icons/
│   ├── FantasyIcon.tsx (already exists)
│   └── index.ts
├── migration/
│   ├── UserMigrationNotice.tsx (already exists)
│   └── index.ts
└── layout/
    └── index.ts
```

### Notes

- Unit tests should be placed alongside code files they are testing or in `__tests__/` subdirectories
- Use `npx jest [optional/path/to/test/file]` to run tests
- All file moves should use `git mv` to preserve history
- Barrel exports (`index.ts`) will be created for each feature folder

---

## Tasks

- [x] 1.0 Extract Shared Utilities from Components
  - [x] 1.1 Create `lib/utils/colors.ts` with color utility functions
    - Extract `getDifficultyColor` from quest-dashboard.tsx
    - Extract `getStatusColor` from quest-dashboard.tsx
    - Add TypeScript types for all color functions
    - Write comprehensive unit tests in `lib/utils/colors.test.ts`
  - [x] 1.2 Create `lib/utils/formatting.ts` with formatting functions
    - Extract `formatDueDate` from quest-dashboard.tsx
    - Extract `formatPercent` from quest-dashboard.tsx
    - Extract `formatDateTime` from quest-dashboard.tsx
    - Consolidate with existing `formatXP`, `formatGold`, `formatNumber` from lib/format-utils.ts
    - Add `formatPoints` function for quest points
    - Write comprehensive unit tests in `lib/utils/formatting.test.ts`
  - [x] 1.3 Create `lib/utils/data.ts` with data manipulation utilities
    - Extract `deduplicateQuests` from quest-dashboard.tsx
    - Extract `getQuestTimestamp` from quest-dashboard.tsx
    - Add generic `deduplicate` function for any array
    - Add sorting utility functions
    - Write comprehensive unit tests in `lib/utils/data.test.ts`
  - [x] 1.4 Create `lib/utils/validation.ts` for form validation helpers
    - Extract common validation patterns from quest-create-modal and reward-manager
    - Add validators for quest forms (title, description, rewards)
    - Add validators for reward forms
    - Write comprehensive unit tests in `lib/utils/validation.test.ts`
  - [x] 1.5 Update all components to use new utility imports
    - [x] Update quest-dashboard.tsx to import from lib/utils/*
    - [x] Update quest-create-modal.tsx to import from lib/utils/*
    - [x] Verify no other components need utility imports (reward-manager.tsx and others don't use these utilities)
    - [x] Remove old inline utility functions (all migrated to lib/utils/*)
    - [x] Remove old lib/format-utils.ts file (consolidated into lib/utils/formatting.ts)
  - [x] 1.6 Run quality gates
    - [x] Run `npm run build` - verify zero compilation errors
    - [x] Run `npm run lint` - verify zero linting warnings
    - [x] Run `npm run test` - verify all tests pass (837/837 passing)

- [ ] 2.0 Create Custom Hooks for Common Patterns
  - [x] 2.1 Create `hooks/useFamilyMembers.ts` for family member data fetching
    - [x] Extract family member loading logic from quest-dashboard.tsx
    - [x] Extract family member loading logic from quest-create-modal.tsx
    - [x] Extract family member loading logic from family-management.tsx
    - [x] Return `{ familyMembers, familyCharacters, loading, error, reload }`
    - [x] Write comprehensive tests in `hooks/useFamilyMembers.test.ts` (14 tests passing)
  - [x] 2.2 Create `hooks/useCharacter.ts` for character data
    - [x] Extract character loading logic from quest-dashboard.tsx
    - [x] Handle character fetch with proper error handling (PGRST116 treated as no character, not error)
    - [x] Return `{ character, loading, error, reload }`
    - [x] Write comprehensive tests in `hooks/useCharacter.test.ts` (17 tests passing)
  - [ ] 2.3 Create `hooks/useQuests.ts` for quest data management
    - Extract quest loading logic from quest-dashboard.tsx
    - Include realtime subscription logic
    - Return `{ quests, loading, error, reload, createQuest, updateQuest, deleteQuest }`
    - Write comprehensive tests in `hooks/useQuests.test.ts`
  - [ ] 2.4 Create `hooks/useRewards.ts` for reward data management
    - Extract reward loading logic from reward-manager.tsx
    - Include realtime subscription logic for rewards and redemptions
    - Return `{ rewards, redemptions, loading, error, reload, createReward, updateReward, deleteReward }`
    - Write comprehensive tests in `hooks/useRewards.test.ts`
  - [ ] 2.5 Create `hooks/useQuestFilters.ts` for quest filtering logic
    - Extract filtering/sorting logic from quest-dashboard.tsx
    - Manage filter state (status, assignee, search term)
    - Return `{ filters, setFilters, filteredQuests, resetFilters }`
    - Write comprehensive tests in `hooks/useQuestFilters.test.ts`
  - [ ] 2.6 Create `hooks/useTabNavigation.ts` for tab state management
    - Extract tab navigation pattern from admin-dashboard.tsx
    - Sync with URL query parameters
    - Return `{ selectedIndex, handleTabChange, tabs }`
    - Write comprehensive tests in `hooks/useTabNavigation.test.ts`
  - [ ] 2.7 Update components to use new custom hooks
    - Update quest-dashboard.tsx to use useFamilyMembers, useCharacter, useQuests, useQuestFilters
    - Update quest-create-modal.tsx to use useFamilyMembers
    - Update reward-manager.tsx to use useRewards
    - Update admin-dashboard.tsx to use useTabNavigation
    - Update family-management.tsx to use useFamilyMembers
    - Remove old inline hook logic from components
  - [ ] 2.8 Run quality gates
    - Run `npm run build` - verify zero compilation errors
    - Run `npm run lint` - verify zero linting warnings
    - Run `npm run test` - verify all tests pass

- [ ] 3.0 Decompose Large Components into Smaller Units
  - [ ] 3.1 Decompose quest-dashboard.tsx (1,100 LOC → multiple < 400 LOC components)
    - [ ] 3.1.1 Create `components/quests/quest-dashboard/` directory
    - [ ] 3.1.2 Create `quest-item.tsx` - Individual quest card component
      - Accept quest instance as prop
      - Handle quest actions (start, complete, approve)
      - Apply React.memo for performance
      - Create tests in `__tests__/quest-item.test.tsx`
    - [ ] 3.1.3 Create `quest-list.tsx` - Quest list view component
      - Accept filtered quests array as prop
      - Render quest items using quest-item.tsx
      - Handle empty states
      - Create tests in `__tests__/quest-list.test.tsx`
    - [ ] 3.1.4 Create `quest-filters.tsx` - Filter controls component
      - Accept filter state and handlers as props
      - Render filter UI (status, assignee, search)
      - Apply React.memo
      - Create tests in `__tests__/quest-filters.test.tsx`
    - [ ] 3.1.5 Create `quest-stats.tsx` - Statistics panel component
      - Accept quests array as prop
      - Calculate and display quest statistics
      - Apply useMemo for calculations
      - Create tests in `__tests__/quest-stats.test.tsx`
    - [ ] 3.1.6 Create `index.tsx` - Main dashboard orchestrator
      - Use custom hooks (useQuests, useFamilyMembers, useCharacter, useQuestFilters)
      - Compose sub-components (quest-list, quest-filters, quest-stats)
      - Keep under 400 LOC
      - Update existing tests in `components/__tests__/quest-dashboard.test.tsx`
    - [ ] 3.1.7 Move old quest-dashboard.tsx to quest-dashboard/index.tsx
      - Use `git mv components/quest-dashboard.tsx components/quests/quest-dashboard/index.tsx`
      - Update imports across codebase
  - [ ] 3.2 Decompose quest-create-modal.tsx (735 LOC → multiple < 400 LOC components)
    - [ ] 3.2.1 Create `components/quests/quest-create-modal/` directory
    - [ ] 3.2.2 Create `adhoc-quest-form.tsx` - Ad-hoc quest form section
      - Accept form state and handlers as props
      - Handle ad-hoc quest fields (title, description, rewards, difficulty)
      - Create tests in `__tests__/adhoc-quest-form.test.tsx`
    - [ ] 3.2.3 Create `recurring-quest-form.tsx` - Recurring quest form section
      - Accept form state and handlers as props
      - Handle recurring quest fields (recurrence pattern, template data)
      - Create tests in `__tests__/recurring-quest-form.test.tsx`
    - [ ] 3.2.4 Create `template-quest-form.tsx` - Template-based quest form section
      - Accept templates and form state as props
      - Handle template selection and overrides
      - Create tests in `__tests__/template-quest-form.test.tsx`
    - [ ] 3.2.5 Create `index.tsx` - Modal orchestrator
      - Manage form mode state (adhoc/existing/recurring)
      - Use useFamilyMembers hook
      - Compose form sections based on mode
      - Keep under 400 LOC
      - Create tests in `__tests__/quest-create-modal.test.tsx`
    - [ ] 3.2.6 Move old quest-create-modal.tsx to quest-create-modal/index.tsx
      - Use `git mv components/quest-create-modal.tsx components/quests/quest-create-modal/index.tsx`
      - Update imports across codebase
  - [ ] 3.3 Decompose reward-manager.tsx (712 LOC → multiple < 400 LOC components)
    - [ ] 3.3.1 Create `components/rewards/reward-manager/` directory
    - [ ] 3.3.2 Create `reward-item.tsx` - Individual reward card component
      - Accept reward as prop
      - Handle edit/delete actions
      - Apply React.memo
      - Create tests in `__tests__/reward-item.test.tsx`
    - [ ] 3.3.3 Create `reward-list.tsx` - Reward list view component
      - Accept rewards array as prop
      - Render reward items
      - Handle empty states
      - Create tests in `__tests__/reward-list.test.tsx`
    - [ ] 3.3.4 Create `reward-form.tsx` - Reward creation/edit form component
      - Accept form data and handlers as props
      - Handle reward fields (name, description, type, cost)
      - Extract REWARD_TYPE_ICONS and REWARD_TYPE_LABELS to constants
      - Create tests in `__tests__/reward-form.test.tsx`
    - [ ] 3.3.5 Create `redemption-list.tsx` - Redemption history component
      - Accept redemptions array as prop
      - Handle redemption approval/rejection
      - Create tests in `__tests__/redemption-list.test.tsx`
    - [ ] 3.3.6 Create `index.tsx` - Main manager orchestrator
      - Use useRewards hook
      - Manage modal state
      - Compose sub-components
      - Keep under 400 LOC
      - Create tests in `__tests__/reward-manager.test.tsx`
    - [ ] 3.3.7 Move old reward-manager.tsx to reward-manager/index.tsx
      - Use `git mv components/reward-manager.tsx components/rewards/reward-manager/index.tsx`
      - Update imports across codebase
  - [ ] 3.4 Run quality gates
    - Run `npm run build` - verify zero compilation errors
    - Run `npm run lint` - verify zero linting warnings
    - Run `npm run test` - verify all tests pass
    - Verify no component exceeds 400 LOC

- [ ] 4.0 Reorganize Components into Feature-Based Folders
  - [ ] 4.1 Create feature folder structure
    - Create `components/quests/` directory
    - Create `components/rewards/` directory
    - Create `components/family/` directory
    - Create `components/admin/` directory
    - Create `components/layout/` directory
  - [ ] 4.2 Move quest-related components to `components/quests/`
    - `git mv components/quest-conversion-wizard.tsx components/quests/quest-conversion-wizard.tsx`
    - `git mv components/quest-template-manager.tsx components/quests/quest-template-manager.tsx`
    - Note: quest-dashboard and quest-create-modal already moved in Task 3
    - Create `components/quests/index.ts` barrel export
    - Update imports across codebase
  - [ ] 4.3 Move reward-related components to `components/rewards/`
    - `git mv components/reward-store.tsx components/rewards/reward-store.tsx`
    - Note: reward-manager already moved in Task 3
    - Create `components/rewards/index.ts` barrel export
    - Update imports across codebase
  - [ ] 4.4 Move family-related components to `components/family/`
    - `git mv components/family-management.tsx components/family/family-management.tsx`
    - `git mv components/family-settings.tsx components/family/family-settings.tsx`
    - `git mv components/family-quest-claiming.tsx components/family/family-quest-claiming.tsx`
    - `git mv components/family-quest-claiming.test.tsx components/family/family-quest-claiming.test.tsx`
    - Create `components/family/index.ts` barrel export
    - Update imports across codebase
  - [ ] 4.5 Move admin-related components to `components/admin/`
    - `git mv components/admin-dashboard.tsx components/admin/admin-dashboard.tsx`
    - `git mv components/guild-master-manager.tsx components/admin/guild-master-manager.tsx`
    - `git mv components/statistics-panel.tsx components/admin/statistics-panel.tsx`
    - `git mv components/activity-feed.tsx components/admin/activity-feed.tsx`
    - Create `components/admin/index.ts` barrel export
    - Update imports across codebase
  - [ ] 4.6 Create barrel exports for existing organized folders
    - Create `components/ui/index.ts` (FantasyButton, FantasyCard, LoadingSpinner)
    - Create `components/animations/index.ts` (LevelUpModal, QuestCompleteOverlay, ProgressBar, ParticleEffect)
    - Create `components/auth/index.ts` (AuthForm)
    - Create `components/character/index.ts` (CharacterCreation)
    - Create `components/icons/index.ts` (FantasyIcon)
    - Create `components/migration/index.ts` (UserMigrationNotice)
  - [ ] 4.7 Update all import statements across the application
    - Update app pages to use new import paths
    - Update components to use barrel exports
    - Use find/replace for common patterns (e.g., `@/components/quest-dashboard` → `@/components/quests/quest-dashboard`)
  - [ ] 4.8 Run quality gates
    - Run `npm run build` - verify zero compilation errors
    - Run `npm run lint` - verify zero linting warnings
    - Run `npm run test` - verify all tests pass

- [ ] 5.0 Apply Performance Optimizations (Memoization)
  - [ ] 5.1 Optimize quest-dashboard components
    - Add `useMemo` for filtered quest lists in quest-list.tsx
    - Add `useMemo` for quest statistics calculations in quest-stats.tsx
    - Add `useCallback` for quest action handlers passed to quest-item.tsx
    - Verify React.memo is applied to quest-item.tsx
    - Add performance tests or profiling notes
  - [ ] 5.2 Optimize quest-create-modal components
    - Add `useCallback` for form handlers passed to form sections
    - Add `useMemo` for template filtering/mapping
    - Ensure form sections are memoized if appropriate
  - [ ] 5.3 Optimize reward-manager components
    - Add `useMemo` for filtered/sorted reward lists
    - Add `useCallback` for reward action handlers
    - Verify React.memo on reward-item.tsx and redemption items
  - [ ] 5.4 Optimize admin-dashboard components
    - Ensure useTabNavigation hook uses useCallback for handlers
    - Verify tab panels don't re-render unnecessarily
  - [ ] 5.5 Review and optimize custom hooks
    - Add `useMemo` in useQuestFilters for filtered results
    - Add `useCallback` for handler functions returned from hooks
    - Ensure hooks dependencies are properly specified
  - [ ] 5.6 Profile components using React DevTools Profiler
    - Profile quest-dashboard before and after optimizations
    - Profile reward-manager before and after optimizations
    - Document performance improvements in commit messages
  - [ ] 5.7 Run quality gates
    - Run `npm run build` - verify zero compilation errors
    - Run `npm run lint` - verify zero linting warnings
    - Run `npm run test` - verify all tests pass
    - Verify no performance regressions

- [ ] 6.0 Documentation and Quality Verification
  - [ ] 6.1 Add JSDoc comments to all utilities
    - Document all functions in lib/utils/colors.ts
    - Document all functions in lib/utils/formatting.ts
    - Document all functions in lib/utils/validation.ts
    - Document all functions in lib/utils/data.ts
  - [ ] 6.2 Add JSDoc comments to all custom hooks
    - Document hooks/useFamilyMembers.ts
    - Document hooks/useCharacter.ts
    - Document hooks/useQuests.ts
    - Document hooks/useRewards.ts
    - Document hooks/useQuestFilters.ts
    - Document hooks/useTabNavigation.ts
  - [ ] 6.3 Create README files for feature folders
    - Create `components/quests/README.md` explaining quest components
    - Create `components/rewards/README.md` explaining reward components
    - Create `components/family/README.md` explaining family components
    - Create `components/admin/README.md` explaining admin components
  - [ ] 6.4 Verify architectural goals met
    - Verify no component exceeds 400 LOC (use `find components -name "*.tsx" -exec wc -l {} + | sort -rn | head -20`)
    - Verify all shared utilities are in lib/utils/
    - Verify custom hooks are created and used
    - Verify feature-based organization is complete
  - [ ] 6.5 Run comprehensive quality gates
    - Run `npm run build` - verify zero compilation errors
    - Run `npm run lint` - verify zero linting warnings
    - Run `npm run test` - verify all tests pass
    - Check test coverage hasn't decreased
  - [ ] 6.6 Create GitHub issue tracking refactoring completion
    - Document all changes made
    - List performance improvements with metrics
    - Note any breaking changes or migration notes
    - Close issue #89

---

## Notes

- This refactoring follows a bottom-up approach: utilities → hooks → components → organization → optimization
- Each task should be completed with full quality gates passing before moving to the next
- Use `git mv` for all file moves to preserve Git history
- Maintain backward compatibility where feasible; document any breaking changes
- All new code should have comprehensive unit tests
- Performance improvements should be documented with before/after metrics where possible
- The todo list should be updated frequently as work progresses
