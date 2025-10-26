# PRD: Family Quest Abandonment and GM Visibility Fix

## Introduction/Overview

Currently, when a GM denies a family quest completion, the quest enters an unmanageable state with two critical problems:

1. **Heroes cannot abandon family quests**: The "Abandon Quest" button is missing from claimed/pending family quests, leaving heroes with no way to release quests they've claimed
2. **GMs lose visibility and control**: When a quest moves to PENDING status after denial, it disappears entirely from the GM quest management dashboard

This creates a dead-end scenario where quests become stuck in the system with neither heroes nor GMs able to manage them effectively.

**Problem Statement**: Family quests that are denied by the GM become invisible to the GM and unreleasable by the hero, requiring manual database intervention to resolve.

**Goal**: Restore full lifecycle management for family quests by enabling heroes to abandon claimed quests and ensuring GMs maintain visibility and control over all quest states.

## Goals

1. Enable heroes to abandon family quests they have claimed (PENDING, CLAIMED, or IN_PROGRESS states)
2. Maintain GM visibility of all family quests regardless of status, especially after denial
3. Provide GMs with full management capabilities (force-release, reassign, delete) for denied quests
4. Ensure quest state transitions are logical and traceable throughout the workflow
5. Prevent quest orphaning or unmanageable states in the system

## User Stories

### Hero Stories
- **As a hero**, I want to abandon a family quest I've claimed so that I can release it back to the family pool if I can't complete it
- **As a hero**, I want to abandon a quest that was denied by the GM so that I can free it up for someone else to attempt
- **As a hero**, I want to abandon an in-progress quest so that I can switch to a different quest if my plans change

### GM Stories
- **As a GM**, I want to see all family quests including denied ones so that I can maintain full visibility of quest workflow
- **As a GM**, I want to force-release a denied quest back to AVAILABLE so that other heroes can claim it
- **As a GM**, I want to reassign a denied quest to a specific hero so that I can direct quest completion
- **As a GM**, I want to delete a denied quest so that I can remove quests that are no longer relevant

## Functional Requirements

### Part 1: Hero Abandon Button

1. The system MUST display an "Abandon Quest" button for family quests in PENDING, CLAIMED, or IN_PROGRESS status when viewed by a hero
2. The "Abandon Quest" button MUST NOT appear for individual (non-FAMILY) quests
3. The "Abandon Quest" button MUST NOT appear in GM view of quests
4. When a hero clicks "Abandon Quest", the system MUST immediately return the quest to AVAILABLE status without confirmation dialog
5. When a quest is abandoned, the system MUST clear the `assigned_to_id` and `volunteered_by` fields
6. When a quest is abandoned, the system MUST remove any volunteer bonus that was applied
7. The `getButtonVisibility()` helper function MUST include a `canAbandon` property in its return object
8. The `canAbandon` property MUST be `true` when: quest type is FAMILY AND status is PENDING/CLAIMED/IN_PROGRESS AND user is a hero (not GM)
9. The QuestCard component MUST use `buttonVis.canAbandon` instead of the current hardcoded `!quest.assigned_to_id` check

### Part 2: GM Dashboard Visibility

10. The `filterInProgressQuests()` function MUST include PENDING quests that have an `assigned_to_id`
11. PENDING family quests MUST remain visible in the GM "In Progress" section after denial
12. The GM dashboard MUST display the quest title, assigned hero name, and current status for all PENDING quests
13. The GM MUST be able to force-release a PENDING quest back to AVAILABLE status from the dashboard
14. The GM MUST be able to reassign a PENDING quest to a different hero from the dashboard
15. The GM MUST be able to delete a PENDING quest entirely from the dashboard
16. Quest status changes MUST be properly tracked and logged throughout all state transitions

### Part 3: Anti-Hoarding Rule

17. The system MUST prevent a hero from claiming a new family quest if they already have ANY family quest in PENDING, CLAIMED, or IN_PROGRESS status
18. The anti-hoarding check MUST only apply to FAMILY type quests, not individual quests
19. When anti-hoarding is triggered, the system MUST display a clear error message: "You already have an active family quest. Please complete or abandon it before claiming another."

## Non-Goals (Out of Scope)

1. **Confirmation dialogs for abandonment** - Per requirements, abandonment is immediate without confirmation
2. **Notification system** - No toast notifications or badges when quests are denied; heroes will see status changes in their dashboard
3. **Special visual indicators for denied quests** - Existing quest card UI/status indicators are sufficient
4. **Audit trail/history** - Quest state change logging is mentioned but full audit history is not part of this fix
5. **Email notifications** - Not part of this feature
6. **Configurable limits** - Anti-hoarding is fixed at 1 active family quest, not configurable
7. **Re-approval workflow** - GMs cannot undo a denial and re-approve; quest must be resubmitted

## Design Considerations

### Quest Card Button Visibility
- Leverage existing `getButtonVisibility()` helper pattern for consistency
- Add `canAbandon` flag to centralize abandon button logic
- Ensure button visibility respects both quest type (FAMILY) and user role (hero vs GM)

### GM Dashboard Sections
- Keep PENDING quests in existing "In Progress" section (no new sections needed)
- PENDING quests should appear alongside CLAIMED and IN_PROGRESS quests
- Ensure filtering logic is inclusive of all active quest states

### Status Flow
```
AVAILABLE → [hero claims] → CLAIMED → [hero starts] → IN_PROGRESS → [hero completes] → COMPLETED
                                                                                           ↓
                                                                               [GM denies] → PENDING
                                                                                           ↓
                                                                        [hero abandons OR GM force-releases] → AVAILABLE
```

## Technical Considerations

### Files to Modify
1. **`/components/quests/quest-card/quest-card-helpers.ts`**
   - Add `canAbandon` property to `getButtonVisibility()` return object (lines 14-26)
   - Implement logic: `canAbandon = !isGmView && quest.type === 'FAMILY' && ['PENDING', 'CLAIMED', 'IN_PROGRESS'].includes(quest.status)`

2. **`/components/quests/quest-card/index.tsx`**
   - Replace hardcoded abandon visibility check at line 176: `!quest.assigned_to_id`
   - Use `buttonVis.canAbandon` from helper instead

3. **`/components/quests/quest-dashboard/quest-helpers.ts`**
   - Update `filterInProgressQuests()` function (lines 198-206)
   - Current filter: `assigned_to_id && (IN_PROGRESS || CLAIMED)`
   - New filter: `assigned_to_id && (IN_PROGRESS || CLAIMED || PENDING)`

4. **`/app/api/quest-instances/[id]/deny/route.ts`**
   - Verify that PENDING status is set correctly on denial
   - Ensure `assigned_to_id` and `volunteered_by` are preserved (not cleared)

5. **Quest abandonment API**
   - Verify existing abandon endpoint properly clears `assigned_to_id`, `volunteered_by`, and volunteer bonus
   - Ensure status transitions to AVAILABLE

### Database Schema
- No schema changes required
- Existing fields support this workflow:
  - `status` (PENDING, CLAIMED, IN_PROGRESS, COMPLETED, AVAILABLE)
  - `assigned_to_id` (hero assigned to quest)
  - `volunteered_by` (hero who volunteered/claimed quest)
  - `type` (FAMILY vs individual)

### Anti-Hoarding Implementation
- Add validation in quest claim API endpoint
- Check: `SELECT COUNT(*) FROM quest_instances WHERE assigned_to_id = :hero_id AND type = 'FAMILY' AND status IN ('PENDING', 'CLAIMED', 'IN_PROGRESS')`
- If count > 0, reject claim with error message

## Success Metrics

1. **Zero orphaned quests**: No family quests stuck in unmanageable states requiring database intervention
2. **GM visibility maintained**: 100% of denied quests remain visible in GM dashboard
3. **Hero self-service**: Heroes can abandon quests without GM intervention
4. **Quest completion rate**: Track whether abandonment feature impacts overall quest completion rates
5. **Support tickets reduced**: Decrease in support requests related to "stuck quests"

## Acceptance Criteria

### Part 1: Abandon Button Implementation
- [ ] "Abandon Quest" button appears on CLAIMED family quests in hero view
- [ ] "Abandon Quest" button appears on PENDING family quests in hero view (including denied quests)
- [ ] "Abandon Quest" button appears on IN_PROGRESS family quests in hero view
- [ ] "Abandon Quest" button does NOT appear for individual (non-FAMILY) quests
- [ ] "Abandon Quest" button does NOT appear in GM view
- [ ] Clicking "Abandon Quest" immediately returns quest to AVAILABLE status
- [ ] Abandoning a quest clears `assigned_to_id` and `volunteered_by` fields
- [ ] Abandoning a quest removes volunteer bonus
- [ ] `getButtonVisibility()` includes `canAbandon` property
- [ ] QuestCard uses `buttonVis.canAbandon` instead of hardcoded check

### Part 2: GM Dashboard Visibility
- [ ] `filterInProgressQuests()` includes PENDING quests with `assigned_to_id`
- [ ] PENDING family quests visible in GM "In Progress" section after denial
- [ ] GM can see quest title, assigned hero name, and current status for PENDING quests
- [ ] GM can force-release PENDING quest to AVAILABLE from dashboard
- [ ] GM can reassign PENDING quest to different hero from dashboard
- [ ] GM can delete PENDING quest from dashboard
- [ ] Quest properly tracked through all status changes

### Part 3: Anti-Hoarding
- [ ] Hero cannot claim new family quest if they have ANY family quest in PENDING/CLAIMED/IN_PROGRESS
- [ ] Anti-hoarding only applies to FAMILY type quests, not individual quests
- [ ] Clear error message displayed when anti-hoarding prevents claim
- [ ] Hero can claim new family quest after abandoning current one

### Integration Tests
- [ ] Hero claims AVAILABLE family quest → CLAIMED → Abandon → returns to AVAILABLE
- [ ] GM denies completed quest → PENDING → Hero abandons → returns to AVAILABLE
- [ ] GM denies completed quest → PENDING → GM force-releases → returns to AVAILABLE
- [ ] GM denies completed quest → PENDING → GM reassigns to different hero → status updates correctly
- [ ] Hero starts PENDING quest → IN_PROGRESS → Abandon → returns to AVAILABLE
- [ ] Individual quests (non-FAMILY) never show Abandon button in any status
- [ ] COMPLETED quest never shows Abandon button
- [ ] GM view never shows Abandon button regardless of quest type or status
- [ ] Hero with active family quest cannot claim second family quest
- [ ] Hero with no active family quest can claim family quest normally

## Open Questions

1. Should there be any analytics/tracking when a quest is abandoned vs completed? (e.g., abandon count, abandon reasons)
2. Should GMs receive any notification when a hero abandons a quest they were monitoring?
3. Should quest abandonment affect hero reputation/stats in any way?
4. When GM reassigns a PENDING quest, should the previous hero be notified?
5. Should there be a maximum number of times a single quest can be abandoned before requiring GM intervention?

## Related Context

- Claiming a family quest sets status to CLAIMED with 20% volunteer bonus
- GM assignment sets status to PENDING with NO volunteer bonus
- Denial reverts status to PENDING (quest was COMPLETED, now PENDING)
- Heroes should only have ONE active family quest at a time (anti-hoarding rule)
- Quest lifecycle: AVAILABLE → CLAIMED → IN_PROGRESS → COMPLETED → (denied) → PENDING → (abandoned/released) → AVAILABLE
