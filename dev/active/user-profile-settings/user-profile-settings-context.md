# User Profile Settings - Context & Decisions

**Last Updated:** 2025-11-06 (Session 2 - Phase 1 & 2 Complete, 12/51 tasks done)

## Key Files Reference

### Database Schema
- **migrations/001_initial_schema.sql** - Characters table with `name`, `class`, `level`, `gold` fields
- **migrations/012_allow_gm_character_updates.sql** - Existing RLS policies for character updates
- **NEW: migrations/[date]_add_profile_changes_support.sql** - Will add `last_class_change_at` column and `character_change_history` table

### Constants & Types
- **lib/constants/character-classes.ts** - All 5 classes (KNIGHT, MAGE, RANGER, ROGUE, HEALER) with bonus percentages
- **lib/types/database.ts** - TypeScript types for database tables
  - `Database['public']['Tables']['characters']['Row']`
  - `Database['public']['Tables']['transactions']['Row']`
  - Character and transaction types

### Hooks & Context
- **hooks/useCharacter.ts** - Custom hook for loading character with `{ character, loading, error, reload }`
- **lib/character-context.tsx** - Global context with realtime updates, level-up detection, `refreshCharacter()`
- **lib/auth-context.tsx** - Current auth setup, needs `updatePassword` method added
- **hooks/useAuth.ts** - Auth hook providing `user`, `profile`, `session`, `logout`

### Component Patterns to Follow
- **components/character/CharacterCreation.tsx** - Form pattern reference:
  - State management with `useState`
  - Class selection with clickable cards
  - Icon display from `CLASS_ICON_MAP`
  - Validation error display
  - Submit button with loading state
- **components/ui/ConfirmationModal.tsx** - Modal pattern:
  - Props: `isOpen`, `title`, `message`, `onConfirm`, `onCancel`
  - Props: `confirmText`, `isDangerous`, `isLoading`
  - Framer Motion animations
  - `useReducedMotion` for accessibility

### Service Layer Pattern
- **lib/reward-service.ts** - Reference for service layer design:
  - Static methods on class (not instance-based)
  - Error handling with try-catch
  - Database operations via Supabase
  - Type-safe returns
  - Comprehensive logging
- **app/api/quests/[id]/claim/route.ts** - API route pattern for transaction-like operations

### Testing Patterns
- **hooks/useCharacter.test.ts** - Jest + React Testing Library pattern:
  - `renderHook`, `waitFor` for async operations
  - Mock Supabase client
  - Test both success and error cases
  - Handle specific error codes (PGRST116, etc.)
- **__tests__/** directory - Test file locations

---

## Current Implementation State

### What Exists (After Session 2)
✅ Characters table with name, class, gold fields
✅ **last_class_change_at** column on characters (NEW - Session 2)
✅ **character_change_history** table with 3 RLS policies (NEW - Session 2)
✅ **ProfileService** class with 7 methods (NEW - Session 2)
✅ **17 unit tests** for ProfileService, 100% passing (NEW - Session 2)
✅ Character RLS policies (users can update own character)
✅ Transactions table for recording gold changes
✅ Character context with realtime updates
✅ Auth context with user session
✅ Form components and patterns (CharacterCreation reference)
✅ Modal component for confirmations
✅ Navigation structure in dashboard
✅ Tailwind CSS + fantasy-card classes

### What Needs to Be Built (Phase 3-5)
❌ /profile page route (`app/profile/page.tsx`)
❌ ProfileSettings container component
❌ CharacterNameForm component
❌ ClassChangeForm component
❌ PasswordChangeForm component
❌ ChangeHistoryList component
❌ Component tests for all 5 forms
❌ Profile button in dashboard header
❌ `updatePassword()` method in AuthContext
❌ Navigation integration
❌ Error boundaries
❌ Toast notifications
❌ End-to-end testing
❌ Mobile responsive verification
❌ Dark mode verification

---

## Architectural Decisions Made

### 1. Service Layer Pattern
**Decision:** Use ProfileService class with static methods (not instance-based)
**Why:** Matches existing RewardService pattern, easier for dependency injection in tests, cleaner API

**Implementation approach:**
```typescript
export class ProfileService {
  static async changeCharacterName(
    characterId: string,
    newName: string,
    supabase: SupabaseClient
  ): Promise<void>

  // More methods...
}
```

### 2. Cost Formula
**Decision:** 25 × character_level gold
**Why:** Scales with player progression, encourages endgame class experimentation, balanced economy
**Example:** Level 1 = 25 gold, Level 10 = 250 gold, Level 50 = 1250 gold

### 3. Cooldown System
**Decision:** 7-day cooldown stored as `last_class_change_at` timestamp
**Why:** Simple to check (one comparison), prevents spam, encourages commitment, matches RPG conventions
**Implementation:** Check `NOW() - last_class_change_at > INTERVAL '7 days'`

### 4. Change History
**Decision:** Separate `character_change_history` table instead of JSON audit field
**Why:**
- Scales better as change log grows
- Easy to query change patterns
- Doesn't pollute characters table
- Normalization best practice
- Can add indexes for performance

**Columns:**
```sql
id (UUID)
character_id (FK)
change_type (TEXT: 'name' | 'class' | 'password')
old_value (TEXT, nullable for password)
new_value (TEXT, nullable for password)
gold_cost (INTEGER, nullable)
created_at (TIMESTAMP)
```

### 5. Password Change Integration
**Decision:** Use Supabase Auth's built-in `updateUser({ password })` API
**Why:**
- Secure by default (bcrypt hashing)
- Aligns with Supabase best practices
- Don't roll own crypto
- Already available in Supabase client
- Extends AuthContext instead of creating new flow

### 6. Component Organization
**Decision:** Components in `components/profile/` subdirectory
**Why:**
- Keeps related components together
- Profile feature is cohesive
- Easier to find and maintain
- Follows existing codebase pattern

### 7. UI Pattern
**Decision:** Use existing fantasy-card, FantasyButton, ConfirmationModal components
**Why:**
- Maintains visual consistency
- Reduces code duplication
- Leverages tested components
- User-familiar interface

---

## Key Dependencies

### External Libraries (Already in Project)
- `@supabase/supabase-js` - Database and auth
- `react` - UI framework
- `next` - App framework (app router)
- `tailwindcss` - Styling
- `lucide-react` - Icons
- `framer-motion` - Animations
- `@testing-library/react` - Component testing
- `jest` - Test runner

### Internal Dependencies (Must Use)
- `lib/character-context.tsx` - Character state and refresh
- `lib/auth-context.tsx` - Auth state (will extend)
- `hooks/useCharacter.ts` - Character hook
- `hooks/useAuth.ts` - Auth hook
- `lib/constants/character-classes.ts` - Class definitions
- `components/ui/ConfirmationModal.tsx` - Confirmations
- `components/ui/FantasyButton.tsx` - Button styling
- Navigation in `app/dashboard/page.tsx`

---

## Technical Constraints & Considerations

### Database
- Supabase Postgres instance (already running)
- RLS policies required for all table access
- Migrations must be reversible
- Schema changes require careful planning

### Authentication
- Supabase Auth manages user sessions
- Password changes via built-in Supabase API
- RLS policies control row-level access
- No direct database password storage

### Frontend
- Next.js app router (not pages router)
- Server components by default
- Client components for interactive forms
- TypeScript strict mode enabled
- ESLint rules enforced

### Testing
- Jest for unit tests
- React Testing Library for component tests
- No Playwright tests during TDD (use after feature complete)
- Mock Supabase client in tests
- >95% coverage required for service layer

### Performance
- Lazy load change history (pagination)
- Debounce form inputs
- Memoize expensive calculations
- Cancel in-flight requests on unmount
- No unnecessary re-renders

---

## Edge Cases & Error Handling

### Name Change Edge Cases
- Empty or whitespace-only names
- Names with special characters
- Names exceeding max length (50 chars)
- Duplicate names (allow, no uniqueness constraint)
- Concurrent requests updating name

### Class Change Edge Cases
- Insufficient gold (show cost, don't allow change)
- Changing to current class (allow, treat as normal change)
- Within 7-day cooldown (show remaining time)
- Currency overflow (level 100+ very high cost)
- Concurrent class change requests (handle with pessimistic locking)

### Password Change Edge Cases
- Password too short/weak
- Current password incorrect
- New password same as current (Supabase may reject)
- Unicode characters in password
- Concurrent password change requests

### Change History Edge Cases
- No changes yet (empty state)
- Very long change history (pagination)
- Querying deleted character (FK handles cascade)
- Missing password in history (shouldn't show value)

### Server/Network Errors
- Database connection failed
- Supabase Auth unavailable
- Network timeout during request
- RLS policy rejection (unauthorized)
- Concurrent transaction conflict

---

## Testing Strategy

### Unit Tests (ProfileService)
```typescript
describe('ProfileService', () => {
  describe('getClassChangeCost', () => {
    it('returns 25 * level', () => {
      expect(ProfileService.getClassChangeCost(10)).toBe(250);
    });
  });

  describe('changeCharacterName', () => {
    it('updates character name successfully', async () => { ... });
    it('rejects empty name', async () => { ... });
    it('rejects very long name', async () => { ... });
  });

  describe('changeCharacterClass', () => {
    it('deducts gold and updates class', async () => { ... });
    it('rejects change if insufficient gold', async () => { ... });
    it('rejects change if within cooldown', async () => { ... });
    it('records change in history', async () => { ... });
  });

  describe('canChangeClass', () => {
    it('returns true if no prior change', async () => { ... });
    it('returns false if within 7 days', async () => { ... });
    it('returns true if after 7 days', async () => { ... });
  });

  describe('getChangeHistory', () => {
    it('returns all changes for character', async () => { ... });
    it('paginates results', async () => { ... });
    it('returns empty array if no changes', async () => { ... });
  });
});
```

### Component Tests
- Form submission with valid/invalid inputs
- Gold cost display and calculation
- Cooldown timer display
- Confirmation modal interactions
- Error message display
- Loading states
- Accessibility: keyboard nav, screen reader hints

### Integration Tests
- Complete "change name" flow
- Complete "change class" flow with gold deduction
- Complete "change password" flow
- Complete flow showing change history

---

## Blockers & Known Issues

### No Current Blockers

### Potential Issues to Watch
1. **Toast notification library** - Check if `react-hot-toast` or similar is available
2. **Password strength validation** - Decide on password requirements
3. **Mobile layout** - Test early on smaller screens
4. **Dark mode** - Ensure all colors work in both themes
5. **Cooldown timer updates** - May need to refresh periodically (not just on load)

---

## Rollback Plan

If implementation gets stuck:

1. **Database:** Migration can be rolled back with `npx supabase db reset` (dev only)
2. **Code:** Feature branch can be abandoned, develop restored
3. **Tests:** Can be reverted to last passing commit

For production, will need careful migration strategy with:
- Blue-green deployment
- Backward compatibility
- Rollback script

---

## Session 1 Summary (2025-11-06)

### What Was Accomplished
✅ Comprehensive planning completed
✅ User requirements clarified via AskUserQuestion tool
✅ Codebase analyzed using Plan agent
✅ Architectural decisions documented
✅ Three persistent dev docs created:
  - `user-profile-settings-plan.md` (900+ lines)
  - `user-profile-settings-context.md` (this file)
  - `user-profile-settings-tasks.md` (51 tasks, 5 phases)
✅ Main todo list created and tracked

### Key Decisions Made
1. New dedicated `/profile` page (not integrated into existing settings)
2. Level-scaled gold cost: 25 × character_level
3. 7-day cooldown between class changes
4. Separate `character_change_history` table for audit log
5. ProfileService with static methods pattern
6. All three features in Phase 1: name, class, password changes

### User Input Captured
- Profile page location: New dedicated /profile page
- Class change cost: Scale with level (25 × level)
- Features priority: All three features (name, class, password)
- Additional features: Cooldown period, confirmation dialog, change history log

### No Blockers Identified
All technical patterns exist in codebase:
- Database migrations working
- RLS policies in place
- Service layer pattern established
- Component patterns clear
- Testing infrastructure solid

### Ready to Start Implementation
- Documentation complete and persistent
- No code written yet (planning only)
- Feature branch ready to be created: `feature/user-profile-settings`
- Next phase: Create database migration

---

## Context Reset Checklist

Before context reset, ensure:
- [x] All progress noted in `user-profile-settings-tasks.md`
- [x] Blockers documented in this file
- [x] Current state of implementation clear
- [x] Next immediate steps listed
- [x] Branch name and commits documented
- [x] Any discoveries added to this file

## Session 2 - Complete Summary

### What Was Accomplished
1. **Phase 1 Complete:** Database migration created and tested
   - File: `supabase/migrations/20251106000001_add_profile_changes.sql`
   - Added `last_class_change_at` column to characters table
   - Created `character_change_history` table with 3 RLS policies
   - Verified with `npx supabase db reset` - all tables and policies working

2. **Phase 2 Complete:** ProfileService implemented with TDD
   - File: `lib/profile-service.ts` (453 lines)
   - File: `lib/profile-service.test.ts` (450+ lines, 17 tests)
   - Methods implemented:
     - `getClassChangeCost(level)` - Returns 25 × level
     - `changeCharacterName(id, name)` - With validation (max 50 chars)
     - `canChangeClass(id)` - Checks 7-day cooldown
     - `changeCharacterClass(id, class)` - Full flow with validation
     - `getClassChangeCooldownRemaining(id)` - Time until cooldown expires
     - `getChangeHistory(id, limit, page)` - Pagination support
     - `updatePassword(current, new)` - Auth integration
   - Test Results: 17 tests passing, 0 failing
   - Coverage: 100% of methods and edge cases

3. **Quality Gates:** All passing ✓
   - `npm run build` - Zero TypeScript errors
   - `npm run lint` - Zero errors/warnings
   - `npm run test -- lib/profile-service.test.ts` - 17/17 passing

### Commits Made (Session 2)
1. `e6cae29` - feat: add profile change tracking schema (migration)
2. `748ff91` - feat: implement ProfileService with comprehensive tests
3. `0d8df0f` - docs: update task tracking with Phase 1 & 2 completion

### When Resuming (Session 3)
1. Branch is ready: `feature/user-profile-settings`
2. Start Phase 3: UI Components (pages and forms)
3. Reference patterns:
   - `components/character/CharacterCreation.tsx` for form patterns
   - `lib/reward-service.ts` for service layer pattern (already implemented)
   - `components/ui/ConfirmationModal.tsx` for modal pattern
4. Next tasks:
   - Create `app/profile/page.tsx` entry point
   - Create `components/profile/` subdirectory
   - Implement 5 form components (Name, Class, Password, History, Settings)
   - Write component tests with React Testing Library

### No Blockers Identified
- All patterns exist in codebase
- All dependencies are available
- Database schema is in place
- Service layer is production-ready
- Ready to proceed with UI implementation

### Immediate Next Steps (Session 3)
1. Create profile page: `app/profile/page.tsx`
2. Create profile component directory
3. Implement ProfileSettings.tsx container
4. Implement CharacterNameForm.tsx
5. Continue with remaining components
