# Achievement Notification System — Tasks

## 1. Realtime Infrastructure

- [x] 1.1 Add `"achievement_unlock_updated"` to
  `RealtimeEventType` union in
  `lib/realtime/types.ts`
- [x] 1.2 Add `onAchievementUnlockUpdate` to
  `RealtimeContextType` interface in
  `lib/realtime/types.ts`
- [x] 1.3 Add `achievementUnlock` to
  `ChannelRegistries` type in
  `lib/realtime/channel-subscriptions.ts`
- [x] 1.4 Add `character_achievements` table
  subscription to `createFamilyRealtimeChannels`
  (no family_id filter)
- [x] 1.5 Add `achievementUnlockListeners` registry
  ref and wire up in `RealtimeProvider` (registry,
  clear, callback, context value)
- [x] 1.6 Add fallback `onAchievementUnlockUpdate`
  to `useRealtime()` no-context return
- [x] 1.7 Write tests for realtime channel
  subscription setup including new achievement
  channel
- [x] 1.8 Write tests for achievement unlock
  listener registration and event emission

## 2. Notified Update API Route

- [x] 2.1 Create API route at
  `app/api/character-achievements/[id]/notified/`
  with PATCH handler
- [x] 2.2 Implement auth check (return 401 if
  unauthenticated)
- [x] 2.3 Implement record lookup (return 404 if
  not found)
- [x] 2.4 Update `character_achievements.notified`
  to `true` using service-role client
- [x] 2.5 Write tests for PATCH success, 401, and
  404 scenarios

## 3. Achievement Notification Hook

- [x] 3.1 Create
  `hooks/useAchievementNotifications.ts` with
  queue state and realtime subscription
- [x] 3.2 Implement unlock detection: filter UPDATE
  events where `unlocked_at` transitions
  null to non-null and `notified = false`
- [x] 3.3 Implement character-scoped filtering
  (only current character's events)
- [x] 3.4 Implement notification queue (array-based,
  show one at a time, advance on dismiss)
- [x] 3.5 Implement catch-up query on mount: fetch
  `character_achievements` where
  `unlocked_at IS NOT NULL AND notified = false`
- [x] 3.6 Implement deduplication between catch-up
  results and realtime events by
  `achievement_id`
- [x] 3.7 Implement `notified` flag update via API
  call when toast is displayed
- [x] 3.8 Clear queue and re-run catch-up on
  character switch
- [x] 3.9 Write tests for unlock detection
  (null to non-null transition filtering)
- [x] 3.10 Write tests for queue management
  (enqueue, dequeue, sequential display)
- [x] 3.11 Write tests for catch-up query and
  deduplication
- [x] 3.12 Write tests for character-scoped
  filtering and character switch behavior

## 4. Toast Component

- [x] 4.1 Create `AchievementUnlockToast.tsx` in
  `components/achievements/` with Framer Motion
  animations
- [x] 4.2 Render achievement name, description,
  icon, and XP/gold rewards
- [x] 4.3 Implement 5-second auto-dismiss timer
  with `setTimeout`
- [x] 4.4 Implement manual dismiss button
- [x] 4.5 Add celebratory CSS entrance animation
  (slide-in/scale with gradient styling)
- [x] 4.6 Write tests for toast rendering with
  achievement data
- [x] 4.7 Write tests for auto-dismiss after
  5 seconds
- [x] 4.8 Write tests for manual dismiss callback

## 5. Integration

- [x] 5.1 Create
  `AchievementNotificationManager.tsx` in
  `components/achievements/` that composes the
  hook and toast
- [x] 5.2 Mount `AchievementNotificationManager`
  inside `CharacterProvider` in layout
- [x] 5.3 Write integration test verifying
  end-to-end flow: realtime event to queue to
  toast display to notified update
