# Task List: Recurring Quest System (PRD-0009)

## Assessment Summary

**Existing Infrastructure:**
- ✅ Supabase database with TypeScript types
- ✅ Quest template and quest instance tables already exist
- ✅ Quest service layer (`lib/quest-service.ts`, `lib/quest-template-service.ts`)
- ✅ Admin dashboard component structure
- ✅ Real-time context for WebSocket updates
- ✅ Jest testing framework configured
- ✅ Framer Motion for animations (already in use)
- ✅ Fantasy UI components (`FantasyCard`, `FantasyButton`, `FantasyIcon`)

**Technology Stack:**
- Next.js 15.5.2 (App Router)
- React 19.1.0
- Supabase (@supabase/supabase-js)
- TypeScript 5+
- Tailwind CSS 4
- Framer Motion 12.23.12
- Lucide React 0.544.0

**What Needs to Be Built:**
- Database schema updates for recurring quest support
- Cron job system for quest generation and expiration
- Family quest claiming mechanics
- Streak tracking system
- Vacation/pause functionality
- API endpoints for new operations
- UI components for template management and quest claiming
- Preset template library

---

## ⚠️ IMPORTANT: Create Development Branch First!

**Before starting implementation:**
```bash
git checkout -b feature/recurring-quest-system
```

This ensures all work is done on a feature branch following the project's workflow conventions.

---

## Relevant Files

### Database & Schema
- `supabase/migrations/20251012000001_add_recurring_quests.sql` - Migration for recurring quest schema (created)
- `lib/types/database.ts` - TypeScript types (will be regenerated from Supabase)
- `lib/types/database-generated.ts` - Auto-generated types

### Services & Business Logic
- `lib/quest-template-service.ts` - Quest template CRUD operations (exists, needs extension)
- `lib/quest-instance-service.ts` - Quest instance operations (new file)
- `lib/streak-service.ts` - Streak tracking and bonus calculations (new file)
- `lib/recurring-quest-generator.ts` - Quest generation and expiration logic with idempotency checks (created)
- `lib/cron-jobs.ts` - Node-cron initialization and scheduling (created)
- `lib/preset-templates.ts` - Preset template definitions (new file)

### API Routes
- `app/api/quest-templates/route.ts` - Template CRUD endpoints (new file)
- `app/api/quest-templates/[id]/route.ts` - Individual template operations (new file)
- `app/api/quest-templates/[id]/pause/route.ts` - Pause/resume endpoint (new file)
- `app/api/quest-templates/presets/route.ts` - Preset templates endpoint (new file)
- `app/api/quests/[id]/claim/route.ts` - Family quest claiming (new file)
- `app/api/quests/[id]/release/route.ts` - Release claimed quest (new file)
- `app/api/streaks/route.ts` - Streak data endpoints (new file)
- `app/api/cron/generate-quests/route.ts` - Cron job endpoint with CRON_SECRET authentication (created)
- `app/api/cron/expire-quests/route.ts` - Quest expiration endpoint with streak breaking (created)

### Components (UI)
- `components/quest-template-dashboard.tsx` - GM template management interface (new file)
- `components/quest-template-form.tsx` - Create/edit template form (new file)
- `components/preset-template-library.tsx` - Browse and enable presets (new file)
- `components/family-quest-claiming.tsx` - Hero claiming interface (new file)
- `components/streak-display.tsx` - Streak visualization component (new file)
- `components/recurring-quest-card.tsx` - Recurring quest display card (new file)
- `components/quest-conversion-wizard.tsx` - Convert one-time to recurring (new file)
- `components/admin-dashboard.tsx` - Update with recurring quest management (exists)
- `components/quest-dashboard.tsx` - Update for hero claiming UI (exists)

### Utilities & Helpers
- `lib/utils/quest-utils.ts` - Quest-related utility functions (new file)
- `lib/utils/date-utils.ts` - Date/time calculations for cycles (new file)
- `lib/utils/bonus-calculator.ts` - Calculate volunteer/streak bonuses (new file)

### Tests (Unit Tests Only - NO E2E)
- `lib/quest-template-service.test.ts` - Unit tests for template service
- `lib/quest-instance-service.test.ts` - Unit tests for instance service
- `lib/streak-service.test.ts` - Unit tests for streak logic
- `lib/recurring-quest-generator.test.ts` - Unit tests for quest generation and expiration (created)
- `lib/utils/bonus-calculator.test.ts` - Unit tests for bonus calculations
- `lib/utils/date-utils.test.ts` - Unit tests for date utilities
- `components/quest-template-form.test.tsx` - Unit tests for template form
- `components/family-quest-claiming.test.tsx` - Unit tests for claiming UI
- `components/streak-display.test.tsx` - Unit tests for streak display

### Notes
- Unit tests should be placed alongside the code files they are testing
- Use `npm test` to run all Jest unit tests
- Use `npm run test:watch` for TDD watch mode
- **E2E tests are excluded from this implementation** (Playwright tests removed temporarily)

---

## Tasks

- [x] 1.0 Database Schema & Migration
  - [x] 1.1 Design updated Supabase schema with new tables and enums
  - [x] 1.2 Create migration file for `quest_type` enum (INDIVIDUAL, FAMILY)
  - [x] 1.3 Create migration file for `recurrence_pattern` enum (DAILY, WEEKLY, CUSTOM)
  - [x] 1.4 Create migration file for `quest_status` enum updates (add AVAILABLE, CLAIMED, MISSED)
  - [x] 1.5 Update `quest_templates` table: add `quest_type`, `recurrence_pattern`, `is_paused`, `assigned_character_ids[]`
  - [x] 1.6 Update `quest_instances` table: add `template_id`, `quest_type`, `volunteer_bonus`, `streak_count`, `streak_bonus`, `cycle_start_date`, `cycle_end_date`
  - [x] 1.7 Create `character_quest_streaks` table with columns: `id`, `character_id`, `template_id`, `current_streak`, `longest_streak`, `last_completed_date`
  - [x] 1.8 Update `families` table: add `week_start_day` (0=Sunday, 6=Saturday)
  - [x] 1.9 Update `characters` table: add `active_family_quest_id` (nullable, for one-quest limit)
  - [x] 1.10 Add database indexes for performance: `quest_instances(cycle_end_date)`, `quest_instances(status)`, `character_quest_streaks(character_id, template_id)`
  - [x] 1.11 Add foreign key constraints and cascade rules
  - [x] 1.12 Run migration locally and verify schema: `npx supabase db push`
  - [x] 1.13 Regenerate TypeScript types: `npx supabase gen types typescript --local > lib/types/database-generated.ts`
  - [x] 1.14 Update `lib/types/database.ts` with new convenience types

- [x] 2.0 Background Job System (Cron/Scheduled Tasks)
  - [x] 2.1 Research Vercel Cron Jobs vs external cron solutions (document decision)
  - [x] 2.2 Create `app/api/cron/generate-quests/route.ts` endpoint with authentication/secret validation
  - [x] 2.3 Implement quest generation logic: query active templates, check if instance already exists for current cycle
  - [x] 2.4 Implement INDIVIDUAL quest generation: create one instance per assigned character
  - [x] 2.5 Implement FAMILY quest generation: create one instance in AVAILABLE status
  - [x] 2.6 Add idempotency checks to prevent duplicate quest generation
  - [x] 2.7 Create `app/api/cron/expire-quests/route.ts` endpoint for quest expiration
  - [x] 2.8 Implement expiration logic: mark quests as MISSED if past `cycle_end_date` and incomplete
  - [x] 2.9 Implement streak breaking on missed quests (unless template is paused)
  - [x] 2.10 Add error handling and logging for cron jobs
  - [x] 2.11 Configure cron schedule with node-cron (run every 5 minutes)
  - [x] 2.12 Write unit tests for quest generation logic in `lib/recurring-quest-generator.test.ts`
  - [x] 2.13 Write unit tests for expiration logic
  - [x] 2.14 Test cron endpoints locally with mock data

- [ ] 3.0 Core Quest Template API & Service Layer
  - [ ] 3.1 Extend `lib/quest-template-service.ts` with new methods: `pauseTemplate()`, `resumeTemplate()`, `getTemplatesByType()`
  - [ ] 3.2 Create `POST /api/quest-templates` endpoint for creating templates
  - [ ] 3.3 Create `GET /api/quest-templates?familyId=X` endpoint for listing templates
  - [ ] 3.4 Create `GET /api/quest-templates/:id` endpoint for single template
  - [ ] 3.5 Create `PATCH /api/quest-templates/:id` endpoint for updating templates
  - [ ] 3.6 Create `DELETE /api/quest-templates/:id` endpoint (soft delete via `is_active=false`)
  - [ ] 3.7 Create `PATCH /api/quest-templates/:id/pause` endpoint for pausing templates
  - [ ] 3.8 Create `PATCH /api/quest-templates/:id/resume` endpoint for resuming templates
  - [ ] 3.9 Add validation using Zod schemas for all template operations
  - [ ] 3.10 Add authorization checks: ensure user is Guild Master of the template's family
  - [ ] 3.11 Write unit tests for extended template service methods
  - [ ] 3.12 Write API route tests for all template endpoints
  - [ ] 3.13 Test template CRUD operations with Postman or similar tool

- [ ] 4.0 Family Quest Claiming & Individual Quest Assignment Logic
  - [ ] 4.1 Create `lib/quest-instance-service.ts` with methods: `claimQuest()`, `releaseQuest()`, `assignQuest()`
  - [ ] 4.2 Implement `claimQuest()`: check hero has no active family quest, update `assigned_to_id`, set `volunteered_by`, calculate `volunteer_bonus`
  - [ ] 4.3 Implement `releaseQuest()`: clear `assigned_to_id` and `volunteered_by`, return quest to AVAILABLE status
  - [ ] 4.4 Implement `assignQuest()` (GM manual assignment): set `assigned_to_id` without volunteer bonus
  - [ ] 4.5 Add one-family-quest-per-hero enforcement: update `characters.active_family_quest_id` on claim, clear on release/completion
  - [ ] 4.6 Create `POST /api/quests/:id/claim` endpoint with hero authentication
  - [ ] 4.7 Create `POST /api/quests/:id/release` endpoint (hero or GM can release)
  - [ ] 4.8 Create `POST /api/quests/:id/assign` endpoint (GM only) for manual assignment
  - [ ] 4.9 Add validation: prevent claiming if hero already has active family quest
  - [ ] 4.10 Add real-time event publishing via Supabase when quest is claimed/released
  - [ ] 4.11 Write unit tests for `quest-instance-service.ts` claim/release/assign methods
  - [ ] 4.12 Write API route tests for claiming endpoints
  - [ ] 4.13 Test claiming flow with multiple heroes to verify anti-hoarding

- [ ] 5.0 Streak Tracking System
  - [ ] 5.1 Create `lib/streak-service.ts` with methods: `getStreak()`, `incrementStreak()`, `resetStreak()`, `calculateStreakBonus()`
  - [ ] 5.2 Implement `incrementStreak()`: update `current_streak`, update `longest_streak` if exceeded, set `last_completed_date`
  - [ ] 5.3 Implement `resetStreak()`: set `current_streak` to 0 (called when quest is missed)
  - [ ] 5.4 Implement `calculateStreakBonus()`: +1% per 5-day streak, capped at +5% (25-day streak)
  - [ ] 5.5 Implement streak validation: check if quest completion is consecutive (no gaps)
  - [ ] 5.6 Integrate streak increment into quest approval workflow (when GM approves recurring quest)
  - [ ] 5.7 Apply streak bonus to quest rewards during approval
  - [ ] 5.8 Create `GET /api/streaks?characterId=X` endpoint to fetch character's streaks
  - [ ] 5.9 Create `GET /api/streaks/leaderboard?familyId=X` endpoint for family streak rankings
  - [ ] 5.10 Handle streak freeze during vacation mode (check if template is paused before resetting)
  - [ ] 5.11 Write unit tests for `streak-service.ts` methods (increment, reset, bonus calculation)
  - [ ] 5.12 Write tests for streak edge cases: timezone handling, daily vs weekly streaks
  - [ ] 5.13 Test streak integration with quest approval flow

- [ ] 6.0 Quest Template Management UI (GM Dashboard)
  - [ ] 6.1 Create `components/quest-template-dashboard.tsx` component with template list view
  - [ ] 6.2 Display templates grouped by quest type (INDIVIDUAL vs FAMILY) with visual indicators
  - [ ] 6.3 Show recurrence pattern (DAILY, WEEKLY) with badges and next generation time
  - [ ] 6.4 Add pause/resume toggle for each template with visual "PAUSED" indicator
  - [ ] 6.5 Create `components/quest-template-form.tsx` modal/drawer for create/edit operations
  - [ ] 6.6 Add form fields: name, description, quest type, recurrence pattern, difficulty, rewards
  - [ ] 6.7 Add character multi-select for INDIVIDUAL quests (show all family members)
  - [ ] 6.8 Add validation: ensure at least one character selected for INDIVIDUAL quests
  - [ ] 6.9 Implement edit functionality with "Apply to future instances" vs "Apply to current too" choice
  - [ ] 6.10 Add delete confirmation dialog with options to keep/delete active instances
  - [ ] 6.11 Integrate form with API endpoints (POST/PATCH/DELETE)
  - [ ] 6.12 Add success/error toast notifications for all operations
  - [ ] 6.13 Implement real-time updates: refresh template list when changes occur
  - [ ] 6.14 Add filtering/sorting: by type, by recurrence, by active/paused status
  - [ ] 6.15 Write unit tests for `quest-template-dashboard.tsx` component
  - [ ] 6.16 Write unit tests for `quest-template-form.tsx` component
  - [ ] 6.17 Integrate template dashboard into `components/admin-dashboard.tsx` as a new tab

- [ ] 7.0 Hero Quest Dashboard Updates (Claiming & Display)
  - [ ] 7.1 Create `components/family-quest-claiming.tsx` component for displaying claimable family quests
  - [ ] 7.2 Show "Available Family Quests" section with call-to-action if hero has no active family quest
  - [ ] 7.3 Display volunteer bonus prominently (+20% XP/Gold badge)
  - [ ] 7.4 Add "Claim Quest" button for each available family quest
  - [ ] 7.5 Disable claiming if hero already has active family quest with clear error message
  - [ ] 7.6 Show "Release Quest" button on claimed family quest (allow hero to unclaim)
  - [ ] 7.7 Create `components/recurring-quest-card.tsx` for displaying recurring quest instances
  - [ ] 7.8 Add visual indicators for recurring vs one-time quests (🔄 icon, "DAILY"/"WEEKLY" badge)
  - [ ] 7.9 Add visual indicators for INDIVIDUAL vs FAMILY quests (👤/👥 icons)
  - [ ] 7.10 Create `components/streak-display.tsx` component showing current streak with fire emoji 🔥
  - [ ] 7.11 Display streak bonus calculation on quest card (e.g., "+1.5% streak bonus")
  - [ ] 7.12 Update `components/quest-dashboard.tsx` to integrate family quest claiming section
  - [ ] 7.13 Show active family quest separately from individual quests with clear distinction
  - [ ] 7.14 Add real-time updates: refresh when family quest is claimed/released by another hero
  - [ ] 7.15 Update `components/animations/QuestCompleteOverlay.tsx` to show volunteer bonus and streak bonus on completion
  - [ ] 7.16 Write unit tests for `family-quest-claiming.tsx` component
  - [ ] 7.17 Write unit tests for `recurring-quest-card.tsx` component
  - [ ] 7.18 Write unit tests for `streak-display.tsx` component

- [ ] 8.0 Preset Templates & Conversion Features
  - [ ] 8.1 Create `lib/preset-templates.ts` with preset template definitions (Personal Hygiene, Bedroom Chores, Kitchen, etc.)
  - [ ] 8.2 Define presets with suggested: quest_type, recurrence_pattern, difficulty, base rewards
  - [ ] 8.3 Organize presets into categories: Hygiene, Bedroom, Kitchen, Pet Care, Homework, Outdoor, Family Activities
  - [ ] 8.4 Create `POST /api/quest-templates/presets/:presetId/enable` endpoint to enable preset for family
  - [ ] 8.5 Create `GET /api/quest-templates/presets` endpoint to fetch all preset definitions
  - [ ] 8.6 Create `components/preset-template-library.tsx` modal/drawer showing categorized presets
  - [ ] 8.7 Display presets in accordion/tabs grouped by category
  - [ ] 8.8 Show preview of each preset: name, type, recurrence, suggested rewards
  - [ ] 8.9 Add "Add to Family" button for each preset with customization option
  - [ ] 8.10 Create customization form: allow GM to modify name, rewards, assigned characters before enabling
  - [ ] 8.11 Create `components/quest-conversion-wizard.tsx` for converting existing quests to templates
  - [ ] 8.12 Add "Convert to Template" action on existing one-time quests in GM dashboard
  - [ ] 8.13 Wizard steps: 1) Select quest type, 2) Select recurrence, 3) Assign characters (if INDIVIDUAL), 4) Confirm
  - [ ] 8.14 Add option to delete original one-time quest after conversion
  - [ ] 8.15 Integrate preset library into admin dashboard with prominent "Browse Presets" button
  - [ ] 8.16 Write unit tests for preset enabling logic
  - [ ] 8.17 Write unit tests for `preset-template-library.tsx` component
  - [ ] 8.18 Write unit tests for `quest-conversion-wizard.tsx` component

- [ ] 9.0 Analytics Dashboard & Quest History
  - [ ] 9.1 Create analytics service: `lib/analytics-service.ts` with methods for completion rate, missed quests, volunteer patterns
  - [ ] 9.2 Implement `getCompletionRateByTemplate()`: calculate % of completed vs missed/expired quests per template
  - [ ] 9.3 Implement `getMostMissedQuests()`: identify templates with lowest completion rates
  - [ ] 9.4 Implement `getVolunteerPatterns()`: track which heroes volunteer most often for family quests
  - [ ] 9.5 Create `GET /api/analytics/quest-templates?familyId=X` endpoint for template analytics
  - [ ] 9.6 Create `GET /api/analytics/family-quests?familyId=X` endpoint for family quest claiming stats
  - [ ] 9.7 Create `components/recurring-quest-analytics.tsx` component for GM insights
  - [ ] 9.8 Display completion rate per template with visual progress bars
  - [ ] 9.9 Show most frequently missed quests with recommendations (adjust difficulty/rewards)
  - [ ] 9.10 Show volunteer leaderboard: who claims family quests most often
  - [ ] 9.11 Display streak leaderboard: who has longest active streaks
  - [ ] 9.12 Add time range filter: last 7 days, last 30 days, all time
  - [ ] 9.13 Create quest history view for individual characters showing completed/missed recurring quests
  - [ ] 9.14 Add export functionality: download analytics as CSV (optional enhancement)
  - [ ] 9.15 Integrate analytics dashboard into admin dashboard as "Quest Analytics" tab
  - [ ] 9.16 Write unit tests for `analytics-service.ts` methods
  - [ ] 9.17 Write unit tests for `recurring-quest-analytics.tsx` component

- [ ] 10.0 Testing, Documentation & Polish
  - [ ] 10.1 Run full Jest unit test suite: `npm test` and ensure >85% coverage
  - [ ] 10.2 Fix any failing unit tests from previous tasks
  - [ ] 10.3 Add integration tests for cron job endpoints (mock Supabase calls)
  - [ ] 10.4 Test timezone handling: verify quests generate at correct local midnight
  - [ ] 10.5 Test streak edge cases: consecutive completions, missed days, pause/resume
  - [ ] 10.6 Test anti-hoarding: verify one-family-quest-per-hero limit enforcement
  - [ ] 10.7 Test volunteer bonus calculation: verify 20% bonus applies correctly
  - [ ] 10.8 Test streak bonus calculation: verify scaling up to +5% cap
  - [ ] 10.9 Manual QA: create templates, generate quests, claim family quests, test streaks
  - [ ] 10.10 Manual QA: pause templates, verify streaks freeze and quests don't generate
  - [ ] 10.11 Manual QA: test preset enabling and quest conversion flows
  - [ ] 10.12 Performance testing: verify cron jobs run efficiently with 100+ families
  - [ ] 10.13 Update `CLAUDE.md` with recurring quest system documentation
  - [ ] 10.14 Update `TASKS.md` to mark recurring quest system as complete
  - [ ] 10.15 Create user-facing documentation: GM guide for recurring quests
  - [ ] 10.16 Create user-facing documentation: Hero guide for claiming family quests
  - [ ] 10.17 Run `npm run build` to verify no TypeScript errors
  - [ ] 10.18 Run `npm run lint` to verify no linting issues
  - [ ] 10.19 Commit all changes with descriptive commit messages following project conventions
  - [ ] 10.20 Create pull request from feature branch to main with comprehensive description

---

## Implementation Notes

### Development Workflow
1. **Start on feature branch**: `git checkout -b feature/recurring-quest-system`
2. **Follow TDD**: Write unit tests first, then implementation (Red-Green-Refactor)
3. **Commit frequently**: Make focused commits after each completed sub-task
4. **Run quality gates**: `npm run build && npm run lint && npm test` before each commit

### Testing Strategy (Unit Tests Only)
- **Unit tests** with Jest for all services, utilities, and components
- **No E2E tests** in this implementation (Playwright temporarily removed)
- Target **>85% code coverage**
- Mock Supabase calls in unit tests using `jest.mock()`

### Key Technical Decisions
- **Cron jobs**: Use node-cron for self-hosted deployment (runs every 5 minutes)
- **Volunteer bonus**: Fixed at 20% (configurable in service layer for future flexibility)
- **Streak bonus**: +1% per 5-day streak, capped at +5% (25 days)
- **Timezone handling**: Store family timezone in `families` table, use for midnight calculations
- **Real-time updates**: Leverage existing `lib/realtime-context.tsx` for quest claim/release events

### Migration Strategy
- Run migrations locally first: `npx supabase db push`
- Test with seed data before deploying to production
- Regenerate TypeScript types after schema changes

### Performance Considerations
- Add database indexes on frequently queried columns (`cycle_end_date`, `status`)
- Batch quest generation per family in cron jobs
- Cache active templates in memory during cron execution
- Implement archiving for old quest instances (>90 days) in future enhancement

---

**End of Task List**
