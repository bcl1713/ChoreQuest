# PRD-0009: Recurring Quest System

## Introduction/Overview

ChoreQuest currently supports one-time quests that must be manually recreated by Guild Masters. This creates significant overhead for daily and weekly recurring tasks like "make bed," "brush teeth," "take out trash," and "mow lawn." This feature introduces a comprehensive recurring quest system that automatically generates quest instances on a daily, weekly, or custom schedule. The system supports two quest types: **Individual Quests** (auto-assigned to specific characters) and **Family Quests** (claimable by any character with fairness mechanics). This will dramatically reduce GM workload while encouraging consistent participation through streak bonuses and volunteer incentives.

## Goals

1. **Reduce GM Workload**: Eliminate manual recreation of daily/weekly chores by automating quest generation
2. **Encourage Consistency**: Use streak bonuses to reward daily/weekly participation and habit-building
3. **Promote Fairness**: Implement family quest claiming system with anti-hoarding mechanics
4. **Incentivize Volunteering**: Reward proactive quest claiming with bonus XP/gold
5. **Support Flexibility**: Allow GM to pause quests during vacations or special circumstances
6. **Maintain Engagement**: Track missed quests and streaks to provide meaningful progress feedback

## Status Update — October 2025

**Delivered in `feature/recurring-quest-system`:**
- Recurring quest templates with daily/weekly patterns, pause/resume controls, and per-character assignments.
- Cron-backed quest generation and expiration endpoints secured with `CRON_SECRET`, wired up through Next.js instrumentation.
- Family quest claiming flow with volunteer bonuses, anti-hoarding guardrails, and Supabase realtime updates.
- Streak tracking service, streak bonuses, and hero UI surfaces (streak display, claim/release interactions, quest completion overlay).
- Initial preset template definitions plus API plumbing (`GET /api/quest-templates/presets`, enable endpoint) and conversion wizard foundations.
- Supabase RPC analytics helpers for completion rate, missed quests, volunteer patterns (UI integration pending).

**Still in progress / deferred:**
- GM-facing analytics dashboard and history views powered by the new RPCs.
- Enhanced preset library UX (admin dashboard entry point, unit tests).
- Multi-step conversion wizard with character assignment and richer confirmation flow.
- Comprehensive documentation set (GM/Hero guides), CLAUDE/TASKS roll-up, end-to-end QA checklist execution.
- Additional automation and performance testing (cron load, timezone edge cases).

These deferred items will be scheduled on a follow-up branch so this PR can focus on the core recurring quest functionality.

## User Stories

1. **As a Guild Master**, I want to create a recurring quest template for "make bed" that automatically assigns to my children every day, so that I don't have to manually create this quest repeatedly.

2. **As a Guild Master**, I want to create weekly recurring quests like "clean bedroom" that auto-assign to specific characters on Sunday, so that room cleaning happens on a consistent schedule.

3. **As a Guild Master**, I want to create claimable family quests like "take out trash" or "load dishwasher" that any hero can volunteer for, so that flexible chores get completed without me micromanaging assignments.

4. **As a Hero**, I want to claim family quests to earn a volunteer bonus, so that I'm rewarded for being proactive about helping the family.

5. **As a Guild Master**, I want to prevent quest hoarding by limiting heroes to one active family quest at a time, so that one person doesn't claim everything and prevent others from participating.

6. **As a Guild Master**, I want to manually release a claimed quest if it's not getting done, so that it can be reassigned or claimed by someone else.

7. **As a Guild Master**, I want to manually assign unclaimed family quests to specific heroes when they're not getting picked up, so that important tasks still get done.

8. **As a Hero**, I want to see my streak count for recurring quests (e.g., "Made bed 7 days in a row"), so that I feel motivated to maintain consistency.

9. **As a Hero**, I want streak bonuses that increase my rewards for maintaining consistency, so that building good habits is extra rewarding.

10. **As a Guild Master**, I want to enable vacation mode to pause specific quests without breaking streaks, so that my family isn't penalized when we're away from home.

11. **As a Guild Master**, I want to see which recurring quests are frequently missed or unclaimed, so that I can adjust expectations or rewards.

12. **As a Guild Master**, I want to start with preset recurring quest templates (brush teeth, make bed, homework, etc.) that I can enable and customize, so that I don't have to build everything from scratch.

13. **As a Guild Master**, I want to convert existing one-time quests into recurring templates, so that I can reuse quests I've already created.

14. **As a Hero**, I want to clearly see which quests are recurring vs one-time and which are individual vs family quests, so that I understand the expectations.

15. **As a Hero**, I want to release a family quest I've claimed if I realize I can't complete it, so that someone else can pick it up.

## Functional Requirements

### 1. Quest Template System

**FR-1.1**: The system must support creating **Quest Templates** that serve as blueprints for recurring quest instances.

**FR-1.2**: Each quest template must have:
- Name, description, category, difficulty, base XP, base gold, base gems (if applicable)
- **Quest Type**: `INDIVIDUAL` or `FAMILY`
- **Recurrence Pattern**: `DAILY`, `WEEKLY`, or future: `CUSTOM`
- **Active Status**: Can be paused/disabled without deleting
- Assigned characters (for INDIVIDUAL quests only)

**FR-1.3**: Quest templates must be family-scoped (only visible/editable by the creating family's Guild Master(s)).

**FR-1.4**: Guild Masters must be able to create, edit, pause, resume, and delete quest templates.

**FR-1.5**: Editing a template must allow GM to choose:
- Apply changes to **future instances only** (default)
- Apply changes to **current active instance** as well

**FR-1.6**: Deleting a template must:
- Warn GM that this will stop future quest generation
- Optionally clean up pending/active instances (GM choice: keep or delete)

### 2. Individual Quest Templates

**FR-2.1**: INDIVIDUAL quest templates must allow GM to select one or more characters to receive the quest automatically.

**FR-2.2**: When an individual recurring quest generates:
- One quest instance is created **per assigned character**
- Each character sees their own individual instance (not shared)
- Completion by one character does not affect others' instances

**FR-2.3**: Individual quests must auto-assign to the designated characters when generated (no claiming required).

**FR-2.4**: Individual quests cannot be claimed or transferred between characters.

**FR-2.5**: Examples: "Make your bed," "Brush teeth," "Complete homework"

### 3. Family Quest Templates

**FR-3.1**: FAMILY quest templates must generate a **single shared quest instance** per cycle that can be claimed by any family member.

**FR-3.2**: Family quests must start in a **CLAIMABLE** state (not assigned to anyone).

**FR-3.3**: Heroes must be able to browse available claimable family quests and click "Claim Quest" to assign it to themselves.

**FR-3.4**: A hero can only have **one active family quest at a time** (anti-hoarding limit).

**FR-3.5**: If a hero tries to claim a second family quest while one is active, the system must prevent it with a clear message: "You already have an active family quest. Complete or release it first."

**FR-3.6**: Heroes must be able to **release** (unclaim) a family quest they've claimed, returning it to the claimable pool immediately.

**FR-3.7**: Guild Masters must be able to manually **release** a claimed family quest (e.g., if a hero claimed it but isn't completing it), returning it to the claimable pool.

**FR-3.8**: Guild Masters must be able to manually **assign** an unclaimed family quest to a specific hero (overrides the volunteering system).

**FR-3.9**: When a hero **voluntarily claims** a family quest, they receive a **volunteer bonus** (recommended: +20% XP and gold).

**FR-3.10**: When a GM **manually assigns** a family quest, the hero receives the standard rewards (no volunteer bonus).

**FR-3.11**: Family quests that are manually assigned must still count toward the hero's "one active family quest" limit.

**FR-3.12**: Examples: "Load dishwasher," "Take out trash," "Mow lawn," "Vacuum living room"

### 4. Recurrence Pattern: Daily Quests

**FR-4.1**: DAILY quest templates must generate new quest instances **once per day at midnight** (12:00 AM in the family's timezone).

**FR-4.2**: Daily quests from the previous day must **expire at midnight** and be marked as MISSED if not completed.

**FR-4.3**: Missed daily quests must:
- Be visible in quest history as "MISSED"
- Break the streak for that specific quest (unless vacation mode is active)
- Still count toward the character's overall quest statistics

**FR-4.4**: Completed daily quests must remain visible until midnight with a "COMPLETED" status, then archive.

**FR-4.5**: Daily quests completed early (e.g., 7 AM) must stay completed for the rest of the day (no multiple completions per day).

### 5. Recurrence Pattern: Weekly Quests

**FR-5.1**: WEEKLY quest templates must generate new quest instances **once per week** on a configurable day.

**FR-5.2**: Week start day must be **configurable per family** (e.g., "Our week starts on Monday" or "Sunday").

**FR-5.3**: Weekly quests must expire at the end of the week (11:59 PM on the last day) and be marked as MISSED if not completed.

**FR-5.4**: Weekly quests can be completed at any point during the week (don't require daily check-ins).

**FR-5.5**: Examples: "Clean bedroom," "Organize closet," "Family game night"

### 6. Recurrence Pattern: Future CUSTOM Support (Out of Scope for Initial Release)

**FR-6.1**: The system must be designed to support future custom patterns, such as:
- Every N days (e.g., "every 3 days")
- Specific days of the week (e.g., "Monday, Wednesday, Friday")
- Monthly (e.g., "first Sunday of each month")

**FR-6.2**: Database schema and template structure must accommodate future pattern types without major refactoring.

### 7. Streak Tracking System

**FR-7.1**: The system must track **consecutive completions** for each recurring quest per character.

**FR-7.2**: Streak definition:
- **Daily quests**: Completed on consecutive days (e.g., 7 days in a row)
- **Weekly quests**: Completed on consecutive weeks (e.g., 4 weeks in a row)

**FR-7.3**: Streaks must be **quest-specific** (each recurring quest has its own streak, not a global streak).

**FR-7.4**: Streaks must be visible to the hero on their quest dashboard (e.g., "🔥 7-day streak").

**FR-7.5**: Completing a recurring quest must increment the streak by 1.

**FR-7.6**: Missing a recurring quest must reset the streak to 0 (unless vacation mode is active for that quest).

**FR-7.7**: Streak bonuses must apply to quest rewards:
- Scaling bonus formula: **+1% per 5-day streak** (or +1% per week for weekly quests)
- **Maximum cap**: +5% at 25-day streak (daily) or 25-week streak (weekly)
- Example: 15-day streak = +3% XP/gold

**FR-7.8**: Streak bonuses must be clearly displayed when completing the quest (e.g., "50 XP + 3 streak bonus = 51.5 XP").

**FR-7.9**: Streaks must persist across quest cycles (don't reset when a new instance generates).

### 8. Vacation Mode / Quest Pausing

**FR-8.1**: Guild Masters must be able to **pause specific quest templates** to prevent generation during vacations or special circumstances.

**FR-8.2**: Pausing a quest template must:
- Stop generating new instances until resumed
- **Not break active streaks** (streaks are frozen, not reset)
- Display a "PAUSED" indicator on the template in GM dashboard

**FR-8.3**: Guild Masters must be able to pause:
- Individual quest templates (e.g., "pause 'make bed' for vacation week")
- Family quest templates (e.g., "pause 'mow lawn' during winter")
- Multiple quests at once (bulk pause action)

**FR-8.4**: Pausing must be quest-specific (not all-or-nothing family-wide mode).

**FR-8.5**: Resuming a paused quest must start generating instances again on the next scheduled cycle.

**FR-8.6**: (Future consideration): Support per-character vacation mode (e.g., "Timmy is at summer camp for 2 weeks").

### 9. Quest History & Missed Tracking

**FR-9.1**: The system must maintain a **quest history** for each character showing:
- Completed quests (with timestamp and rewards earned)
- Missed quests (with timestamp and reason: expired or never claimed)
- Current streaks and past streaks

**FR-9.2**: Missed quests must be clearly marked and distinguishable from failed/abandoned quests.

**FR-9.3**: Guild Masters must have access to a **recurring quest analytics dashboard** showing:
- Completion rate per quest template (e.g., "Make bed: 85% completion rate")
- Most frequently missed quests
- Streaks leaderboard (who has the longest streaks)
- Family quest claiming patterns (who volunteers most often)

**FR-9.4**: Quest history must be filterable by:
- Time range (last 7 days, last 30 days, all time)
- Quest template (show history for specific quest)
- Character (show one hero's history)
- Status (completed, missed, active)

### 10. Preset Quest Templates

**FR-10.1**: The system must provide **common preset templates** that Guild Masters can enable and customize.

**FR-10.2**: Preset categories must include:
- **Personal Hygiene**: Brush teeth (daily), Shower (daily), Wash hands before meals (daily)
- **Bedroom Chores**: Make bed (daily), Clean room (weekly), Organize closet (weekly)
- **Kitchen Chores**: Load dishwasher (daily family quest), Unload dishwasher (daily family quest), Set table (daily family quest), Clear table (daily family quest)
- **Pet Care**: Feed pet (daily), Walk dog (daily), Clean litter box (daily/weekly)
- **Homework & Education**: Complete homework (daily), Reading time (daily), Practice instrument (daily)
- **Outdoor Chores**: Take out trash (weekly family quest), Mow lawn (weekly family quest), Water plants (weekly)
- **Family Activities**: Family game night (weekly), Help sibling (weekly), Family dinner (daily)

**FR-10.3**: Preset templates must include suggested:
- Quest type (INDIVIDUAL or FAMILY)
- Recurrence pattern (DAILY or WEEKLY)
- Difficulty level (EASY, MEDIUM, HARD)
- Base rewards (XP, gold)

**FR-10.4**: Guild Masters must be able to customize presets before enabling (change name, rewards, assignments, etc.).

**FR-10.5**: Preset templates must be presented in a categorized library/gallery UI for easy browsing.

### 11. Converting Existing Quests to Templates

**FR-11.1**: Guild Masters must be able to select an existing one-time quest and convert it into a recurring template.

**FR-11.2**: The conversion wizard must:
- Preserve name, description, category, difficulty, rewards
- Prompt GM to select quest type (INDIVIDUAL or FAMILY)
- Prompt GM to select recurrence pattern (DAILY, WEEKLY)
- Prompt GM to assign characters (if INDIVIDUAL) or leave claimable (if FAMILY)
- Ask if the original one-time quest should be deleted or kept

**FR-11.3**: Converted templates must immediately start generating instances on the next scheduled cycle.

### 12. UI/UX Requirements

**FR-12.1**: Recurring quests must have a **visual indicator** distinguishing them from one-time quests:
- Icon: 🔄 or ↻ next to quest name
- Badge: "DAILY" or "WEEKLY" label
- Color accent or border style

**FR-12.2**: Individual vs Family quests must have distinct visual indicators:
- Individual quests: 👤 icon or "Personal" badge
- Family quests: 👥 icon or "Family" badge

**FR-12.3**: Claimable family quests must appear in a **separate "Available Family Quests"** section on the hero dashboard.

**FR-12.4**: Family quests must show:
- "Claim Quest" button (if hero has no active family quest)
- "Already Claimed" or "Release Quest" button (if hero has claimed it)
- "Assigned to [Name]" (if someone else claimed it or GM assigned it)

**FR-12.5**: Quest templates in GM dashboard must show:
- Recurrence schedule (e.g., "Generates daily at midnight")
- Assigned characters (for INDIVIDUAL) or "Claimable by any hero" (for FAMILY)
- Active/Paused status toggle
- Edit, Pause, Resume, Delete actions

**FR-12.6**: Hero quest dashboard must show:
- Active individual recurring quests (with streak count)
- Active family quest (if claimed/assigned)
- Available family quests to claim (if hero has no active family quest)

**FR-12.7**: Quest completion screen must display:
- Streak count (e.g., "🔥 8-day streak!")
- Streak bonus applied (e.g., "+1.5% bonus from streak")
- Volunteer bonus (if applicable, e.g., "+20% for volunteering")

**FR-12.8**: Streak milestones must trigger celebration animations:
- 7-day streak: Bronze badge
- 14-day streak: Silver badge
- 30-day streak: Gold badge
- Visual confetti or particle effects

### 13. Approval Workflow for Family Quests

**FR-13.1**: Recurring quests (both INDIVIDUAL and FAMILY) must follow the same approval workflow as one-time quests:
- Hero marks quest as "Completed" (PENDING_APPROVAL status)
- GM reviews and approves or rejects
- Upon approval, hero receives rewards and streak increments

**FR-13.2**: If a GM rejects a recurring quest completion:
- Streak does NOT increment
- Quest returns to ASSIGNED or CLAIMABLE state
- Hero can attempt again before the cycle expires

**FR-13.3**: Missed quests (expired without completion) do NOT require GM action (auto-marked as MISSED).

### 14. Notifications & Reminders (Future Enhancement - Out of Initial Scope)

**FR-14.1**: Future enhancements may include push notifications for:
- New recurring quest generated (daily/weekly)
- Unclaimed family quest sitting for X hours
- Streak about to break (e.g., "Complete 'Make bed' by midnight to maintain your 10-day streak!")
- Family quest claimed by someone else

**FR-14.2**: Notification preferences must be configurable per user (opt-in).

## Non-Goals (Out of Scope)

1. **Monthly or Custom Recurrence Patterns**: Only daily and weekly supported initially (custom patterns deferred to future release)
2. **Per-Character Vacation Mode**: Only per-quest pausing supported initially (individual character vacation mode deferred)
3. **Auto-Assignment Rotation for Family Quests**: No automatic "fairness rotation" enforced (GM manually assigns if needed; future enhancement could suggest/enforce rotation)
4. **Quest Chains or Dependencies**: Recurring quests are standalone (no "complete X before unlocking Y")
5. **Dynamic Difficulty Adjustment**: Quest difficulty remains static (no automatic scaling based on completion rates)
6. **Multiple Recurrence Frequencies per Quest**: One quest = one pattern (can't have "daily during weekdays, skip weekends")
7. **Community/Cross-Family Quest Templates**: Templates are family-scoped only (no public template library in initial release)

## Design Considerations

### Existing Design System Integration

- Use existing `.fantasy-card` styling for quest templates and recurring quest cards
- Use existing badge system for "DAILY," "WEEKLY," "FAMILY," "INDIVIDUAL" indicators
- Use existing icon library (Lucide React) with additions:
  - `Repeat` or `RotateCw` for recurring indicator
  - `User` for individual quests
  - `Users` for family quests
  - `Flame` for streak display
  - `Pause` for paused templates

### User Interface Mockups

#### GM Quest Template Dashboard

```
┌───────────────────────────────────────────────────────────┐
│  Quest Templates                           [+ Create New]  │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  🔄 Make Bed (DAILY) 👤 Individual                   [⚙️]  │
│  Assigned to: Alice, Bob                                   │
│  Status: ACTIVE | Next generation: Tomorrow 12:00 AM       │
│  [Edit] [Pause] [Delete]                                   │
│                                                             │
│  🔄 Take Out Trash (WEEKLY) 👥 Family              [⚙️]    │
│  Claimable by: Any hero                                    │
│  Status: ACTIVE | Next generation: Monday 12:00 AM         │
│  [Edit] [Pause] [Delete]                                   │
│                                                             │
│  🔄 Clean Room (WEEKLY) 👤 Individual (PAUSED)     [⚙️]    │
│  Assigned to: Alice, Bob                                   │
│  Status: PAUSED (Vacation mode)                            │
│  [Edit] [Resume] [Delete]                                  │
│                                                             │
└───────────────────────────────────────────────────────────┘
```

#### Hero Quest Dashboard

```
┌───────────────────────────────────────────────────────────┐
│  My Quests                                                 │
├───────────────────────────────────────────────────────────┤
│  🔄 Make Bed (DAILY) 👤                                    │
│  🔥 7-day streak!                                          │
│  Rewards: 50 XP + 25 Gold (+1.5% streak bonus)            │
│  [Mark Complete]                                           │
│                                                             │
│  🔄 Brush Teeth (DAILY) 👤                                 │
│  🔥 12-day streak!                                         │
│  Rewards: 30 XP + 15 Gold (+2.5% streak bonus)            │
│  [Mark Complete]                                           │
│                                                             │
│  ─────────────────────────────────────────────────         │
│  Available Family Quests (Pick one!)                       │
│  ─────────────────────────────────────────────────         │
│                                                             │
│  🔄 Load Dishwasher (DAILY) 👥                            │
│  Rewards: 75 XP + 35 Gold (+20% volunteer bonus!)         │
│  [Claim Quest] ✨                                          │
│                                                             │
│  🔄 Take Out Trash (WEEKLY) 👥                            │
│  Assigned to: Bob                                          │
│  (Someone else already claimed this)                       │
│                                                             │
└───────────────────────────────────────────────────────────┘
```

#### Preset Template Library

```
┌───────────────────────────────────────────────────────────┐
│  Quest Template Library                         [Close]    │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  📂 Personal Hygiene                                       │
│    ✅ Brush Teeth (Daily, Individual) [Add to Family]     │
│    ✅ Take a Shower (Daily, Individual) [Add to Family]   │
│    ✅ Wash Hands (Daily, Individual) [Add to Family]      │
│                                                             │
│  📂 Bedroom Chores                                         │
│    ✅ Make Bed (Daily, Individual) [Add to Family]        │
│    ✅ Clean Room (Weekly, Individual) [Add to Family]     │
│                                                             │
│  📂 Kitchen Chores                                         │
│    ✅ Load Dishwasher (Daily, Family) [Add to Family]     │
│    ✅ Unload Dishwasher (Daily, Family) [Add to Family]   │
│    ✅ Set Table (Daily, Family) [Add to Family]           │
│                                                             │
│  📂 Pet Care                                               │
│    ✅ Feed Pet (Daily, Individual) [Add to Family]        │
│    ✅ Walk Dog (Daily, Family) [Add to Family]            │
│                                                             │
└───────────────────────────────────────────────────────────┘
```

## Technical Considerations

> **Platform Note:** The original PRD called for Prisma-based models. The current implementation uses Supabase SQL migrations (`supabase/migrations/*`) and generated types in `lib/types/database-generated.ts`. The Prisma schema below is kept for historical context; reference the Supabase migrations for the authoritative schema.

### Database Schema Changes (Prisma)

**New Models:**

```prisma
model QuestTemplate {
  id               String             @id @default(cuid())
  familyId         String
  family           Family             @relation(fields: [familyId], references: [id], onDelete: Cascade)

  name             String
  description      String?
  category         String?
  difficulty       Difficulty         @default(MEDIUM)

  questType        QuestType          // INDIVIDUAL or FAMILY
  recurrencePattern RecurrencePattern // DAILY, WEEKLY, CUSTOM

  baseXp           Int
  baseGold         Int
  baseGems         Int                @default(0)
  baseHonor        Int                @default(0)

  isActive         Boolean            @default(true)  // Can be paused
  isPaused         Boolean            @default(false) // Vacation mode

  // For INDIVIDUAL quests: which characters are assigned
  assignedCharacterIds String[]        @default([])

  // For WEEKLY quests: which day of week to generate (0 = Sunday, 6 = Saturday)
  weekStartDay     Int?               // For WEEKLY patterns

  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  // Track generated instances (optional, for history)
  questInstances   QuestInstance[]

  @@index([familyId])
  @@index([familyId, isActive])
}

model QuestInstance {
  id                String             @id @default(cuid())
  templateId        String?            // Null for one-time quests
  template          QuestTemplate?     @relation(fields: [templateId], references: [id], onDelete: SetNull)

  familyId          String
  family            Family             @relation(fields: [familyId], references: [id], onDelete: Cascade)

  // Existing fields (unchanged)
  name              String
  description       String?
  category          String?
  difficulty        Difficulty         @default(MEDIUM)

  questType         QuestType          // INDIVIDUAL or FAMILY (denormalized from template)

  assignedToId      String?            // For INDIVIDUAL: auto-assigned; For FAMILY: claimed hero
  assignedTo        Character?         @relation("AssignedQuests", fields: [assignedToId], references: [id], onDelete: Cascade)

  status            QuestStatus        @default(AVAILABLE) // AVAILABLE, CLAIMED, IN_PROGRESS, PENDING_APPROVAL, COMPLETED, MISSED

  baseXp            Int
  baseGold          Int
  baseGems          Int                @default(0)
  baseHonor         Int                @default(0)

  xpAwarded         Int?
  goldAwarded       Int?
  gemsAwarded       Int?
  honorAwarded      Int?

  volunteeredBy     String?            // CharacterId if claimed voluntarily (for bonus)
  volunteerBonus    Float?             // e.g., 0.20 for 20% bonus

  streakCount       Int                @default(0) // Streak at time of this instance
  streakBonus       Float              @default(0) // e.g., 0.03 for 3% bonus

  cycleStartDate    DateTime           // When this cycle started (midnight for daily, week start for weekly)
  cycleEndDate      DateTime           // When this cycle expires

  createdAt         DateTime           @default(now())
  completedAt       DateTime?
  approvedAt        DateTime?
  approvedById      String?
  approvedBy        User?              @relation("ApprovedQuests", fields: [approvedById], references: [id], onDelete: SetNull)

  @@index([familyId])
  @@index([assignedToId])
  @@index([templateId])
  @@index([status])
  @@index([cycleEndDate]) // For cleanup/missed tracking
}

model CharacterQuestStreak {
  id             String        @id @default(cuid())
  characterId    String
  character      Character     @relation(fields: [characterId], references: [id], onDelete: Cascade)

  templateId     String
  template       QuestTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)

  currentStreak  Int           @default(0)
  longestStreak  Int           @default(0)
  lastCompletedDate DateTime?   // Track last completion to determine if streak continues

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@unique([characterId, templateId])
  @@index([characterId])
  @@index([templateId])
}

enum QuestType {
  INDIVIDUAL
  FAMILY
}

enum RecurrencePattern {
  DAILY
  WEEKLY
  CUSTOM   // Future use
}

enum QuestStatus {
  AVAILABLE         // Family quest, not yet claimed
  CLAIMED           // Family quest claimed by hero
  IN_PROGRESS       // Individual quest or claimed family quest in progress
  PENDING_APPROVAL  // Marked complete by hero, awaiting GM approval
  COMPLETED         // Approved by GM
  MISSED            // Cycle expired without completion
  REJECTED          // GM rejected completion (rare)
}
```

**Updated Models:**

- `Character` model: Add `activeFamily QuestId?` to enforce one-family-quest limit
- `Family` model: Add `weekStartDay Int @default(0)` for weekly quest scheduling

### Background Job / Cron System

**FR-Tech-1**: Implement a **cron job** or scheduled task that runs **every minute** to check for quest generation needs.

**FR-Tech-2**: Quest generation logic:
- Query all active (`isActive = true`, `isPaused = false`) quest templates
- For DAILY templates: Check if current time is past midnight and no instance exists for today
- For WEEKLY templates: Check if current day matches `weekStartDay` and no instance exists for this week
- Generate quest instances:
  - INDIVIDUAL: Create one instance per assigned character
  - FAMILY: Create one instance in AVAILABLE status

**FR-Tech-3**: Quest expiration logic:
- Query all quest instances where `cycleEndDate < now()` and `status IN (AVAILABLE, CLAIMED, IN_PROGRESS)`
- Mark as `MISSED`
- Update streak: Reset streak to 0 (unless quest template is paused)

**FR-Tech-4**: Use **node-cron** or **Bull Queue** (already in tech stack) for scheduling.

**FR-Tech-5**: Ensure idempotency (don't generate duplicate instances if cron runs twice).

### API Endpoints

**Quest Template Management (GM only):**
- `POST /api/quest-templates` - Create new template
- `GET /api/quest-templates?familyId=<id>` - List all templates for family
- `GET /api/quest-templates/:id` - Get template details
- `PATCH /api/quest-templates/:id` - Update template
- `DELETE /api/quest-templates/:id` - Delete template
- `PATCH /api/quest-templates/:id/pause` - Pause template
- `PATCH /api/quest-templates/:id/resume` - Resume template

**Quest Instance Management (Heroes & GMs):**
- `GET /api/quests?characterId=<id>&type=recurring` - Get recurring quests for hero
- `GET /api/quests?familyId=<id>&type=available` - Get claimable family quests
- `POST /api/quests/:id/claim` - Claim a family quest
- `POST /api/quests/:id/release` - Release a claimed family quest
- `POST /api/quests/:id/assign` - GM manually assigns family quest
- `PATCH /api/quests/:id/complete` - Mark quest complete
- `PATCH /api/quests/:id/approve` - GM approves quest (existing endpoint, unchanged)

**Streak Management:**
- `GET /api/streaks?characterId=<id>` - Get all streaks for character
- `GET /api/streaks/leaderboard?familyId=<id>` - Get family streak leaderboard

**Preset Templates:**
- `GET /api/quest-templates/presets` - Get preset template library
- `POST /api/quest-templates/presets/:id/enable` - Enable preset for family

**Conversion:**
- `POST /api/quests/:id/convert-to-template` - Convert one-time quest to template

### Integration Points

- **Quest Dashboard (Hero)**: Display individual recurring quests, active family quest, available family quests
- **GM Admin Dashboard**: Quest template management, analytics, manual assignment
- **Quest Completion Flow**: Apply volunteer bonus, streak bonus, update streak records
- **Real-time Updates**: WebSocket events when family quest is claimed/released
- **Approval Workflow**: Existing approval system (no changes needed)

### Performance Considerations

- **Indexing**: Ensure database indexes on `cycleEndDate`, `status`, `familyId`, `templateId` for efficient cron queries
- **Caching**: Cache active templates per family (Redis) to reduce DB queries during generation
- **Batch Operations**: Generate all instances for a family in a single transaction
- **Archiving**: Archive old quest instances (>90 days) to separate table to keep main table performant

## Success Metrics

1. **GM Workload Reduction**: 70% reduction in manual quest creation time for families using recurring quests
2. **Consistency Improvement**: 40% increase in daily quest completion rates (compared to manually recreated quests)
3. **Streak Engagement**: 60% of heroes maintain at least one 7-day streak within first month
4. **Volunteer Participation**: 50% of family quests are claimed voluntarily (not manually assigned)
5. **Feature Adoption**: 80% of families enable at least 3 recurring quest templates within first week
6. **Completion Rate**: 85% completion rate for recurring quests (vs. 70% for one-time quests)
7. **User Satisfaction**: Positive feedback from GMs about reduced micromanagement

## Open Questions

1. **Streak Bonus Cap**: Should the +5% cap be adjustable per family, or is a global cap acceptable?
2. **Volunteer Bonus**: Should the 20% bonus be configurable per quest template, or a global family setting?
3. **Family Quest Limit**: Should the "one active family quest per hero" limit be configurable (e.g., some families allow 2)?
4. **Missed Quest Visibility**: How long should missed quests remain visible in quest history before archiving?
5. **Streak Milestones**: Should there be special achievements/badges for reaching 30, 60, 90-day streaks?
6. **Automatic Assignment**: Should the system suggest which hero should be assigned an unclaimed family quest based on fairness (who has done it least recently)?
7. **Timezone Handling**: How do we handle families with multiple timezones (e.g., divorced parents, kids at different locations)?
8. **Template Sharing**: Should there be a future feature for families to share templates with friends/community?

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
**Goal: Basic template system and daily quest generation**

- Database schema implementation (QuestTemplate, updated QuestInstance, CharacterQuestStreak)
- Prisma migrations
- Cron job system for daily quest generation and expiration
- Basic API endpoints for template CRUD (GM only)
- Individual quest auto-assignment
- Unit tests for quest generation logic

**Deliverable**: GMs can create daily individual quest templates that auto-generate and assign every day.

### Phase 2: Family Quest System (Week 2-3)
**Goal: Claimable family quests with anti-hoarding**

- Family quest claiming/releasing logic
- One-active-family-quest-per-hero enforcement
- Volunteer bonus calculation
- GM manual assignment of family quests
- API endpoints for claim/release/assign
- Real-time WebSocket updates for claim/release events
- Unit tests for claiming logic and bonuses

**Deliverable**: Heroes can claim family quests with volunteer bonuses; GMs can manually assign if needed.

### Phase 3: Streak System (Week 3-4)
**Goal: Streak tracking and bonus rewards**

- CharacterQuestStreak table implementation
- Streak increment on quest completion
- Streak reset on missed quests
- Streak bonus calculation (scaling to +5% cap)
- Streak display in hero dashboard
- Streak leaderboard for family
- Unit tests for streak logic

**Deliverable**: Streaks are tracked, displayed, and provide scaling bonuses.

### Phase 4: Weekly Quests & Pause (Week 4-5)
**Goal: Weekly recurrence and vacation mode**

- Weekly quest generation logic
- Family week start day configuration
- Quest template pause/resume functionality
- Vacation mode (streak freeze) implementation
- Cron job updates for weekly cycle detection
- Unit tests for weekly generation and pausing

**Deliverable**: GMs can create weekly quests and pause templates without breaking streaks.

### Phase 5: Preset Templates & Conversion (Week 5-6)
**Goal: Quick onboarding and template reuse**

- Preset template library (database seed or API)
- Preset template UI (categorized gallery)
- Enable/customize preset flow
- Convert existing quest to template feature
- Unit tests for preset enabling and conversion

**Deliverable**: GMs can quickly set up common recurring quests and convert existing quests.

### Phase 6: UI/UX & Analytics (Week 6-7)
**Goal: Polished interfaces and GM insights**

- GM Quest Template Dashboard (create, edit, pause, delete, analytics)
- Hero Dashboard updates (recurring quest display, claim/release UI)
- Streak visualization (flame icons, milestone badges)
- GM analytics dashboard (completion rates, missed quests, volunteer patterns)
- Quest completion screen updates (show volunteer bonus, streak bonus)
- Responsive design for mobile
- E2E tests for all user flows

**Deliverable**: Full-featured UI for GMs and heroes with analytics and insights.

### Phase 7: Testing, Polish & Documentation (Week 7-8)
**Goal: Production-ready feature**

- Comprehensive unit test coverage (>85%)
- E2E test coverage for all user flows
- Performance optimization (cron job efficiency, query optimization)
- Error handling and edge case coverage
- User documentation (GM guide, hero guide)
- Migration guide for existing families
- Load testing for cron job at scale

**Deliverable**: Production-ready recurring quest system with full test coverage.

## Acceptance Criteria

✅ **Template Creation**: GM can create INDIVIDUAL and FAMILY quest templates with DAILY or WEEKLY recurrence.

✅ **Individual Quests**: Daily/weekly individual quests auto-generate and auto-assign to designated characters at midnight or week start.

✅ **Family Quests**: Daily/weekly family quests generate as claimable, can be claimed by heroes with volunteer bonus.

✅ **Anti-Hoarding**: Heroes are limited to one active family quest at a time.

✅ **Release Mechanism**: Heroes and GMs can release claimed family quests back to the claimable pool.

✅ **Manual Assignment**: GMs can manually assign family quests (no volunteer bonus applied).

✅ **Streak Tracking**: Consecutive completions are tracked per character per quest, with scaling bonuses up to +5%.

✅ **Missed Quest Handling**: Expired quests are marked as MISSED and break streaks (unless paused).

✅ **Vacation Mode**: GMs can pause specific quest templates to freeze streaks and stop generation.

✅ **Weekly Configuration**: Families can set their week start day for weekly quest scheduling.

✅ **Preset Templates**: GMs can browse and enable common preset templates (hygiene, chores, homework, pet care).

✅ **Quest Conversion**: GMs can convert existing one-time quests into recurring templates.

✅ **UI Indicators**: Recurring quests, individual vs family quests, and streaks are visually distinct.

✅ **Approval Workflow**: Recurring quests follow the same GM approval workflow as one-time quests.

✅ **Analytics Dashboard**: GMs can view completion rates, missed quests, and volunteer patterns.

✅ **Real-time Updates**: Family quest claims/releases trigger real-time updates for all family members.

✅ **Performance**: Cron job executes efficiently (<5 seconds for 1000 families); no user-facing lag.

✅ **Test Coverage**: >85% unit test coverage, E2E tests for all user flows.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cron job failure causes missed quest generations | High | Implement retry logic, monitoring, and alerts; idempotent generation logic |
| Timezone handling causes quests to generate at wrong times | High | Store family timezone in DB; use timezone-aware date comparisons |
| Streak calculation bugs cause incorrect bonuses | Medium | Comprehensive unit tests; manual QA for edge cases |
| One-family-quest limit feels too restrictive | Medium | Gather user feedback; consider making limit configurable in future |
| Database performance degrades with thousands of recurring instances | Medium | Implement archiving for old instances; optimize indexes; consider partitioning |
| Users confused by difference between INDIVIDUAL and FAMILY quests | Low | Clear UI indicators, tooltips, onboarding flow explaining quest types |
| GM accidentally deletes template and loses all quest history | Medium | Soft delete templates; confirm deletion with warning; allow restore |
| Volunteer bonus feels unfair to heroes who are manually assigned | Low | Educate GMs on bonus purpose; consider "assigned on short notice" bonus |

---

**Document Version**: 1.0
**Created**: 2025-10-12
**Author**: Claude (Product Requirements Document Generator)
**Status**: Draft - Awaiting Approval
**Next Steps**: Review with stakeholders, refine open questions, begin Phase 1 implementation
