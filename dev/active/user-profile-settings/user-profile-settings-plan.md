# User Profile Settings Implementation Plan (Issue #87)

**Last Updated:** 2025-11-06

## Executive Summary

Implement a dedicated `/profile` page allowing players to manage their character profile with three core features:

1. **Change character name** - Update display name with validation (no cost, quality-of-life feature)
2. **Change character class** - Switch to different class with level-scaled gold cost and 7-day cooldown
3. **Change password** - Secure password update via Supabase Auth

**Additional features:**
- Complete change history audit log showing all profile modifications
- Confirmation dialogs for destructive actions
- Cooldown timer display showing when next class change is available

**GitHub Issue:** #87 (Phase-2 Enhancement)
**Target Release:** v0.4.0
**Estimated Effort:** 8-12 hours

---

## Problem Statement & Goals

### Problem
Currently, character name and class are set during initial character creation and cannot be modified. Players may want to:
- Correct typos in their character name
- Try different character classes as they progress
- Update their password for security reasons

### Goals
1. ✅ Allow players to customize their character after creation
2. ✅ Introduce meaningful economic choice (gold cost for class change)
3. ✅ Maintain game balance through cooldown system
4. ✅ Provide security mechanism for password updates
5. ✅ Create audit trail for admin transparency

---

## Current State Analysis

### Existing Assets We Can Leverage

**Database:**
- `characters` table with `name`, `class`, `level`, `gold` fields
- `transactions` table for recording gold changes
- RLS policies already allow users to update their own character

**UI Components:**
- `FantasyButton` component for consistent styling
- `ConfirmationModal` for confirmation dialogs
- Form patterns from `CharacterCreation.tsx`
- `useCharacter()` hook for character data management
- `CharacterContext` with realtime updates

**Authentication:**
- `useAuth()` hook for user session management
- Supabase Auth for password management (needs to be exposed)
- Existing auth context infrastructure

**State Management:**
- `CharacterContext` with automatic realtime subscriptions
- Pattern for optimistic updates and refresh

### Gaps to Fill

1. **Database**: No `last_class_change_at` column for cooldown tracking
2. **Database**: No `character_change_history` table for audit log
3. **Service Layer**: No `ProfileService` for business logic
4. **Auth Context**: Password change not exposed in `useAuth()` hook
5. **Pages**: No `/profile` page or route
6. **Navigation**: No profile link in dashboard header

---

## Proposed Future State

### Architecture Overview

```
/app/profile/page.tsx
└── <ProfileSettings />
    ├── <CharacterNameForm />     # Change name (no cost)
    ├── <ClassChangeForm />       # Change class (gold cost + cooldown)
    ├── <PasswordChangeForm />    # Change password (Supabase Auth)
    └── <ChangeHistoryList />     # Audit log display

lib/profile-service.ts
└── ProfileService
    ├── changeCharacterName()
    ├── changeCharacterClass()
    ├── getChangeHistory()
    ├── canChangeClass()
    └── getClassChangeCost()

Database Schema Additions
├── characters.last_class_change_at     # Timestamp for cooldown
└── character_change_history (new table)
    ├── id, character_id, change_type, old_value, new_value, gold_cost
    └── created_at timestamp
```

### Component Interaction Flow

```
User navigates to /profile
         ↓
ProfileSettings loads character data via useCharacter()
         ↓
User fills form → validates input → confirms action
         ↓
Form calls ProfileService method
         ↓
Service: Validates gold balance, checks cooldown, deducts gold
         ↓
Service: Records transaction in transactions table
         ↓
Service: Records change in character_change_history table
         ↓
Service: Updates character data
         ↓
CharacterContext detects realtime update → UI refreshes
         ↓
Success message shown to user
         ↓
Change history list updates automatically
```

---

## Implementation Phases

### Phase 1: Database Foundation (1-2 hours)

**Objective:** Create database migrations for cooldown tracking and change history.

**Deliverables:**
- Migration file for `last_class_change_at` column
- Migration file for `character_change_history` table
- RLS policies for change history access
- Database schema tests

**Key Decision:** Why a separate `character_change_history` table?
- Provides audit trail for transparency
- Doesn't pollute main `characters` table
- Scales well as change log grows
- Easy to query change patterns over time

---

### Phase 2: Service Layer (2-3 hours)

**Objective:** Build ProfileService with comprehensive unit tests (TDD red-green-refactor).

**Deliverables:**
- `lib/profile-service.ts` with all methods
- `lib/profile-service.test.ts` with >95% coverage
- Type definitions for ChangeHistoryEntry, ClassChangeCost, etc.

**Methods to Implement:**
1. `changeCharacterName(characterId, newName)` - Update name with validation
2. `changeCharacterClass(characterId, newClass, goldCost)` - Update class, deduct gold, record history
3. `getClassChangeCost(level)` - Calculate 25 × level
4. `canChangeClass(characterId)` - Check cooldown (7 days)
5. `getChangeHistory(characterId, limit)` - Fetch audit log
6. `recordChange(characterId, changeType, oldValue, newValue, goldCost)` - Internal helper

**Test Coverage:**
- Happy path: successful updates
- Validation: invalid names, invalid classes
- Gold checks: insufficient balance
- Cooldown checks: within cooldown period, after cooldown
- Edge cases: exact boundary conditions
- Error handling: database errors, constraint violations

---

### Phase 3: UI Components (3-4 hours)

**Objective:** Build profile page with all form components and user-friendly interface.

**Deliverables:**
- `/app/profile/page.tsx` - Main profile page
- `components/profile/ProfileSettings.tsx` - Container component
- `components/profile/CharacterNameForm.tsx` - Name change form
- `components/profile/ClassChangeForm.tsx` - Class change with cost display
- `components/profile/PasswordChangeForm.tsx` - Password change form
- `components/profile/ChangeHistoryList.tsx` - Change history display
- Component tests for all forms

**CharacterNameForm:**
- Text input with max 50 characters
- Real-time character count
- Submit button
- Success/error messages
- No cost display

**ClassChangeForm:**
- Display current class with bonuses
- Grid of available classes with bonuses
- Gold cost calculation display (25 × level)
- "View bonuses" comparison button
- Cooldown timer if within cooldown period
- Confirmation modal before confirming
- Cancel button

**PasswordChangeForm:**
- Current password field (required for verification)
- New password field with strength indicator
- Confirm password field
- Password requirements display
- Show/hide password toggle
- Success/error messages

**ChangeHistoryList:**
- Paginated list of all changes
- Columns: Date, Type, Old Value → New Value, Gold Cost
- Filter by change type (optional)
- Max 10-20 items per page
- Empty state message

**UI Styling:**
- Use `fantasy-card` class for section containers
- Use `FantasyButton` for all buttons
- Use Lucide icons for visual elements
- Mobile-responsive (Tailwind breakpoints)
- Dark mode compatible

---

### Phase 4: Integration & Polish (1-2 hours)

**Objective:** Connect all pieces and handle edge cases.

**Deliverables:**
- Profile navigation button in dashboard header
- Extended `AuthContext` with `updatePassword()` function
- Integration with `CharacterContext` for realtime updates
- Error boundaries and fallback UI
- Loading states for async operations
- Toast/notification messages for user feedback

**Navigation Integration:**
- Add button to dashboard header next to "Admin" button
- Icon: `User` from lucide-react
- Text: "Profile" on desktop, hidden on mobile (icon only)
- Responsive with touch-target sizing

**AuthContext Extension:**
- Add `updatePassword(currentPassword, newPassword)` method
- Handle Supabase Auth API calls
- Manage loading/error states
- Return result with error message if failed

**CharacterContext Integration:**
- After class change, trigger `refreshCharacter()`
- Handle realtime subscription updates
- Show loading skeleton while updating
- Display level-up modal if level gained from rewards

---

### Phase 5: Quality Assurance (1 hour)

**Objective:** Verify all code quality gates pass.

**Deliverables:**
- All TypeScript compilation passes (`npm run build`)
- All linting rules pass (`npm run lint`)
- All unit and integration tests pass (`npm run test`)
- Manual testing checklist completed
- Edge case verification

**Testing Checklist:**
- [ ] Can change character name successfully
- [ ] Cannot change name with empty/whitespace input
- [ ] Can see gold cost before class change
- [ ] Cannot change class with insufficient gold
- [ ] Gold deducted correctly after class change
- [ ] Cannot change class twice within 7 days
- [ ] Can change class after 7 days
- [ ] Change history shows all modifications
- [ ] Can change password with valid input
- [ ] Password change requires current password
- [ ] Error messages display appropriately
- [ ] Mobile responsive on small screens
- [ ] Works in dark mode

---

## Task Breakdown

### Phase 1 Tasks
1. Create migration: Add `last_class_change_at` column to `characters`
2. Create migration: Create `character_change_history` table
3. Create RLS policies for change history table
4. Write tests for migration rollback

### Phase 2 Tasks
1. Define TypeScript types for service
2. Implement `getClassChangeCost()` method (TDD)
3. Implement `changeCharacterName()` method (TDD)
4. Implement `canChangeClass()` method (TDD)
5. Implement `changeCharacterClass()` method (TDD)
6. Implement `recordChange()` helper (TDD)
7. Implement `getChangeHistory()` method (TDD)
8. Write integration tests for service

### Phase 3 Tasks
1. Create `/app/profile/page.tsx` structure
2. Build `ProfileSettings` container component
3. Build `CharacterNameForm` component + tests
4. Build `ClassChangeForm` component + tests
5. Build `PasswordChangeForm` component + tests
6. Build `ChangeHistoryList` component + tests
7. Add responsive styling and dark mode support
8. Create page layout and styling

### Phase 4 Tasks
1. Add profile button to dashboard header
2. Extend `AuthContext` with password update
3. Integrate `CharacterContext` for realtime updates
4. Add error boundaries and fallback UI
5. Implement toast notifications
6. Test complete user flows end-to-end

### Phase 5 Tasks
1. Run full build check
2. Run full lint check
3. Run full test suite
4. Manual testing on multiple screen sizes
5. Test error scenarios
6. Final edge case verification

---

## Design Considerations

### Visual Design
- Maintain fantasy theme consistency with existing UI
- Class cards show icon + name + bonus percentages
- Gold cost prominently displayed with coin icon
- Cooldown timer shows remaining days/hours
- Color-code cost (affordable vs. expensive)
- Error states clearly distinguished

### Mobile UX
- Single-column layout on small screens
- Accessible touch targets (44px minimum)
- Expandable sections for details
- Bottom-aligned CTAs for easy thumb reach
- Clear confirmation dialogs on mobile

### Accessibility
- ARIA labels for form inputs
- Keyboard navigation support
- Color-blind safe icon usage (icons + text, not just icons)
- Focus indicators on interactive elements
- Screen reader friendly confirmations

---

## Technical Considerations

### Architecture Decisions
1. **Service Layer Pattern** - ProfileService encapsulates business logic, making it testable and reusable
2. **Separate Change History Table** - Audit trail without data redundancy
3. **Cooldown Column** - Simple timestamp check is more efficient than query
4. **CharacterContext Refresh** - Leverage existing realtime system for UI sync
5. **TDD Approach** - Write tests first for service layer, then implementation

### Dependencies
- `@supabase/supabase-js` - Database and auth
- `lucide-react` - Icons
- `framer-motion` - Modal animations (already in project)
- `react-hot-toast` - Notifications (if not already included)

### Performance Optimizations
- Lazy load change history (pagination, not all at once)
- Memoize class bonus calculations
- Cache class definitions in constants
- Debounce name input validation
- Cancel in-flight requests on unmount

### Security Considerations
- Validate gold balance server-side (RLS policies)
- Use Supabase Auth's built-in password change (not custom)
- Prevent race conditions with optimistic locking
- Log all changes for audit trail
- Never expose gold cost calculation in UI (derive from level)

---

## Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Race condition on gold deduction | Low | High | Use transactions, add RLS check |
| Cooldown logic broken | Low | Medium | Comprehensive unit tests |
| Password change fails silently | Low | Medium | Proper error handling and user feedback |
| Mobile layout broken | Medium | Medium | Early mobile testing, responsive grid |
| Database migration fails | Low | High | Test migration + rollback locally |
| Missing RLS policies | Low | High | Audit RLS before deployment |

---

## Success Metrics

- ✅ All unit tests pass (>95% coverage on service layer)
- ✅ All integration tests pass
- ✅ Zero TypeScript errors in build
- ✅ Zero linting warnings
- ✅ User can complete all 3 profile changes successfully
- ✅ Gold cost calculated and deducted correctly
- ✅ Cooldown prevents changes within 7 days
- ✅ Change history displays all modifications
- ✅ Mobile responsive at 320px, 768px, 1024px widths
- ✅ Accessible on keyboard and screen readers
- ✅ Works in both light and dark modes

---

## Timeline Estimate

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: Database | 1-2 hours | Straightforward migrations |
| Phase 2: Service | 2-3 hours | TDD cycle with tests |
| Phase 3: Components | 3-4 hours | Multiple forms + tests |
| Phase 4: Integration | 1-2 hours | Wiring everything together |
| Phase 5: QA | 1 hour | Build, lint, test, manual check |
| **TOTAL** | **8-12 hours** | 1-2 day sprint |

---

## Related Issues & Dependencies

**Related to:**
- Issue #66: Avatar & Customization System (Phase 2)
- Issue #69: Achievement System (Phase 2)

**Depends on:**
- Existing Supabase setup (met)
- Character creation flow patterns (already exist)
- Form component library (already exist)

**Enables:**
- Future avatar customization page
- Future account settings page
- Better user profile management

---

## Next Steps (Ready to Begin Implementation)

1. ✅ Create dev documentation files (this document)
2. Start Phase 1: Database migrations
3. Proceed through phases sequentially
4. Update `dev/active/user-profile-settings/user-profile-settings-tasks.md` as you progress
5. Update `dev/active/user-profile-settings/user-profile-settings-context.md` if blockers arise

**Ready to start Phase 1?** Use the task checklist in `user-profile-settings-tasks.md` to track progress.
