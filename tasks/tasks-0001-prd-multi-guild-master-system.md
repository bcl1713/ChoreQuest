# Tasks: Multi-Guild Master System

## Relevant Files

### Backend - API Routes
- `app/api/users/[userId]/promote/route.ts` - POST endpoint for promoting users to Guild Master
- `app/api/users/[userId]/demote/route.ts` - POST endpoint for demoting Guild Masters to Hero
- `app/api/users/family-members/route.ts` - GET endpoint for fetching family members with roles (existing, needs enhancement)

### Backend - Services
- `lib/user-service.ts` - User service class for role management operations (needs expansion)
- `tests/unit/users/user-service.test.ts` - Unit tests for UserService role management methods

### Frontend - Components
- `components/family-management.tsx` - New component for Family Management tab
- `components/role-badge.tsx` - Reusable role badge component with tooltip
- `components/confirmation-modal.tsx` - Reusable confirmation modal (or use existing modal pattern)

### Frontend - Dashboard Integration
- `app/dashboard/page.tsx` - Main dashboard page (needs tab integration)
- `components/quest-dashboard.tsx` - Existing dashboard component (needs role badge integration)

### Frontend - Context & Types
- `lib/realtime-context.tsx` - Realtime context (needs onFamilyMemberUpdate listener)
- `types/index.ts` or `lib/types/database.ts` - Type definitions for role management

### Testing
- `tests/unit/users/user-service.test.ts` - Unit tests for user service
- `tests/e2e/family-management.spec.ts` - E2E tests for promotion/demotion flows
- `tests/e2e/role-badges.spec.ts` - E2E tests for role badge display and realtime updates

### Notes
- Unit tests should be placed in `tests/unit/` directory organized by feature
- E2E tests should be placed in `tests/e2e/` directory
- Use `npm run test` for unit tests (Jest)
- Use `npx playwright test` for E2E tests
- Follow existing service patterns (see `lib/quest-template-service.ts`, `lib/reward-service.ts`)
- Follow existing component patterns (see `components/quest-template-manager.tsx`, `components/reward-manager.tsx`)

## Tasks

- [x] 1.0 Backend API Endpoints - User Role Management
  - [x] 1.1 Create `app/api/users/[userId]/promote/route.ts` with POST handler
  - [x] 1.2 Implement authentication check (verify requester has `role = 'guild_master'`)
  - [x] 1.3 Implement family membership verification (requester and target in same family)
  - [x] 1.4 Implement promotion validation (reject if target is already Guild Master)
  - [x] 1.5 Update target user's role to 'guild_master' in Supabase
  - [x] 1.6 Return updated user object with proper error handling (403, 400)
  - [x] 1.7 Create `app/api/users/[userId]/demote/route.ts` with POST handler
  - [x] 1.8 Implement same authentication and family checks for demotion
  - [x] 1.9 Implement self-demotion check (return 400 if requester = target)
  - [x] 1.10 Implement last GM check (count GMs in family, reject if would reach zero)
  - [x] 1.11 Update target user's role to 'hero' in Supabase (if validations pass)
  - [x] 1.12 Return updated user object with proper error messages

- [x] 2.0 Backend Service Layer - User Service Enhancement
  - [x] 2.1 Add `promoteToGuildMaster(userId: string)` method to UserService
  - [x] 2.2 Add `demoteToHero(userId: string)` method to UserService
  - [x] 2.3 Add `countGuildMasters(familyId: string)` helper method
  - [x] 2.4 Update `getFamilyMembers()` to include role field and sort by role
  - [x] 2.5 Write unit tests for `promoteToGuildMaster()` - happy path
  - [x] 2.6 Write unit tests for `promoteToGuildMaster()` - error cases (already GM, auth failure)
  - [x] 2.7 Write unit tests for `demoteToHero()` - happy path
  - [x] 2.8 Write unit tests for `demoteToHero()` - self-demotion rejection
  - [x] 2.9 Write unit tests for `demoteToHero()` - last GM protection
  - [x] 2.10 Write unit tests for `getFamilyMembers()` - verify role sorting
  - [x] 2.11 Ensure all unit tests pass (target: 10-12 new tests)

- [x] 3.0 Frontend Components - Family Management UI
  - [x] 3.1 Create `components/family-management.tsx` component file
  - [x] 3.2 Implement family member list UI (table/list with Name, Role Badge, Actions columns)
  - [x] 3.3 Fetch family members using UserService on mount
  - [x] 3.4 Display role badge for each family member (use RoleBadge component)
  - [x] 3.5 Render "Promote to Guild Master" button for Heroes
  - [x] 3.6 Render "Demote to Hero" button for other GMs (hide for current user)
  - [x] 3.7 Create promotion confirmation modal with explanation text
  - [x] 3.8 Create demotion confirmation modal with warning text
  - [x] 3.9 Implement handlePromote function (call API, update state, show toast)
  - [x] 3.10 Implement handleDemote function (call API, handle errors, show toast)
  - [x] 3.11 Add error handling for last GM scenario (display user-friendly message)
  - [x] 3.12 Subscribe to realtime user updates for live badge changes
  - [x] 3.13 Handle current user demotion (redirect to hero view if demoted)
  - [x] 3.14 Add loading states for promote/demote actions
  - [x] 3.15 Integrate FamilyManagement component into dashboard as new tab

- [x] 4.0 Frontend Components - Role Badges System
  - [x] 4.1 Create `components/role-badge.tsx` reusable component
  - [x] 4.2 Implement badge rendering with icon (crown for GM, shield for Hero)
  - [x] 4.3 Add tooltip with role name on hover
  - [x] 4.4 Style badge to match existing design system (Tailwind classes)
  - [x] 4.5 Add RoleBadge to family member lists in FamilyManagement
  - [x] 4.6 Add RoleBadge to QuestDashboard quest approval section
  - [x] 4.7 Add RoleBadge to RewardManager redemption approval section
  - [x] 4.8 Add RoleBadge to any other UI showing family members
  - [x] 4.9 Ensure consistent badge placement and sizing across all uses

- [x] 5.0 Realtime Integration - Role Change Propagation
  - [x] 5.1 Add `onFamilyMemberUpdate` event listener to RealtimeContext
  - [x] 5.2 Subscribe to `users` table changes in family-scoped channel
  - [x] 5.3 Emit `family_member_updated` events on role changes (INSERT, UPDATE)
  - [x] 5.4 Update FamilyManagement component to listen for role updates
  - [x] 5.5 Refresh UI when other users are promoted/demoted
  - [x] 5.6 Detect if current user was promoted (show success message, refresh permissions)
  - [x] 5.7 Detect if current user was demoted (redirect to hero dashboard)
  - [x] 5.8 Update all role badges in real-time across dashboard views
  - [x] 5.9 Test realtime updates with multiple browser windows

- [x] 6.0 Testing & Quality Assurance
  - [x] 6.1 Write E2E test: GM promotes Hero to GM successfully
  - [x] 6.2 Write E2E test: GM demotes another GM to Hero successfully
  - [x] 6.3 Write E2E test: GM cannot demote last GM (error message shown)
  - [x] 6.4 Write E2E test: GM cannot see demote button for themselves
  - [x] 6.5 Write E2E test: Non-GM cannot access Family Management tab
  - [x] 6.6 Write E2E test: Role badges display correctly throughout app
  - [x] 6.7 Write E2E test: Realtime role updates work across browser tabs
  - [x] 6.8 Write E2E test: Demoted user redirected from GM-only pages
  - [x] 6.9 Run all unit tests (`npm run test`) - verify all pass
  - [x] 6.10 Run all E2E tests (`npx playwright test`) - verify all pass
  - [x] 6.11 Run build (`npm run build`) - verify zero TypeScript errors
  - [x] 6.12 Run lint (`npm run lint`) - verify zero warnings
  - [x] 6.13 Manual testing: Promote/demote flows with real users
  - [x] 6.14 Manual testing: Multi-GM quest approval workflow
  - [x] 6.15 Manual testing: Multi-GM reward management workflow
  - [x] 6.16 Manual testing: Mobile responsive design for Family Management

---

**Status**: ✅ ALL TASKS COMPLETE (1.0-6.0)
**Total Tasks**: 6 parent tasks, 74 sub-tasks (all complete)
**Estimated Complexity**: Medium-High (requires backend, frontend, realtime, and testing work)

**Completion Summary**:
- ✅ Backend API endpoints (promote/demote) implemented
- ✅ UserService with role management methods and unit tests (75 tests passing)
- ✅ Family Management UI with promote/demote flows
- ✅ Role badges system throughout app
- ✅ Realtime integration for role changes
- ✅ E2E tests for all user stories
- ✅ Build, lint, and all unit tests passing

**Last Commit**: test: fix UserService unit tests for auth token mocking (0ad0496)

**Implementation Notes**:
- Follow TDD approach: Write tests first, then implement to pass
- Use existing service patterns (QuestTemplateService, RewardService) as reference
- Use existing component patterns (QuestTemplateManager, RewardManager) as reference
- Leverage Supabase RLS for security - no custom middleware needed
- All API routes should be minimal (direct Supabase calls preferred)
- Realtime updates already have infrastructure - just add user table subscription
