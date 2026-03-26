# Testing Checklist - Feature/140-Family-Achievements + Develop Branch Features

## Overview

This checklist covers:

- **Achievement System** (from develop branch)
- **Family Achievements** (from current feature/140-family-achievements branch)

---

## Part 1: Core Achievement System

### 1.1 Achievement Database & Schema

- [ ] Verify achievement tables created successfully in migration
- [ ] Check that achievement_definitions table exists with correct columns
- [ ] Verify achievement_progress table exists with correct structure
- [ ] Confirm foreign key relationships are properly established
- [ ] Test database constraints (NOT NULL fields, unique constraints)

### 1.2 Achievement Display & Rendering

- [ ] View achievement list on player dashboard
- [ ] Verify achievement badges display correctly
- [ ] Check that locked achievements show "Locked" state
- [ ] Verify unlocked achievements display completion percentage
- [ ] Check achievement descriptions render properly (no text overflow)
- [ ] Test achievement grid layout on mobile/tablet/desktop
- [ ] Verify achievement icons/images load and display correctly

### 1.3 Achievement Progress Tracking

- [ ] Complete a quest and verify achievement progress updates
- [ ] Check that progress persists across page refreshes
- [ ] Verify progress increments correctly for multi-step achievements
- [ ] Test that progress is recalculated on character progression
- [ ] Confirm progress is tracked per family (not per character if family-scoped)

### 1.4 Achievement Categories & Organization

- [ ] View achievements grouped by category
- [ ] Filter achievements by category
- [ ] Verify hidden achievements don't appear in lists (when locked)
- [ ] Check that category names/icons display correctly
- [ ] Test that achievements can be sorted by completion status

### 1.5 Achievement Unlock Evaluation

- [ ] Complete criteria for an achievement and verify it unlocks
- [ ] Test multiple criteria types (quests completed, XP earned, etc.)
- [ ] Verify unlock notifications appear when achievement unlocks
- [ ] Check that already-unlocked achievements don't re-unlock
- [ ] Test edge cases (criteria with thresholds, date-based criteria)

### 1.6 Achievement Notifications

- [ ] Verify notification appears when achievement unlocks
- [ ] Check notification content displays correctly
- [ ] Test notification dismissal
- [ ] Verify notifications appear in notification center
- [ ] Check that family members see appropriate notifications
- [ ] Test notification doesn't spam when same achievement progresses

### 1.7 Hidden Achievements

- [ ] Verify hidden achievements don't show in list while locked
- [ ] Check that unlocked hidden achievements appear with full details
- [ ] Test that hidden achievement criteria isn't visible when locked
- [ ] Verify completion counter includes hidden achievements
- [ ] Check RLS prevents unauthorized access to hidden achievement details

---

## Part 2: Family Achievements System

### 2.1 Family Achievement Display

- [ ] View family achievements tab/section on dashboard
- [ ] Verify family achievements display for all family members
- [ ] Check that family achievements show member-specific progress
- [ ] Verify character-less members appear in family achievements
- [ ] Test that achievements hide for members without a character (if applicable)
- [ ] Check layout doesn't break with many members

### 2.2 Family Achievement Progress Tracking

- [ ] Complete a family quest and verify family achievement progress updates
- [ ] Check that progress is tracked across all family members
- [ ] Verify that all eligible family members' actions count toward progress
- [ ] Test progress calculation with different evaluation modes:
  - [ ] All-members mode (all must complete)
  - [ ] Any-member mode (any one member completes)
  - [ ] Sum-based mode (count total across members)
- [ ] Verify progress persists when family roster changes

### 2.3 Family Achievement Criteria Evaluation

- [ ] Test criteria based on individual member progress
- [ ] Test criteria based on all-family metrics
- [ ] Verify member count calculation (including/excluding characterless members)
- [ ] Test custom JSON criteria validation
- [ ] Check that invalid criteria are rejected with clear errors

### 2.4 Family Achievement Unlock & Notifications

- [ ] Unlock a family achievement and verify all eligible members get notified
- [ ] Check notification shows which family achievement unlocked
- [ ] Verify that characterless members get appropriate notifications
- [ ] Test that catch-up notifications work for members who join family later
- [ ] Check that notifications don't appear for locked hidden achievements
- [ ] Verify members can see notification history

### 2.5 Family Achievement Progress on Roster Changes

- [ ] Add a new member to family and verify achievement progress updates
- [ ] Remove a member and verify progress recalculates
- [ ] Switch character within same family and verify progress maintains
- [ ] Test progress when member switches to different family
- [ ] Verify characterless member actions trigger progress updates
- [ ] Test that roster snapshot is captured and maintained

### 2.6 Family Achievement Admin Panel

- [ ] Create a new family achievement from admin panel
- [ ] Edit existing family achievement criteria
- [ ] Test setting achievement as hidden
- [ ] Test setting achievement as locked/unlocked from admin
- [ ] Verify backfill functionality works for newly created achievements
- [ ] Check that XP/gold rewards are configured correctly
- [ ] Test delete functionality for achievements
- [ ] Verify all form validations work (empty fields, invalid criteria, etc.)

### 2.7 Family Achievement Rewards

- [ ] Unlock a family achievement with XP reward
- [ ] Verify XP is distributed to family members correctly
- [ ] Test gold reward distribution
- [ ] Check that disabled/invalid criteria don't trigger false rewards
- [ ] Verify reward history is tracked

### 2.8 Family Achievement Edge Cases & RLS

- [ ] Verify users can only see achievements for their family
- [ ] Test that non-members cannot see family achievements
- [ ] Check that locked hidden achievements' progress is hidden from non-admins
- [ ] Verify that Guild Masters can see all family achievements
- [ ] Test that character switching doesn't expose cross-family achievements
- [ ] Verify RLS prevents unauthorized updates to achievements

### 2.9 Family Achievement Backfill & Recompute

- [ ] Trigger backfill for achievements with legacy progress
- [ ] Verify recompute correctly updates progress for all members
- [ ] Test that backfill handles missing roster snapshots
- [ ] Check that recompute failures are logged/reported
- [ ] Verify error states don't prevent page loading (fail-closed)

### 2.10 Family Achievement Mobile Responsiveness

- [ ] View family achievements on mobile device
- [ ] Test that member list displays properly on mobile
- [ ] Verify progress bars are readable on small screens
- [ ] Check that achievement cards stack correctly
- [ ] Test touch interaction for notifications and actions

---

## Part 3: Integration Testing

### 3.1 Achievement System Integration

- [ ] Complete a quest → achievement progress updates → achievement unlocks
- [ ] Character gains XP → achievement progress updates
- [ ] Member completes activity → family achievement progress updates
- [ ] Family roster changes → all achievements recompute

### 3.2 Real-time Updates

- [ ] Open achievement page on two devices simultaneously
- [ ] Complete achievement on one device → see update on other device
- [ ] Unlock family achievement → all members see notification
- [ ] Admin updates achievement → players see changes in real-time

### 3.3 Cross-Feature Integration

- [ ] Verify achievement notifications don't conflict with quest notifications
- [ ] Test that reward redemption doesn't interfere with achievement XP
- [ ] Check that character switching updates all relevant achievements
- [ ] Verify leaderboard updates when achievements unlock

---

## Part 4: Browser & Device Testing

### 4.1 Desktop Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### 4.2 Mobile Browsers

- [ ] Chrome mobile (iOS)
- [ ] Safari mobile (iOS)
- [ ] Chrome mobile (Android)
- [ ] Firefox mobile (Android)

### 4.3 Responsive Breakpoints

- [ ] Mobile (< 640px)
- [ ] Tablet (640px - 1024px)
- [ ] Desktop (> 1024px)

---

## Part 5: Performance Testing

### 5.1 Load Testing

- [ ] Load family dashboard with 100+ achievements
- [ ] Verify page load time is acceptable (< 2s)
- [ ] Check that achievement grid doesn't cause layout thrashing
- [ ] Test rendering performance with many family members

### 5.2 Database Performance

- [ ] Verify family achievement queries use proper indexes
- [ ] Check that progress recalculation doesn't timeout
- [ ] Test database performance with large achievement datasets

---

## Part 6: Error Handling & Edge Cases

### 6.1 Error Scenarios

- [ ] Network error during achievement unlock → verify error handling
- [ ] Missing achievement image → verify fallback/placeholder
- [ ] Invalid criteria JSON → verify error message and fail-closed
- [ ] Database constraint violation → verify graceful error
- [ ] RLS policy rejection → verify user-friendly error (no 500)

### 6.2 Edge Cases

- [ ] Family with 0 members → achievement behavior
- [ ] Family with 100+ members → performance and display
- [ ] Achievement with 0% progress → display correctly
- [ ] Achievement with 100% progress → show as unlocked
- [ ] Switching families frequently → progress accuracy
- [ ] Character deletion → progress cleanup and updates

---

## Verification Checklist Before Merging

- [ ] All tests pass: `npm run test`
- [ ] No TypeScript errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] All checkboxes above marked complete
- [ ] No critical bugs found
- [ ] Performance acceptable on mobile
- [ ] RLS properly restricts unauthorized access
- [ ] Notifications working correctly
- [ ] Real-time updates functional
- [ ] Mobile responsiveness verified
