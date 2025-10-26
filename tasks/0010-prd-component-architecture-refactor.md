# PRD: Component Architecture Refactoring (v0.4.0)

**Issue:** #89
**Version:** 0.4.0
**Type:** Epic Refactor
**Created:** 2025-10-18

---

## Introduction/Overview

ChoreQuest's component architecture has evolved organically and now requires systematic refactoring to align with React industry best practices. This comprehensive refactoring will improve maintainability, reusability, organization, and performance across the entire codebase.

### Problem Statement

Current pain points:
- **Large, complex components** - Some components exceed 1,100 lines of code (quest-dashboard: 1,100 LOC, quest-create-modal: 735 LOC, reward-manager: 712 LOC)
- **Duplicated logic** - Shared functionality embedded in multiple components rather than extracted to reusable hooks
- **Poor organization** - Flat structure with most components in root folder, making navigation difficult
- **Performance opportunities** - Lack of memoization and render optimization

### Goal

Transform the component architecture to follow React best practices, resulting in a more maintainable, performant, and developer-friendly codebase that sets the foundation for future feature development.

---

## Goals

1. **Reduce component complexity** - No component should exceed 400 lines of code
2. **Eliminate code duplication** - Extract shared logic into custom hooks and utility functions
3. **Improve code organization** - Implement feature-based folder structure for better discoverability
4. **Optimize performance** - Apply memoization techniques to reduce unnecessary re-renders
5. **Enhance maintainability** - Create clear separation of concerns with single-responsibility components
6. **Maintain quality gates** - Zero test failures, zero TypeScript errors, zero lint warnings throughout refactoring

---

## User Stories

### As a Developer (Primary User)

1. **As a developer**, I want to find components quickly so that I can understand and modify features efficiently.
   - **Benefit:** Feature-based organization means all quest-related code lives in `quests/`, not scattered across multiple folders.

2. **As a developer**, I want to reuse common logic so that I don't duplicate code across components.
   - **Benefit:** Custom hooks like `useQuests`, `useRewards`, `useFamilyMembers` provide consistent data fetching patterns.

3. **As a developer**, I want to understand component boundaries so that I know where to make changes.
   - **Benefit:** Small, focused components with clear responsibilities make changes predictable and safe.

4. **As a developer**, I want fast build times and responsive development environment so that I can iterate quickly.
   - **Benefit:** Performance optimizations reduce unnecessary re-renders and improve dev server responsiveness.

5. **As a new contributor**, I want clear code structure so that I can onboard quickly.
   - **Benefit:** Consistent patterns and organization make the codebase approachable.

### As an End User (Indirect Benefit)

6. **As a user**, I want the application to feel snappy so that my interactions feel immediate.
   - **Benefit:** Performance optimizations reduce lag in UI updates.

---

## Functional Requirements

### Phase 1: Utility Extraction

**FR1.1** Extract all shared utility functions from components to centralized locations in `lib/utils/`

**FR1.2** Create dedicated utility modules:
- `lib/utils/colors.ts` - Color utility functions (`getDifficultyColor`, `getStatusColor`, etc.)
- `lib/utils/formatting.ts` - Formatting functions (`formatDueDate`, `formatPoints`, etc.)
- `lib/utils/validation.ts` - Validation helpers

**FR1.3** Update all components to import utilities from centralized locations

**FR1.4** Ensure 100% test coverage for all extracted utility functions

### Phase 2: Custom Hooks

**FR2.1** Extract data fetching logic into custom hooks:
- `hooks/useQuests.ts` - Quest data fetching and management
- `hooks/useRewards.ts` - Reward data fetching and management
- `hooks/useFamilyMembers.ts` - Family member data fetching
- `hooks/useCharacter.ts` - Character data and stats

**FR2.2** Extract state management patterns:
- `hooks/useQuestFilters.ts` - Quest filtering logic
- `hooks/useTabNavigation.ts` - Tab navigation state
- `hooks/useFormState.ts` - Form state management patterns

**FR2.3** Extract complex side effects into focused hooks

**FR2.4** Write comprehensive tests for all custom hooks

### Phase 3: Component Decomposition

**FR3.1** Break down large components into smaller sub-components:
- `quest-dashboard.tsx` (1,100 LOC) → Multiple focused components
- `quest-create-modal.tsx` (735 LOC) → Form sections and validation
- `reward-manager.tsx` (712 LOC) → List, form, and item components

**FR3.2** Ensure no component exceeds 400 lines of code

**FR3.3** Apply single-responsibility principle to all components

**FR3.4** Create presentational components that accept props (no direct data fetching)

**FR3.5** Apply `React.memo` to expensive presentational components

**FR3.6** Update tests to cover new component boundaries

### Phase 4: Folder Restructuring

**FR4.1** Create feature-based folder structure:
```
components/
├── quests/          # Quest-related components
├── rewards/         # Reward-related components
├── family/          # Family management components
├── admin/           # Admin dashboard components
├── character/       # Character and stats components
├── ui/              # Shared UI primitives
└── layout/          # Layout components
```

**FR4.2** Move components incrementally, one feature area at a time

**FR4.3** Create `index.ts` barrel exports for clean imports

**FR4.4** Update all import paths across the codebase

**FR4.5** Maintain Git history through proper `git mv` commands

**FR4.6** Keep folder nesting shallow (maximum 2-3 levels)

### Phase 5: Performance Optimization

**FR5.1** Add `useMemo` for expensive computations:
- Filtered/sorted lists
- Derived statistics
- Complex calculations

**FR5.2** Add `useCallback` for event handlers passed as props

**FR5.3** Avoid creating new object/array literals in render

**FR5.4** Profile components using React DevTools Profiler before and after optimizations

**FR5.5** Document performance improvements with measurable metrics

**FR5.6** Ensure optimizations don't compromise code readability

---

## Non-Goals (Out of Scope)

1. **UI/UX changes** - This is a refactoring effort; visual appearance should remain unchanged
2. **Feature additions** - No new functionality during refactoring
3. **Database schema changes** - Backend structure remains unchanged
4. **Authentication/authorization changes** - Auth logic not in scope
5. **Third-party library upgrades** - Use existing dependencies unless blocking
6. **End-to-end test creation** - Focus on unit tests; E2E tests handled separately
7. **Storybook implementation** - Nice to have but not required for v0.4.0
8. **Design system creation** - Extract UI components but don't create formal design system

---

## Design Considerations

### Component API Design

- **Backward compatibility**: Maintain existing component props where feasible
- **Improved APIs**: When breaking down components, design cleaner prop interfaces
- **Deprecation strategy**: For breaking changes, export both old and new components temporarily with deprecation warnings

### Folder Structure Example

```
components/
├── quests/
│   ├── quest-dashboard/
│   │   ├── index.tsx               # Main dashboard component
│   │   ├── quest-list.tsx          # List view
│   │   ├── quest-filters.tsx       # Filter controls
│   │   ├── quest-stats.tsx         # Statistics panel
│   │   └── __tests__/
│   ├── quest-create-modal/
│   │   ├── index.tsx               # Modal wrapper
│   │   ├── quest-form.tsx          # Form component
│   │   ├── quest-validation.tsx    # Validation logic
│   │   └── __tests__/
│   └── index.ts                    # Barrel exports
```

### Documentation Standards

- **JSDoc comments** for all exported functions, components, and hooks
- **Inline comments** for complex logic only (prefer self-documenting code)
- **README files** in each feature folder explaining:
  - Purpose of the feature area
  - Key components and their responsibilities
  - Common patterns and conventions

---

## Technical Considerations

### Dependencies

- **Existing stack**: React, Next.js, TypeScript, Tailwind CSS
- **No new dependencies** required for refactoring
- **Testing**: Jest and React Testing Library (already in place)

### Migration Strategy

**Incremental Feature-Based Migration:**
1. Extract utilities and hooks (Phases 1-2) across entire codebase
2. Decompose components (Phase 3) one at a time, ensuring tests pass
3. Restructure folders (Phase 4) one feature area at a time:
   - Create new folder structure
   - Move components using `git mv` to preserve history
   - Update imports incrementally
   - Verify tests pass after each feature migration
4. Apply performance optimizations (Phase 5) to completed features

**Quality Gates at Each Phase:**
- `npm run build` - Zero compilation errors
- `npm run lint` - Zero linting errors/warnings
- `npm run test` - All unit tests pass
- Manual verification of UI (no visual regressions)

### Breaking Changes Policy

**Use best judgment**:
- **Prefer backward compatibility** when cost is low
- **Allow breaking changes** when they significantly improve architecture
- **Document breaking changes** clearly in commit messages
- **Update all usages** before merging breaking changes
- **No external API changes** (this is internal refactoring)

### Performance Benchmarking

- **React DevTools Profiler** for measuring render times before/after
- **Focus on user-perceivable improvements** (interaction responsiveness)
- **Document metrics** in commit messages (e.g., "Reduced quest-dashboard re-renders from 12 to 3 per filter change")
- **Set targets**: Reduce unnecessary re-renders by 50%+ in hot paths

---

## Success Criteria

### Quantitative Metrics

- [ ] No component exceeds 400 lines of code
- [ ] All shared utility functions extracted to `lib/utils/`
- [ ] At least 5 custom hooks created for common patterns
- [ ] All components organized by feature/domain
- [ ] Zero TypeScript errors
- [ ] Zero lint warnings
- [ ] All tests passing (maintain or improve coverage)
- [ ] Reduce re-renders in key components (quest-dashboard, admin-dashboard) by 50%+

### Qualitative Metrics

- [ ] Code is more maintainable (subjective team assessment)
- [ ] New developers can navigate codebase more easily
- [ ] Components have clear single responsibilities
- [ ] Import statements are cleaner and more intuitive
- [ ] Performance improvements are user-perceivable

### Phase Completion Criteria

**Phase 1 Complete:**
- [ ] All utility functions in centralized locations
- [ ] No duplicate utility logic in components
- [ ] Tests for all utilities passing

**Phase 2 Complete:**
- [ ] Data fetching hooks created and tested
- [ ] State management hooks created and tested
- [ ] Components using hooks instead of inline logic

**Phase 3 Complete:**
- [ ] All large components broken down (<400 LOC each)
- [ ] Presentational components separated from containers
- [ ] React.memo applied where beneficial
- [ ] Tests updated for new component boundaries

**Phase 4 Complete:**
- [ ] Feature-based folder structure implemented
- [ ] All components moved to appropriate folders
- [ ] Import paths updated
- [ ] Barrel exports created

**Phase 5 Complete:**
- [ ] useMemo/useCallback applied to hot paths
- [ ] Performance profiling documented
- [ ] Measurable performance improvements achieved

---

## Open Questions

1. **Should we create a component catalog** (like Storybook) to document the new component architecture?
   - *Decision needed by:* After Phase 3 completion
   - *Impact:* Would help with onboarding and component discoverability

2. **Should we establish ESLint rules** to enforce component size limits and prevent regression?
   - *Decision needed by:* Before Phase 3 starts
   - *Impact:* Would automate enforcement of architectural decisions

3. **Should we create architectural decision records (ADRs)** for major refactoring decisions?
   - *Decision needed by:* Start of Phase 1
   - *Impact:* Would document rationale for future developers

4. **Should we track bundle size** to ensure optimizations don't increase build output?
   - *Decision needed by:* Before Phase 5
   - *Impact:* Would validate that refactoring improves performance

5. **Should we create migration guides** for other developers working on feature branches?
   - *Decision needed by:* Before Phase 4 (folder restructuring)
   - *Impact:* Would reduce merge conflicts and confusion

---

## Timeline Estimate

**Total Effort:** 4-6 weeks (assuming focused work)

- **Phase 1** (Utility Extraction): 3-5 days
- **Phase 2** (Custom Hooks): 5-7 days
- **Phase 3** (Component Decomposition): 10-14 days (largest effort)
- **Phase 4** (Folder Restructuring): 5-7 days
- **Phase 5** (Performance Optimization): 5-7 days

*Note: Timeline assumes sequential execution and includes testing/documentation time*

---

## References

- Issue #89: Refactor: Component Architecture Best Practices (v0.4.0)
- Issue #48: Refactor: Large admin-dashboard.tsx Component
- Issue #51: Refactor: Create a Shared Button Component
- React Documentation: https://react.dev/learn/thinking-in-react
- React Performance: https://react.dev/learn/render-and-commit

---

## Approval

**Created by:** Claude Code
**Reviewed by:** [Pending]
**Approved by:** [Pending]
**Status:** Draft
