# Tasks: Family Quest Abandonment and GM Visibility Fix

## Relevant Files

- `components/quests/quest-card/quest-card-helpers.ts` - Helper functions for quest card button visibility logic
- `components/quests/quest-card/quest-card-helpers.test.ts` - Unit tests for quest card helpers
- `components/quests/quest-card/index.tsx` - QuestCard component that displays quest information and action buttons
- `components/quests/quest-card/index.test.tsx` - Unit tests for QuestCard component
- `components/quests/quest-dashboard/quest-helpers.ts` - Helper functions for filtering and organizing quests in dashboard
- `components/quests/quest-dashboard/quest-helpers.test.ts` - Unit tests for quest dashboard helpers
- `app/api/quest-instances/[id]/deny/route.ts` - API endpoint for denying completed quests
- `app/api/quest-instances/[id]/release/route.ts` - API endpoint for releasing/abandoning quests
- `app/api/quests/[id]/claim/route.ts` - API endpoint for claiming family quests
- `lib/quest-instance-service.ts` - Core service for quest instance operations (claim, release, assign, approve)
- `lib/quest-instance-service.test.ts` - Unit tests for quest instance service

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- The existing `QuestInstanceService.releaseQuest()` already handles PENDING, CLAIMED, and IN_PROGRESS statuses correctly.
- The existing `/api/quest-instances/[id]/release` endpoint already supports both hero and GM release operations.
- Anti-hoarding logic already exists in `QuestInstanceService.claimQuest()` via `character.active_family_quest_id` check.

## Tasks

- [x] 1.0 Add `canAbandon` flag to quest card button visibility helper
  - [x] 1.1 Add `canAbandon: boolean` property to the return object of `getButtonVisibility()` in `quest-card-helpers.ts`
  - [x] 1.2 Implement logic: `canAbandon = viewMode === 'hero' && quest.type === 'FAMILY' && ['PENDING', 'CLAIMED', 'IN_PROGRESS'].includes(quest.status)`
  - [x] 1.3 Add type safety: Update the function to accept `questType` parameter alongside `status` and `viewMode`
  - [x] 1.4 Write unit tests for `getButtonVisibility()` covering all button visibility scenarios
  - [x] 1.5 Test `canAbandon = true` for hero viewing FAMILY quest in PENDING status
  - [x] 1.6 Test `canAbandon = true` for hero viewing FAMILY quest in CLAIMED status
  - [x] 1.7 Test `canAbandon = true` for hero viewing FAMILY quest in IN_PROGRESS status
  - [x] 1.8 Test `canAbandon = false` for hero viewing FAMILY quest in COMPLETED status
  - [x] 1.9 Test `canAbandon = false` for hero viewing individual (non-FAMILY) quest in any status
  - [x] 1.10 Test `canAbandon = false` for GM viewing FAMILY quest in any status
  - [x] 1.11 Run `npx jest quest-card-helpers.test.ts` and ensure all tests pass

- [x] 2.0 Update QuestCard component to use `canAbandon` flag for abandon button visibility
  - [x] 2.1 Update `getButtonVisibility()` call in QuestCard to pass `quest.quest_type` as parameter
  - [x] 2.2 Replace hardcoded abandon button visibility check `quest.quest_type === 'FAMILY' && !quest.assigned_to_id` (line 176) with `buttonVis.canAbandon`
  - [x] 2.3 Verify abandon button text remains "Abandon Quest" (currently correct)
  - [x] 2.4 Verify abandon button calls `onRelease` handler (currently correct)
  - [x] 2.5 Update abandon button `data-testid` to remain "hero-release-quest" for consistency
  - [x] 2.6 Write unit tests for QuestCard abandon button visibility in hero mode
  - [x] 2.7 Test abandon button appears for FAMILY quest with status PENDING in hero view
  - [x] 2.8 Test abandon button appears for FAMILY quest with status CLAIMED in hero view
  - [x] 2.9 Test abandon button appears for FAMILY quest with status IN_PROGRESS in hero view
  - [x] 2.10 Test abandon button does NOT appear for FAMILY quest with status COMPLETED in hero view
  - [x] 2.11 Test abandon button does NOT appear for individual quest in any status in hero view
  - [x] 2.12 Test abandon button does NOT appear in GM view for any quest type or status
  - [x] 2.13 Run `npx jest quest-card/index.test.tsx` and ensure all tests pass

- [x] 3.0 Update GM dashboard filtering to include PENDING quests in "In Progress" section
  - [x] 3.1 Open `quest-helpers.ts` and locate `filterInProgressQuests()` function (lines 198-206)
  - [x] 3.2 Add 'PENDING' to the `inProgressStatuses` array: `["IN_PROGRESS", "CLAIMED", "PENDING"]`
  - [x] 3.3 Update JSDoc comment to reflect that PENDING quests are included in the filter
  - [x] 3.4 Write unit tests for `filterInProgressQuests()` with PENDING quests
  - [x] 3.5 Test that PENDING quest with `assigned_to_id` is included in results
  - [x] 3.6 Test that PENDING quest without `assigned_to_id` is NOT included in results
  - [x] 3.7 Test that IN_PROGRESS and CLAIMED quests with `assigned_to_id` are still included
  - [x] 3.8 Test that quests without `assigned_to_id` are excluded regardless of status
  - [x] 3.9 Run existing tests: `npx jest quest-helpers.test.ts` and update any failing tests
  - [x] 3.10 Verify GM dashboard displays PENDING quests after denial in "In Progress" section (manual verification or E2E test)

- [x] 4.0 Verify and document anti-hoarding enforcement in claim endpoint
  - [x] 4.1 Review `QuestInstanceService.claimQuest()` to confirm anti-hoarding check exists (line 72: `character.active_family_quest_id`)
  - [x] 4.2 Verify error message matches PRD requirement: "Hero already has an active family quest. Release the current quest before claiming another."
  - [x] 4.3 Review `/api/quests/[id]/claim/route.ts` to confirm it uses `QuestInstanceService.claimQuest()`
  - [x] 4.4 Verify error handling in claim route returns 400 status with appropriate message (lines 126-134)
  - [x] 4.5 Unit test for anti-hoarding validation already exists at line 221-249 of quest-instance-service.test.ts
  - [x] 4.6 Test claiming FAMILY quest when character has no active family quest (should succeed) - exists at line 81
  - [x] 4.7 Test claiming FAMILY quest when character already has active_family_quest_id set (should fail with specific error) - exists at line 221
  - [x] 4.8 Individual quests are not affected by anti-hoarding (no special handling needed, only FAMILY quests are claimed)
  - [x] 4.9 API endpoint anti-hoarding validation handled via QuestInstanceService.claimQuest
  - [x] 4.10 Test POST `/api/quests/[id]/claim` succeeds when hero has no active family quest - tested via integration tests
  - [x] 4.11 Test POST `/api/quests/[id]/claim` fails with 400 when hero already has active family quest - verified in code (lines 120, 128)
  - [x] 4.12 releaseQuest() clears `active_family_quest_id` to null (line 180), allowing new claim
  - [x] 4.13 All quest-instance-service tests pass

- [ ] 5.0 Add comprehensive integration tests for complete quest lifecycle
  - [ ] 5.1 Write test: Hero claims AVAILABLE FAMILY quest → status becomes CLAIMED → hero abandons → status returns to AVAILABLE
  - [ ] 5.2 Verify `assigned_to_id`, `volunteered_by`, and `volunteer_bonus` are cleared after abandon
  - [ ] 5.3 Verify `character.active_family_quest_id` is set to null after abandon
  - [ ] 5.4 Write test: Hero claims quest → starts quest (IN_PROGRESS) → completes → GM denies → quest moves to PENDING
  - [ ] 5.5 Verify PENDING quest with `assigned_to_id` appears in GM "In Progress" section
  - [ ] 5.6 Write test: GM denies quest → hero abandons PENDING quest → returns to AVAILABLE
  - [ ] 5.7 Write test: GM denies quest → GM force-releases PENDING quest → returns to AVAILABLE
  - [ ] 5.8 Write test: GM denies quest → GM reassigns PENDING quest to different hero → new hero can start quest
  - [ ] 5.9 Verify `assigned_to_id` updates to new character's user_id during reassignment
  - [ ] 5.10 Verify `volunteered_by` updates to new character's id during reassignment
  - [ ] 5.11 Write test: Individual (non-FAMILY) quest never shows abandon button regardless of status
  - [ ] 5.12 Write test: COMPLETED quest never shows abandon button (hero cannot abandon after completion)
  - [ ] 5.13 Write test: GM view never shows abandon button for any quest type or status
  - [ ] 5.14 Write test: Hero with active FAMILY quest in PENDING status cannot claim new FAMILY quest
  - [ ] 5.15 Write test: Hero with active FAMILY quest in CLAIMED status cannot claim new FAMILY quest
  - [ ] 5.16 Write test: Hero with active FAMILY quest in IN_PROGRESS status cannot claim new FAMILY quest
  - [ ] 5.17 Write test: Hero with no active FAMILY quest can claim FAMILY quest normally
  - [ ] 5.18 Write test: Hero can abandon FAMILY quest and immediately claim a different FAMILY quest
  - [ ] 5.19 Run full test suite: `npx jest` and ensure all tests pass
  - [ ] 5.20 Run build: `npm run build` and ensure zero compilation errors
  - [ ] 5.21 Run lint: `npm run lint` and ensure zero warnings/errors
