# Task List: Template Rewards System

Based on PRD: `0006-prd-template-rewards.md`

## Relevant Files

- `supabase/migrations/20251002000005_create_default_reward_templates.sql` - Migration file with 15 template rewards and auto-copy trigger function
- `tests/integration/reward-template-service.integration.test.ts` - Integration tests verifying template copying, independence, and edge cases (3 tests, all passing)
- `tests/e2e/reward-template-auto-copy.spec.ts` - E2E tests verifying templates copy to new families (5 tests covering visibility, categories, costs, descriptions)
- `tests/e2e/reward-template-customization.spec.ts` - E2E tests verifying Guild Masters can edit/toggle/customize copied rewards (6 tests covering all CRUD operations)

### Notes

- This feature is purely database-driven (migration + trigger). No application code changes required.
- Follow the exact pattern from `013_create_default_quest_templates.sql`
- The trigger function must use `SECURITY DEFINER` to bypass RLS (see `014_fix_quest_template_trigger_security.sql`)
- Template rewards use `family_id = NULL` and predictable UUIDs (`00000000-0000-0000-0000-0000000000XX`)
- Existing RLS policies already support this feature (lines 193-205 in `002_row_level_security.sql`)

## Tasks

- [x] 1.0 Design Template Reward Content
  - [x] 1.1 Create a list of 10-20 diverse, family-friendly rewards
  - [x] 1.2 Ensure balanced distribution across all four reward types (SCREEN_TIME, PRIVILEGE, PURCHASE, EXPERIENCE)
  - [x] 1.3 Assign appropriate gold costs (25-75 for small, 100-200 for medium, 250-500 for large rewards)
  - [x] 1.4 Write clear, concise descriptions for each reward explaining what the hero receives
  - [x] 1.5 Verify rewards appeal to different ages and interests
  - [x] 1.6 Document the final reward list in a comment block at the top of the migration file

- [x] 2.0 Create Database Migration with Template Rewards and Trigger
  - [x] 2.1 Create migration file `supabase/migrations/019_create_default_reward_templates.sql`
  - [x] 2.2 Add migration header comment explaining purpose and following quest template pattern
  - [x] 2.3 Write INSERT statements for all template rewards using predictable UUIDs (00000000-0000-0000-0000-0000000000{01-20})
  - [x] 2.4 Set `family_id = NULL` for all template rewards to mark them as global templates
  - [x] 2.5 Create function `copy_default_reward_templates_to_new_family()` with SECURITY DEFINER attribute
  - [x] 2.6 Function should SELECT from rewards WHERE family_id IS NULL and INSERT with NEW.id as family_id
  - [x] 2.7 Create trigger `trigger_copy_reward_templates_on_family_insert` that fires AFTER INSERT on families table
  - [x] 2.8 Add COMMENT on function explaining it bypasses RLS to access global templates
  - [x] 2.9 Make migration idempotent using INSERT ... ON CONFLICT DO NOTHING or conditional logic
  - [x] 2.10 Verify migration syntax is valid PostgreSQL/Supabase SQL

- [x] 3.0 Write Integration Tests for Template Copying
  - [x] 3.1 Create test file `tests/integration/reward-template-service.integration.test.ts`
  - [x] 3.2 Write test: "should copy all template rewards when a new family is created"
  - [x] 3.3 Test setup: Insert template rewards with family_id = NULL into test database
  - [x] 3.4 Test action: Create a new family via Supabase client
  - [x] 3.5 Test assertion: Query rewards table for new family_id and verify count matches template count
  - [x] 3.6 Test assertion: Verify copied rewards have correct name, description, type, cost, and is_active values
  - [x] 3.7 Test assertion: Verify copied rewards have unique UUIDs (not the template UUIDs)
  - [x] 3.8 Write test: "should not copy rewards if no templates exist"
  - [x] 3.9 Write test: "copied rewards should be independent from global templates"
  - [x] 3.10 Add cleanup logic to remove test families and rewards after each test

- [x] 4.0 Write E2E Tests for Template Rewards
  - [x] 4.1 Create test file `tests/e2e/reward-template-auto-copy.spec.ts`
  - [x] 4.2 Write test: "new family should automatically receive template rewards"
  - [x] 4.3 Test flow: Create new family through signup flow
  - [x] 4.4 Test flow: Navigate to Reward Store as Guild Master
  - [x] 4.5 Test assertion: Verify at least 10 rewards are visible in the store
  - [x] 4.6 Test assertion: Verify rewards span multiple categories (check for different reward type icons)
  - [x] 4.7 Create test file `tests/e2e/reward-template-customization.spec.ts`
  - [x] 4.8 Write test: "Guild Master can edit template rewards"
  - [x] 4.9 Test flow: Navigate to Reward Management as Guild Master
  - [x] 4.10 Test flow: Edit a template reward (change name, description, or cost)
  - [x] 4.11 Test assertion: Verify changes are saved and visible
  - [x] 4.12 Write test: "Guild Master can deactivate template rewards"
  - [x] 4.13 Test flow: Toggle a reward to inactive
  - [x] 4.14 Test assertion: Verify reward no longer appears in hero's Reward Store
  - [x] 4.15 Test assertion: Verify reward still visible in Guild Master's Reward Management (inactive state)

- [ ] 5.0 Test Migration and Deploy
  - [ ] 5.1 Start local Supabase instance (`npx supabase start`)
  - [ ] 5.2 Apply migration to local database (`npx supabase db reset` or `npx supabase migration up`)
  - [ ] 5.3 Verify template rewards exist in local database with family_id = NULL
  - [ ] 5.4 Create a test family through the UI and verify rewards are copied
  - [ ] 5.5 Run integration tests (`npm run test -- reward-template-service.integration.test.ts`)
  - [ ] 5.6 Run E2E tests (`npx playwright test reward-template-auto-copy.spec.ts reward-template-customization.spec.ts`)
  - [ ] 5.7 Verify all tests pass locally
  - [ ] 5.8 Review migration file one final time for syntax errors, typos, or security issues
  - [ ] 5.9 Commit migration file and tests to Git
  - [ ] 5.10 Deploy migration to production Supabase instance
  - [ ] 5.11 Monitor production logs for any errors during deployment
  - [ ] 5.12 Create a test family in production and verify template rewards are copied correctly
