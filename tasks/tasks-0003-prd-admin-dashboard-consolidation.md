# Task List: Admin Dashboard Consolidation

Based on PRD: `0003-prd-admin-dashboard-consolidation.md`

## Relevant Files

### New Files to Create
- `app/admin/page.tsx` - Main admin dashboard page component
- `components/admin-dashboard.tsx` - **MODIFIED** Admin dashboard container with tabbed interface (integrated FamilySettings)
- `components/statistics-panel.tsx` - **CREATED** Family statistics overview component with real-time updates
- `components/activity-feed.tsx` - **CREATED** Real-time activity feed component with event aggregation and relative timestamps
- `components/guild-master-manager.tsx` - **CREATED** Guild Master role management component with promote/demote functionality
- `components/family-settings.tsx` - **CREATED** Family settings component with invite code management and member list
- `lib/statistics-service.ts` - **CREATED** Service for calculating family statistics
- `lib/activity-service.ts` - **CREATED** Service for fetching family activity events (aggregates from quests, rewards, characters)
- `lib/family-service.ts` - **CREATED** Service for family-related operations (getFamilyInfo, regenerateInviteCode)
- `tests/unit/statistics/statistics-service.test.ts` - **CREATED** Unit tests for statistics service (10/10 passing)
- `tests/unit/lib/activity-service.test.ts` - Unit tests for activity service
- `tests/unit/lib/family-service.test.ts` - Unit tests for family service
- `tests/unit/components/statistics-panel.test.tsx` - **CREATED** Unit tests for statistics panel (11/11 passing)
- `tests/unit/components/activity-feed.test.tsx` - **CREATED** Unit tests for activity feed (20/20 passing)
- `tests/unit/components/guild-master-manager.test.tsx` - **CREATED** Unit tests for guild master manager (27/27 passing)
- `tests/unit/components/family-settings.test.tsx` - **CREATED** Unit tests for family settings (32/32 passing)
- `tests/unit/components/admin-dashboard.test.tsx` - **CREATED** Unit tests for admin dashboard (31/31 passing)
- `tests/e2e/admin-dashboard-access.spec.ts` - E2E tests for access control
- `tests/e2e/admin-dashboard-tabs.spec.ts` - E2E tests for tab navigation
- `tests/e2e/admin-statistics.spec.ts` - E2E tests for statistics display
- `tests/e2e/admin-activity-feed.spec.ts` - E2E tests for activity feed
- `tests/e2e/admin-guild-masters.spec.ts` - E2E tests for role management

### Existing Files to Modify
- `app/dashboard/page.tsx` - Add admin navigation button for Guild Masters
- `components/quest-template-manager.tsx` - May need to extract for reuse in admin dashboard
- `components/reward-manager.tsx` - May need to extract for reuse in admin dashboard
- `lib/realtime-context.tsx` - May need to extend for additional realtime event types
- `lib/auth-context.tsx` - Reference for role-based access patterns

### Notes
- Unit tests should be placed in `tests/unit/` mirroring the source file structure
- E2E tests should be placed in `tests/e2e/` with descriptive spec names
- Use `npm run test` to run unit tests, `npx playwright test` for E2E tests
- Follow existing patterns from `QuestTemplateManager` and `RewardManager` for component structure
- Leverage existing `useAuth()` hook for role-based access control
- Use `@headlessui/react` Tab components for accessible tabbed interface

## Tasks

- [x] 1.0 Create Admin Dashboard Route and Layout Infrastructure
  - [x] 1.1 Create `app/admin/page.tsx` with role-based access guard (redirect non-Guild Masters to dashboard)
  - [x] 1.2 Create `components/admin-dashboard.tsx` with @headlessui/react Tab component structure
  - [x] 1.3 Set up tab state management with URL query params (e.g., `?tab=overview`)
  - [x] 1.4 Create tab panel placeholders for: Overview, Quest Templates, Rewards, Guild Masters, Family Settings
  - [x] 1.5 Add loading states and error boundaries to admin dashboard
  - [x] 1.6 Ensure mobile-responsive tab navigation (horizontal scroll on mobile)

- [x] 2.0 Implement Family Statistics Service and Overview Tab
  - [x] 2.1 Create `lib/statistics-service.ts` with method to calculate family statistics
  - [x] 2.2 Implement `getFamilyStatistics(familyId: string)` returning all 7 statistics from PRD
  - [x] 2.3 Optimize queries to avoid N+1 problems and heavy database operations
  - [x] 2.4 Create `components/statistics-panel.tsx` with card-based layout for statistics
  - [x] 2.5 Display: total quests completed (week/month), total gold/XP, character progress, completion rates
  - [x] 2.6 Display: most active member, pending approvals count, redemption statistics
  - [x] 2.7 Integrate statistics panel into Overview tab of admin dashboard
  - [x] 2.8 Add real-time updates to statistics when quest/reward data changes
  - [x] 2.9 Add loading skeletons and empty states for statistics cards

- [x] 3.0 Implement Activity Feed Service and Component
  - [x] 3.1 Create `lib/activity-service.ts` for fetching family activity events
  - [x] 3.2 Implement `getRecentActivity(familyId: string, limit: number)` method
  - [x] 3.3 Query and aggregate events from quest_instances, reward_redemptions, characters tables
  - [x] 3.4 Create `components/activity-feed.tsx` with scrollable event list
  - [x] 3.5 Display events: quest completions, reward redemptions, level-ups, pending approvals
  - [x] 3.6 Add relative timestamps (e.g., "5 minutes ago") using date-fns or similar
  - [x] 3.7 Implement quick action buttons for pending approvals in activity feed
  - [x] 3.8 Add real-time subscription to receive new events without page refresh
  - [x] 3.9 Integrate activity feed into Overview tab below statistics panel
  - [x] 3.10 Add manual refresh button and auto-scroll to new events
  - [x] 3.11 Limit feed to last 50 events for performance

- [x] 4.0 Build Guild Master Management Tab
  - [x] 4.1 Create `components/guild-master-manager.tsx` component
  - [x] 4.2 Fetch and display all family members with display name, character name, and role
  - [x] 4.3 Add "Promote" button for Heroes to promote to Guild Master
  - [x] 4.4 Add "Demote" button for Guild Masters to demote to Hero
  - [x] 4.5 Implement confirmation modal for promote/demote actions
  - [x] 4.6 Call existing `/api/users/[userId]/promote` and `/demote` endpoints
  - [x] 4.7 Prevent demotion of last Guild Master with warning message
  - [x] 4.8 Add real-time updates when roles change (subscribe to users table)
  - [x] 4.9 Integrate Guild Master Manager into admin dashboard Guild Masters tab
  - [x] 4.10 Add loading and error states for role management actions

- [x] 5.0 Build Family Settings Tab
  - [x] 5.1 Create `lib/family-service.ts` for family-related operations
  - [x] 5.2 Implement `getFamilyInfo(familyId: string)` to fetch family name, invite code, members
  - [x] 5.3 Implement `regenerateInviteCode(familyId: string)` method
  - [x] 5.4 Create `components/family-settings.tsx` component
  - [x] 5.5 Display family name and current invite code
  - [x] 5.6 Add "Copy Invite Code" button with clipboard API integration
  - [x] 5.7 Add "Regenerate Invite Code" button with confirmation modal
  - [x] 5.8 Display list of all family members with join dates
  - [x] 5.9 Integrate Family Settings into admin dashboard Family Settings tab
  - [x] 5.10 Add success notifications for copy and regenerate actions

- [x] 6.0 Add Admin Navigation Button and Access Control
  - [x] 6.1 Modify `app/dashboard/page.tsx` to add admin button in header/navbar
  - [x] 6.2 Show admin button only if current user has Guild Master role
  - [x] 6.3 Add admin button with appropriate icon (e.g., Settings, Shield) and label
  - [x] 6.4 Link admin button to `/app/admin` route
  - [x] 6.5 Add hover and active states for admin button
  - [x] 6.6 Ensure admin button is responsive and visible on mobile

- [x] 7.0 Unit Testing for Services and Components
  - [x] 7.1 Write tests for `lib/statistics-service.ts` (test all statistics calculations) - 10/10 tests passing
  - [x] 7.2 Write tests for `lib/activity-service.ts` (test event fetching and aggregation) - 15/15 tests passing
  - [x] 7.3 Write tests for `lib/family-service.ts` (test family info and invite code operations) - 14/14 tests passing
  - [x] 7.4 Write tests for `components/statistics-panel.tsx` (test rendering and real-time updates) - 11/11 tests passing
  - [x] 7.5 Write tests for `components/activity-feed.tsx` (test event display and quick actions) - 20/20 tests passing
  - [x] 7.6 Write tests for `components/guild-master-manager.tsx` (test role management UI) - 27/27 tests passing
  - [x] 7.7 Write tests for `components/family-settings.tsx` (test settings display and actions) - 32/32 tests passing
  - [x] 7.8 Write tests for `components/admin-dashboard.tsx` (test tab navigation and access control) - 31/31 tests passing
  - [x] 7.9 Run `npm run test` and ensure all unit tests pass with good coverage - ✅ 259/259 tests passing (17 suites)

- [ ] 8.0 E2E Testing (Manual/Separate Session)
  - [ ] 8.1 Create `tests/e2e/admin-dashboard-access.spec.ts` - Test Guild Masters can access, Heroes cannot
  - [ ] 8.2 Create `tests/e2e/admin-dashboard-tabs.spec.ts` - Test tab navigation and URL persistence
  - [ ] 8.3 Create `tests/e2e/admin-statistics.spec.ts` - Test statistics display and real-time updates
  - [ ] 8.4 Create `tests/e2e/admin-activity-feed.spec.ts` - Test activity feed events and quick actions
  - [ ] 8.5 Create `tests/e2e/admin-guild-masters.spec.ts` - Test promote/demote workflow
  - [ ] 8.6 Test Quest Templates tab integration (ensure existing QuestTemplateManager works)
  - [ ] 8.7 Test Rewards tab integration (ensure existing RewardManager works)
  - [ ] 8.8 Test Family Settings tab (invite code copy, regenerate)
  - [ ] 8.9 Run `npx playwright test` and ensure all E2E tests pass
  - [ ] 8.10 Note: E2E testing will be done manually or in a separate session per user request

- [ ] 9.0 Mobile Responsiveness Testing and Quality Assurance
  - [ ] 9.1 Test admin dashboard on mobile viewport (responsive tabs, stacked cards)
  - [ ] 9.2 Verify all buttons and interactive elements meet 44x44px touch target size
  - [ ] 9.3 Test tab navigation on mobile (horizontal scroll or dropdown)
  - [ ] 9.4 Test statistics cards stack vertically on mobile
  - [ ] 9.5 Test activity feed is scrollable and touch-friendly on mobile
  - [ ] 9.6 Test modals and forms are mobile-optimized
  - [ ] 9.7 Run quality gates: `npm run build` (zero errors)
  - [ ] 9.8 Run quality gates: `npm run lint` (zero warnings)
  - [ ] 9.9 Run quality gates: `npm run test` (all tests pass)
  - [ ] 9.10 Manual testing: Complete walkthrough of all admin dashboard features
  - [ ] 9.11 Performance testing: Verify dashboard loads in under 2 seconds

---

**Status**: Task list complete and ready for implementation.

