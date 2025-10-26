## Relevant Files

- `components/quests/quest-dashboard/quest-helpers.ts` - Contains `mapFamilyCharactersToAssignmentDisplay()` helper that needs to be fixed to map by user_id instead of character.id
- `components/quests/quest-dashboard/quest-helpers.test.ts` - Unit tests for quest-helpers (needs tests for getAssignedHeroName with proper user_id mapping)
- `components/quests/quest-card/index.tsx` - Already displays assignedHeroName on line 126 (no changes needed, just verify it works)
- `components/quests/pending-approvals-section.tsx` - Already passes assignedHeroName to QuestCard (no changes needed)
- `components/admin/quest-management-tab.tsx` - Already passes assignedHeroName to QuestCard (no changes needed)
- `components/quests/quest-dashboard/index.tsx` - Main dashboard that uses PendingApprovalsSection (no changes needed)

### Notes

- The feature is **already implemented** but has a bug: the lookup table uses character IDs but should use user IDs
- `quest_instances.assigned_to_id` references `user_profiles.id` (confirmed in migration 001_initial_schema.sql:80)
- The fix is simple: change `mapFamilyCharactersToAssignmentDisplay()` to return `{ id: char.user_id, name: char.name }` instead of `{ id: char.id, name: char.name }`
- Unit tests should verify that hero names appear correctly for quests with assigned_to_id set
- Use `npx jest components/quests/quest-dashboard/quest-helpers.test.ts` to run relevant tests

## Tasks

- [ ] 1.0 Fix mapFamilyCharactersToAssignmentDisplay to map by user_id
  - [ ] 1.1 Update `mapFamilyCharactersToAssignmentDisplay()` in quest-helpers.ts to return `{ id: char.user_id, name: displayName }` instead of `{ id: char.id, name: displayName }`
  - [ ] 1.2 Add JSDoc comment explaining that the function maps characters by user_id for quest assignment lookup
  - [ ] 1.3 Verify the function handles edge cases (missing user_id, null values)

- [ ] 2.0 Add comprehensive unit tests for getAssignedHeroName
  - [ ] 2.1 Add test: "returns hero name when quest.assigned_to_id matches a character's user_id"
  - [ ] 2.2 Add test: "returns undefined when quest.assigned_to_id does not match any character"
  - [ ] 2.3 Add test: "returns undefined when quest.assigned_to_id is null"
  - [ ] 2.4 Add test: "handles empty assignmentOptions array"
  - [ ] 2.5 Add test: "uses character name from mapFamilyCharactersToAssignmentDisplay output"

- [ ] 3.0 Update existing tests that may be affected by the change
  - [ ] 3.1 Review quest-helpers.test.ts for any tests using mapFamilyCharactersToAssignmentDisplay with character.id
  - [ ] 3.2 Update test fixtures to use user_id in assignment options if needed
  - [ ] 3.3 Run all quest-helpers tests and fix any failures

- [ ] 4.0 Manual verification and quality gate
  - [ ] 4.1 Run `npm run build` - ensure zero compilation errors
  - [ ] 4.2 Run `npm run lint` - ensure zero linting errors/warnings
  - [ ] 4.3 Run `npx jest components/quests/quest-dashboard/quest-helpers.test.ts` - all tests pass
  - [ ] 4.4 Run `npm run test` - all unit tests pass across the codebase
