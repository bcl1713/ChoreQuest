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

- [ ] 1.0 Backend API Endpoints - User Role Management
  - [ ] 1.1 Create `app/api/users/[userId]/promote/route.ts` with POST handler
  - [ ] 1.2 Implement authentication check (verify requester has `role = 'guild_master'`)
  - [ ] 1.3 Implement family membership verification (requester and target in same family)
  - [ ] 1.4 Implement promotion validation (reject if target is already Guild Master)
  - [ ] 1.5 Update target user's role to 'guild_master' in Supabase
  - [ ] 1.6 Return updated user object with proper error handling (403, 400)
  - [ ] 1.7 Create `app/api/users/[userId]/demote/route.ts` with POST handler
  - [ ] 1.8 Implement same authentication and family checks for demotion
  - [ ] 1.9 Implement self-demotion check (return 400 if requester = target)
  - [ ] 1.10 Implement last GM check (count GMs in family, reject if would reach zero)
  - [ ] 1.11 Update target user's role to 'hero' in Supabase (if validations pass)
  - [ ] 1.12 Return updated user object with proper error messages

- [ ] 2.0 Backend Service Layer - User Service Enhancement
  - [ ] 2.1 Add `promoteToGuildMaster(userId: string)` method to UserService
  - [ ] 2.2 Add `demoteToHero(userId: string)` method to UserService
  - [ ] 2.3 Add `countGuildMasters(familyId: string)` helper method
  - [ ] 2.4 Update `getFamilyMembers()` to include role field and sort by role
  - [ ] 2.5 Write unit tests for `promoteToGuildMaster()` - happy path
  - [ ] 2.6 Write unit tests for `promoteToGuildMaster()` - error cases (already GM, auth failure)
  - [ ] 2.7 Write unit tests for `demoteToHero()` - happy path
  - [ ] 2.8 Write unit tests for `demoteToHero()` - self-demotion rejection
  - [ ] 2.9 Write unit tests for `demoteToHero()` - last GM protection
  - [ ] 2.10 Write unit tests for `getFamilyMembers()` - verify role sorting
  - [ ] 2.11 Ensure all unit tests pass (target: 10-12 new tests)

- [ ] 3.0 Frontend Components - Family Management UI
  - [ ] 3.1 Create `components/family-management.tsx` component file
  - [ ] 3.2 Implement family member list UI (table/list with Name, Role Badge, Actions columns)
  - [ ] 3.3 Fetch family members using UserService on mount
  - [ ] 3.4 Display role badge for each family member (use RoleBadge component)
  - [ ] 3.5 Render "Promote to Guild Master" button for Heroes
  - [ ] 3.6 Render "Demote to Hero" button for other GMs (hide for current user)
  - [ ] 3.7 Create promotion confirmation modal with explanation text
  - [ ] 3.8 Create demotion confirmation modal with warning text
  - [ ] 3.9 Implement handlePromote function (call API, update state, show toast)
  - [ ] 3.10 Implement handleDemote function (call API, handle errors, show toast)
  - [ ] 3.11 Add error handling for last GM scenario (display user-friendly message)
  - [ ] 3.12 Subscribe to realtime user updates for live badge changes
  - [ ] 3.13 Handle current user demotion (redirect to hero view if demoted)
  - [ ] 3.14 Add loading states for promote/demote actions
  - [ ] 3.15 Integrate FamilyManagement component into dashboard as new tab

- [ ] 4.0 Frontend Components - Role Badges System
  - [ ] 4.1 Create `components/role-badge.tsx` reusable component
  - [ ] 4.2 Implement badge rendering with icon (crown for GM, shield for Hero)
  - [ ] 4.3 Add tooltip with role name on hover
  - [ ] 4.4 Style badge to match existing design system (Tailwind classes)
  - [ ] 4.5 Add RoleBadge to family member lists in FamilyManagement
  - [ ] 4.6 Add RoleBadge to QuestDashboard quest approval section
  - [ ] 4.7 Add RoleBadge to RewardManager redemption approval section
  - [ ] 4.8 Add RoleBadge to any other UI showing family members
  - [ ] 4.9 Ensure consistent badge placement and sizing across all uses

- [ ] 5.0 Realtime Integration - Role Change Propagation
  - [ ] 5.1 Add `onFamilyMemberUpdate` event listener to RealtimeContext
  - [ ] 5.2 Subscribe to `users` table changes in family-scoped channel
  - [ ] 5.3 Emit `family_member_updated` events on role changes (INSERT, UPDATE)
  - [ ] 5.4 Update FamilyManagement component to listen for role updates
  - [ ] 5.5 Refresh UI when other users are promoted/demoted
  - [ ] 5.6 Detect if current user was promoted (show success message, refresh permissions)
  - [ ] 5.7 Detect if current user was demoted (redirect to hero dashboard)
  - [ ] 5.8 Update all role badges in real-time across dashboard views
  - [ ] 5.9 Test realtime updates with multiple browser windows

- [ ] 6.0 Testing & Quality Assurance
  - [ ] 6.1 Write E2E test: GM promotes Hero to GM successfully
  - [ ] 6.2 Write E2E test: GM demotes another GM to Hero successfully
  - [ ] 6.3 Write E2E test: GM cannot demote last GM (error message shown)
  - [ ] 6.4 Write E2E test: GM cannot see demote button for themselves
  - [ ] 6.5 Write E2E test: Non-GM cannot access Family Management tab
  - [ ] 6.6 Write E2E test: Role badges display correctly throughout app
  - [ ] 6.7 Write E2E test: Realtime role updates work across browser tabs
  - [ ] 6.8 Write E2E test: Demoted user redirected from GM-only pages
  - [ ] 6.9 Run all unit tests (`npm run test`) - verify all pass
  - [ ] 6.10 Run all E2E tests (`npx playwright test`) - verify all pass
  - [ ] 6.11 Run build (`npm run build`) - verify zero TypeScript errors
  - [ ] 6.12 Run lint (`npm run lint`) - verify zero warnings
  - [ ] 6.13 Manual testing: Promote/demote flows with real users
  - [ ] 6.14 Manual testing: Multi-GM quest approval workflow
  - [ ] 6.15 Manual testing: Multi-GM reward management workflow
  - [ ] 6.16 Manual testing: Mobile responsive design for Family Management

---

**Status**: Phase 2 Complete - Sub-tasks generated
**Total Tasks**: 6 parent tasks, 74 sub-tasks
**Estimated Complexity**: Medium-High (requires backend, frontend, realtime, and testing work)

**Implementation Notes**:
- Follow TDD approach: Write tests first, then implement to pass
- Use existing service patterns (QuestTemplateService, RewardService) as reference
- Use existing component patterns (QuestTemplateManager, RewardManager) as reference
- Leverage Supabase RLS for security - no custom middleware needed
- All API routes should be minimal (direct Supabase calls preferred)
- Realtime updates already have infrastructure - just add user table subscription
