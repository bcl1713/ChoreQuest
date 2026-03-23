# Achievement Notification System

## Why

The achievement system can now track progress and evaluate
unlocks (#134, #136), but players receive no feedback when
they earn an achievement. Without real-time notifications,
unlocks go unnoticed — undermining the motivational loop
that achievements are designed to create. The
`character_achievements.notified` column already exists
in the schema, waiting for a consumer.

## What Changes

- Subscribe to `character_achievements` table via
  Supabase Realtime to detect new unlocks
- Add a new `AchievementUnlockToast` component that
  displays achievement name, description, icon, and
  XP/gold rewards with a celebratory CSS animation
- Toast auto-dismisses after ~5 seconds with a manual
  dismiss option
- Queue multiple simultaneous unlocks and display them
  sequentially
- Mark `notified: true` on `character_achievements`
  after displaying to prevent re-showing on refresh
- Extend `RealtimeProvider` with an achievement unlock
  listener registry following the existing channel
  subscription pattern

## Capabilities

### New Capabilities

- `achievement-notification`: Real-time achievement
  unlock detection, notification queuing, toast display,
  and notified-state management

### Modified Capabilities

- `realtime-subscriptions`: Add
  `character_achievements` table subscription and
  `achievement_unlocked` event type to the existing
  realtime channel system

## Impact

- **Components**: New `AchievementUnlockToast`
  component; new notification queue hook
- **Contexts**: `RealtimeProvider` gains achievement
  unlock listener registry and channel subscription
- **Types**: `RealtimeEventType` enum extended with
  achievement unlock event
- **Database**: Requires `REPLICA IDENTITY FULL` on
  `character_achievements` (already set in schema
  migration); writes to `notified` column on display
- **Dependencies**: Builds on achievement schema (#134)
  and unlock evaluation engine (#136); follows patterns
  from existing realtime subscriptions and
  `RedeemSuccessToast`
