# PRD: Multi-Guild Master System

## Introduction/Overview

ChoreQuest currently supports a single Guild Master (parent/admin) per family. This limitation prevents two-parent households from sharing administrative responsibilities and creates bottlenecks when one parent needs to manage quests, rewards, and approvals alone.

The Multi-Guild Master System enables multiple family members to have Guild Master privileges, allowing co-parents to share the workload of managing the family's ChoreQuest experience. All Guild Masters will have equal permissions to create quests, approve completions, manage rewards, and promote/demote other family members.

**Problem**: Single-admin model creates bottlenecks and doesn't reflect modern co-parenting dynamics where both parents want equal control.

**Solution**: Enable multiple Guild Masters per family with identical permissions and safeguards to prevent administrative lockout.

## Goals

1. **Enable Co-Administration**: Allow multiple family members to have Guild Master (admin) privileges simultaneously
2. **Equal Authority**: All Guild Masters have identical permissions—no hierarchy or permission tiers
3. **Prevent Admin Lockout**: Implement safeguards that prevent demoting the last Guild Master, ensuring families always have at least one admin
4. **Prevent Self-Demotion**: Guild Masters cannot demote themselves, simplifying the UI and preventing accidental lockouts
5. **Seamless Role Management**: Provide intuitive UI for promoting Heroes to Guild Masters and demoting Guild Masters to Heroes
6. **Maintain Data Integrity**: Update all API role checks to support multiple Guild Masters without breaking existing functionality
7. **Visual Clarity**: Display role badges throughout the app so family members understand who has admin privileges

## User Stories

### Story 1: Co-Parent Promotion
**As a** Guild Master in a two-parent household
**I want to** promote my spouse to Guild Master
**So that** we can both manage quests and rewards without needing to share a single account

### Story 2: Shared Quest Management
**As a** newly promoted Guild Master
**I want to** see and use all quest template and reward management features
**So that** I can create and approve quests when my co-parent is unavailable

### Story 3: Role Visibility
**As a** family member (Hero)
**I want to** see role badges on all family members in the UI
**So that** I know which parents can approve my quest completions

### Story 4: Demotion Protection
**As a** Guild Master attempting to demote the last remaining GM
**I want to** receive a clear error message preventing the action
**So that** I understand the family needs at least one admin and don't accidentally lock everyone out

### Story 5: Balanced Workload
**As a** co-parent with GM privileges
**I want to** alternate quest approval duties with my spouse
**So that** we can balance the administrative workload fairly

### Story 6: No Self-Demotion
**As a** Guild Master viewing the Family Management page
**I want to** NOT see a demote button next to my own name
**So that** I cannot accidentally remove my own admin privileges

## Functional Requirements

### Backend Requirements

#### FR1: Database & Schema
1.1. The `users` table already has a `role` field (enum: 'guild_master', 'hero', 'young_hero')
1.2. No schema migration required—existing structure supports multiple Guild Masters
1.3. RLS policies must be updated to check `role = 'guild_master'` instead of assuming single admin

#### FR2: User Promotion Endpoint
2.1. Create `POST /api/users/:userId/promote` endpoint
2.2. Endpoint must verify requesting user has `role = 'guild_master'`
2.3. Endpoint must verify target user is in the same family
2.4. Endpoint must update target user's role from 'hero' to 'guild_master'
2.5. Endpoint must return updated user object with new role
2.6. Endpoint must return 403 if requester is not a Guild Master
2.7. Endpoint must return 400 if target user is already a Guild Master

#### FR3: User Demotion Endpoint
3.1. Create `POST /api/users/:userId/demote` endpoint
3.2. Endpoint must verify requesting user has `role = 'guild_master'`
3.3. Endpoint must verify target user is in the same family
3.4. Endpoint must return 400 error "Cannot demote yourself" if requester is demoting themselves
3.5. Endpoint must count Guild Masters in the family before demotion
3.6. Endpoint must return 400 error "Cannot demote the last Guild Master" if count would reach zero
3.7. Endpoint must update target user's role from 'guild_master' to 'hero' (if allowed)
3.8. Endpoint must return updated user object with new role
3.9. Endpoint must return 403 if requester is not a Guild Master

#### FR4: API Role Check Updates
4.1. Update all quest template endpoints to check `role = 'guild_master'` (not specific user ID)
4.2. Update all quest instance approval endpoints to check `role = 'guild_master'`
4.3. Update all reward management endpoints to check `role = 'guild_master'`
4.4. Update all reward redemption approval endpoints to check `role = 'guild_master'`
4.5. Ensure realtime subscriptions work for all Guild Masters, not just family creator

#### FR5: Get Family Members Endpoint Enhancement
5.1. Update `GET /api/families/:familyId/members` to return all users with their roles
5.2. Response must include `role` field for each user
5.3. Endpoint must sort users by role (Guild Masters first, then Heroes, then Young Heroes)

### Frontend Requirements

#### FR6: Guild Master Management UI
6.1. Add new "Family Management" tab to the Guild Master dashboard
6.2. Tab must display list of all family members with their current roles
6.3. Tab must show role badge next to each family member's name
6.4. Tab must display "Promote to Guild Master" button next to Heroes
6.5. Tab must display "Demote to Hero" button next to Guild Masters (except for the current user)
6.6. Tab must NOT display demote button next to the current user's name
6.7. Tab must be accessible only to users with `role = 'guild_master'`

#### FR7: Promotion Flow
7.1. Clicking "Promote to Guild Master" must show confirmation modal
7.2. Modal must explain that the user will gain full admin privileges
7.3. Modal must have "Cancel" and "Confirm Promotion" buttons
7.4. On confirmation, call `POST /api/users/:userId/promote`
7.5. On success, update UI to show new Guild Master badge
7.6. On error, display error message in toast/alert

#### FR8: Demotion Flow
8.1. Clicking "Demote to Hero" must show confirmation modal
8.2. Modal must explain that the user will lose admin privileges
8.3. Modal must have "Cancel" and "Confirm Demotion" buttons
8.4. On confirmation, call `POST /api/users/:userId/demote`
8.5. On success, update UI to show Hero badge
8.6. On error (e.g., last GM), display clear error message: "Cannot demote the last Guild Master. Promote another family member first."
8.7. The demote button must never appear for the current user (enforced in UI)

#### FR9: Role Badges Throughout App
9.1. Display role badge next to user names in family member lists
9.2. Display role badge in quest approval interfaces
9.3. Display role badge in reward redemption approval interfaces
9.4. Badge must be visually distinct (e.g., crown icon for GM, shield for Hero)
9.5. Badge must have tooltip explaining role on hover

#### FR10: Realtime Updates
10.1. When a user is promoted/demoted, broadcast role change via realtime subscription
10.2. All connected clients in the family must update role badges in real-time
10.3. If the current user is promoted, refresh their permissions/UI immediately
10.4. If the current user is demoted, redirect them away from GM-only pages

## Non-Goals (Out of Scope)

1. **Permission Tiers**: All Guild Masters have identical permissions. No "primary GM" or configurable permission levels.
2. **Notifications**: No email or push notifications for role changes—users will see changes reflected in the UI.
3. **Audit Logging**: No detailed logs of who promoted/demoted whom (may be added in future release).
4. **Role History**: No tracking of previous roles or role change history.
5. **Young Hero Promotion**: Young Heroes cannot be promoted directly to Guild Master—they must be promoted to Hero first (if that feature exists).
6. **Family Deletion Protection**: This feature does not add restrictions on which GM can delete the family.
7. **External User Roles**: No integration with external systems or OAuth roles.
8. **Self-Demotion**: Guild Masters cannot demote themselves—they can only demote other Guild Masters.

## Design Considerations

### UI Components

**Family Management Tab**:
- Simple table/list layout with three columns: Name, Role Badge, Actions
- Role badges use existing design system icons (crown for GM, shield for Hero)
- Action buttons styled as secondary buttons with hover states
- Confirmation modals match existing modal design patterns
- Current user's row has no demote button (only shows their badge)

**Role Badges**:
- Small icon-based badges (16x16px or similar)
- Placed inline next to user names
- Use consistent positioning across all pages
- Tooltip appears on hover with role name

### UX Flow

**Promotion Flow**:
```
1. GM clicks "Promote to Guild Master" on Hero
2. Confirmation modal appears
3. GM clicks "Confirm Promotion"
4. API call executes
5. Success: Badge updates, toast notification "John promoted to Guild Master"
6. Error: Error message displays in modal
```

**Demotion Flow with Safeguard**:
```
1. GM clicks "Demote to Hero" on another GM (button not shown for self)
2. Confirmation modal appears
3. GM clicks "Confirm Demotion"
4. API checks if target is last GM
5a. If last GM: Error message "Cannot demote the last Guild Master. Promote another family member first."
5b. If not last GM: Success, badge updates
```

**Self-Demotion Prevention**:
```
1. GM views Family Management tab
2. Their own row shows badge but NO action button
3. Impossible to demote self via UI
4. API has backup check (returns 400) if attempted programmatically
```

## Technical Considerations

### Dependencies
- Existing Supabase RLS policies for `users` table
- Existing realtime subscription system for user updates
- Existing role-based middleware/guards in API routes

### Implementation Notes
1. **RLS Policy Updates**: Review and update all RLS policies that check for admin privileges to use `role = 'guild_master'` instead of specific user IDs
2. **Realtime Events**: Use existing `onUserUpdate` handler in realtime context to propagate role changes
3. **Middleware**: Update any `requireGuildMaster` middleware to check role field, not user ID comparison
4. **UI Logic**: Compare `user.id` with current session user ID to hide demote button for self
5. **Defense in Depth**: Both frontend (hide button) and backend (reject request) prevent self-demotion

### Database Query Example
```typescript
// Count Guild Masters in family before demotion
const gmCount = await supabase
  .from('users')
  .select('id', { count: 'exact' })
  .eq('family_id', familyId)
  .eq('role', 'guild_master');

if (gmCount.count <= 1) {
  throw new Error('Cannot demote the last Guild Master');
}

// Check for self-demotion attempt
if (requestingUserId === targetUserId) {
  throw new Error('Cannot demote yourself');
}
```

## Success Metrics

1. **Feature Adoption**: 40%+ of families promote a second Guild Master within 30 days of release
2. **Co-Admin Usage**: Both GMs in multi-GM families actively use quest/reward management features (measured by API calls)
3. **Error Rate**: Zero "admin lockout" incidents (families with no Guild Masters) in production
4. **Self-Demotion Attempts**: Zero successful self-demotion events (tracked as security metric)
5. **User Satisfaction**: Positive feedback from co-parenting users in feedback surveys
6. **API Performance**: Promotion/demotion endpoints respond within 200ms p95

## Open Questions

1. **Should we limit the maximum number of Guild Masters per family?** (e.g., max 2 or 3)
   - Current answer: No limit for now, but can revisit if abuse occurs

2. **Should we show a "Family Roles" summary on the main dashboard?**
   - Current answer: Not in v1, but consider for future iteration

3. **What happens if a GM leaves the family and they're the last GM?**
   - Current answer: Out of scope for this PRD—requires separate "Leave Family" feature design

4. **Should we track who promoted/demoted whom for accountability?**
   - Current answer: No audit logging in v1, but valuable for future iteration

5. **Should there be any rate limiting on promotion/demotion actions?**
   - Current answer: Use standard API rate limiting, no special restrictions

6. **If a GM wants to step down, how do they do it?**
   - Current answer: They ask another GM to demote them. This enforces accountability.

---

**Document Version**: 1.1
**Created**: 2025-10-02
**Last Updated**: 2025-10-02
**Status**: Draft - Ready for Review
**Changelog**:
- v1.1: Removed self-demotion capability, hide demote button for current user
- v1.0: Initial draft
