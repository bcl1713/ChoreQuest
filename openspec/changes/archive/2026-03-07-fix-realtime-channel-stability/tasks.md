# Fix Realtime Channel Stability — Tasks

## 1. Stabilize RealtimeProvider channel lifecycle

- [x] 1.1 Remove `user` and `session` from `setUpChannel`
  `useCallback` dependency array in `lib/realtime-context.tsx`
  (keep only `waitForReady` and `profile?.family_id`)
- [x] 1.2 Simplify the validation guard inside `setUpChannel`
  from `!user || !session || !familyId || !session.access_token`
  to `!familyId`

## 2. Fix auth-context profile subscription

- [x] 2.1 Remove `session` from the profile subscription
  `useEffect` dependency array in `lib/auth-context.tsx` (line
  186); removed session reference from callback instead of using ref
- [x] 2.2 Replace `channel.unsubscribe()` with
  `supabase.removeChannel(channel)` in the profile subscription
  cleanup function

## 3. Remove stable refs from hook dependency arrays

- [x] 3.1-3.4 SKIPPED: Kept stable callback refs in dependency
  arrays. These callbacks are already stable (empty deps) so
  including them is harmless and satisfies the linter without
  eslint-disable comments (which are an anti-pattern in this project)

## 4. Update tests

- [x] 4.1 Update any existing tests that mock `setUpChannel`
  dependencies or assert on the dependency array contents
  (none found — no changes needed)
- [x] 4.2 Verify all existing realtime hook tests still pass
  after dependency array changes

## 5. Verify

- [x] 5.1 Run `npm run build` — pre-existing API route errors
  (not related to this change); TypeScript compilation succeeds
- [x] 5.2 Run `npm run lint` — zero lint errors or warnings
- [x] 5.3 Run `npm run test` — all 1468 unit + 23 integration
  tests pass
