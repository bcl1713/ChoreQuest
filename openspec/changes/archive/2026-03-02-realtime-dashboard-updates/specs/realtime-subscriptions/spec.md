# Realtime Subscriptions for Dashboard Components Specification

## Purpose

Ensure all React components that display database information use realtime
subscriptions to automatically sync with Supabase changes. This restores live
updates for user stats, quest operations, rewards, family member changes, and
boss battles that were lost in the recent refactor.

## Requirements

## ADDED Requirements

### Requirement: Character Realtime Updates

The system SHALL display character-related data (XP, gold, level, class, honor,
gems) in real-time via `useRealtime()` context subscription only when changes
are confirmed in the database (no optimistic updates).

#### Scenario: Character XP gain updates dashboard after database confirmation

Given a user is viewing the dashboard with their character stats displayed
When the user completes a quest and receives XP rewards confirmed in database
Then the character's XP value updates on screen within 100ms with visual
feedback (glow/flash effect) indicating realtime sync

#### Scenario: Character gold changes appear in real-time after confirmation

Given a user is viewing the character panel with current gold balance displayed
When the user redeems a reward or receives gold confirmed in the database
Then the gold balance updates on screen within 100ms with visual feedback across
all open pages

#### Scenario: Level-up notifications trigger when XP threshold crossed in database

Given a user's character is about to level up
When the user's total XP crosses the level threshold (via database-confirmed
quest completion or other means)
Then a level-up notification/modal appears within 100ms on the user's dashboard
with visual effect indicating realtime update

### Requirement: Quest Instance Realtime Updates

The system SHALL propagate quest-related operations (creation, claiming,
completion, approval, denial) in real-time to all family members' dashboards.

#### Scenario: Quest creation visible to all family members immediately

Given a quest creator has created a new quest and submitted it
When any other family member is viewing the quest dashboard
Then the new quest appears in their quest list within 100ms without requiring
manual refresh

#### Scenario: Quest claiming updates assignment immediately

Given a hero claims an available quest
When the quest assigner is viewing the quest dashboard
Then the quest's assigned_to_id updates to the hero's ID within 100ms and shows
in the assigned queue

#### Scenario: Quest completion shows approval request immediately

Given a hero completes a claimed quest
When the quest approver is viewing their approval queue
Then the quest appears in the approval/pending queue within 100ms with
completion details

#### Scenario: Quest approval triggers reward overlay for assigned user

Given a quest approver approves a completed quest for user X
When user X is viewing the dashboard
Then an immediate overlay/notification appears showing quest rewards (XP, gold,
bonuses) within 100ms

#### Scenario: Quest denial updates quest status immediately

Given a quest approver denies a completed quest
When both the denier and the original quest creator are viewing related dashboards
Then the quest status changes to DENIED within 100ms and is removed from
approval queues

### Requirement: Reward Realtime Updates

Reward catalog and redemption changes SHALL update in real-time across the
family.

#### Scenario: New reward creation visible immediately in store

Given a guild master creates a new reward
When any family member is viewing the reward store
Then the new reward appears in the catalog within 100ms without refresh

#### Scenario: Reward redemption updates gold balance in real-time

Given a user redeems a reward from the store
When the transaction completes successfully
Then the user's gold balance decreases within 100ms on all open pages showing
the balance

#### Scenario: Redemption history updates immediately

Given a user redeems a reward
When viewing the redemption history/request queue
Then the new redemption appears in the history/approval queue within 100ms

#### Scenario: Reward deletion propagates to all viewers

Given a guild master deletes a reward from the catalog
When any family member is viewing the reward store
Then the reward is removed from all reward displays within 100ms

### Requirement: Family Member Realtime Updates

Family member profile changes and character updates SHALL be visible in
real-time across admin panels and family rosters.

#### Scenario: Role changes update immediately in guild master panel

Given a guild master changes another member's role (e.g., promotes to GM)
When any family member is viewing the guild master list
Then the member's role updates within 100ms across all open admin panels

#### Scenario: Character XP/level changes visible in statistics

Given a family member gains XP from quest completion
When viewing the family statistics or leaderboard
Then the member's XP and level are updated within 100ms and any level-ups are
reflected

#### Scenario: Family roster reflects new members immediately

Given a new user joins the family
When viewing the family roster or admin panels
Then the new member appears in the roster within 100ms

### Requirement: Boss Quest Realtime Updates

Boss quest lifecycle events and participant changes SHALL propagate in
real-time.

#### Scenario: Boss quest creation visible to all family members

Given a guild master creates a boss quest
When any family member is viewing the boss quest panel
Then the new boss quest appears in the active/available quests within 100ms

#### Scenario: Boss quest participation updates immediately

Given a hero joins an active boss quest
When viewing the boss quest participant list
Then the hero is added to the participant list within 100ms

#### Scenario: Boss quest completion triggers rewards for all participants

Given a boss quest is marked complete
When all participants are viewing their dashboards
Then they all receive the quest completion overlay with individual rewards within
100ms

### Requirement: Visual Feedback for Realtime Updates

All realtime data updates SHALL include subtle visual indicators (glow, flash,
or pulse effect) to provide user feedback that data is syncing live from the
server.

#### Scenario: Glow effect on updated quest cards

Given a quest is created or status changes via realtime event
When the quest appears on any user's dashboard
Then the quest card displays a subtle glow or flash effect for 500-800ms to
indicate a realtime update occurred

#### Scenario: Flash effect on updated character stats

Given character stats (XP, gold, level, honor, gems) are confirmed in database
When the stats update via realtime subscription
Then the stat display shows a subtle flash or highlight effect to indicate the
value changed

#### Scenario: Pulse effect on family member status changes

Given a family member's role or status changes
When displayed in admin panels or family rosters
Then the updated row displays a subtle pulse or highlight effect to draw
attention to the change

## MODIFIED Requirements

### Requirement: Realtime Context Subscription API

The `useRealtime()` hook SHALL provide subscription callbacks for character,
quest, reward, and boss quest updates.

#### Scenario: Components subscribe to character updates

Given a component calls `const { onCharacterUpdate } = useRealtime()`
When the character table receives an UPDATE event
Then the callback fires with the realtime event data

#### Scenario: Multiple components listen to same table updates

Given two components subscribe to quest updates via `onQuestUpdate()`
When a quest is created/updated/deleted
Then both components receive the realtime event and can update independently

## REMOVED Requirements

None - this change adds new requirements without removing existing ones.
