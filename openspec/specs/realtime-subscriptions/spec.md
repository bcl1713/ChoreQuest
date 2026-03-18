# Realtime Subscriptions for Dashboard Components Specification

## Purpose

Ensure all React components that display database information use realtime
subscriptions to automatically sync with Supabase changes. This restores live
updates for user stats, quest operations, rewards, family member changes, and
boss battles that were lost in the recent refactor.

## Requirements

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

- **WHEN** a guild master creates a new reward
- **THEN** the new reward SHALL appear in the catalog within 100ms on all
  open sessions without refresh

#### Scenario: Reward redemption updates gold balance in real-time

- **WHEN** a user redeems a reward from the store
- **THEN** the user's gold balance SHALL decrease within 100ms on all open
  pages showing the balance

#### Scenario: Redemption history updates immediately

- **WHEN** a user redeems a reward
- **THEN** the new redemption SHALL appear in the history/approval queue
  within 100ms

#### Scenario: Reward deletion propagates to all viewers

- **WHEN** a guild master deletes a reward from the catalog
- **THEN** the reward SHALL be removed from all reward displays within 100ms

#### Scenario: Redemption status change propagates to all admin sessions

- **WHEN** any admin or GM approves, denies, or fulfills a redemption
- **THEN** all other open admin/GM sessions SHALL reflect the updated
  redemption status within 100ms without requiring a manual refresh

#### Scenario: In-place state merge on redemption realtime event

- **WHEN** a `reward_redemption_updated` realtime event arrives
- **THEN** the matching redemption record SHALL be updated in local state
  by merging the changed fields in-place, without a full re-fetch of all
  redemptions from the server

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

### Requirement: Stable listener registration

Data hooks (`useQuests`, `useRewards`, `useFamilyMembers`,
`useBossQuests`) MUST register their realtime listeners in a
`useEffect` whose dependency array does NOT include the
`onXxxUpdate` callback ref from `useRealtime()`. These callbacks
are stable (created with empty dependency arrays) and including
them adds no value while risking unnecessary re-subscriptions if
their stability guarantee ever changes.

#### Scenario: Listener persists across re-renders

- **WHEN** a component using `useQuests` re-renders due to
  unrelated state changes
- **THEN** the quest realtime listener MUST remain registered
  in the listener registry without being removed and re-added

#### Scenario: Listener re-registers on family change

- **WHEN** the user's `profile.family_id` changes
- **THEN** the old listener MUST be unregistered and a new
  listener MUST be registered for the new family context

### Requirement: Auth-context channel cleanup

The auth-context profile subscription channel MUST be cleaned up
using `supabase.removeChannel(channel)` instead of
`channel.unsubscribe()`. The effect that creates this channel
MUST NOT include `session` in its dependency array.

#### Scenario: Profile subscription survives token refresh

- **WHEN** the Supabase auth client fires a `TOKEN_REFRESHED`
  event while the profile subscription channel is active
- **THEN** the profile subscription channel MUST remain
  connected without being torn down and recreated

#### Scenario: No orphaned channels after repeated auth events

- **WHEN** multiple auth state changes fire in quick succession
  (e.g., `INITIAL_SESSION` followed by `SIGNED_IN`)
- **THEN** at most one profile subscription channel SHALL exist
  per user at any given time, with no orphaned channel objects in
  the Supabase client's internal channel list

### Requirement: Realtime Context Subscription API

The `useRealtime()` hook SHALL provide subscription callbacks for
character, quest, reward, and boss quest updates. The realtime
channel SHALL remain connected across auth token refreshes and
SHALL only be destroyed and recreated when the user's `family_id`
changes. The channel lifecycle MUST NOT depend on the `session` or
`user` objects from the auth context.

#### Scenario: Channel survives auth token refresh

- **WHEN** the Supabase auth client fires a `TOKEN_REFRESHED`
  event while a family realtime channel is active
- **THEN** the existing channel MUST remain connected and
  continue receiving `postgres_changes` events without
  interruption

#### Scenario: Channel reconnects on family change

- **WHEN** the user's `profile.family_id` changes (e.g., joining
  a different family)
- **THEN** the old channel MUST be removed via
  `supabase.removeChannel()` and a new channel MUST be created
  for the new family

#### Scenario: Channel removed on logout

- **WHEN** the user logs out and `profile` becomes null
- **THEN** the channel MUST be removed and listener registries
  MUST be cleared

#### Scenario: Components subscribe to character updates

- **WHEN** a component calls
  `const { onCharacterUpdate } = useRealtime()`
- **THEN** the callback fires with the realtime event data when
  the character table receives an UPDATE event

#### Scenario: Multiple components listen to same table updates

- **WHEN** two components subscribe to quest updates via
  `onQuestUpdate()`
- **THEN** both components receive the realtime event and can
  update independently
