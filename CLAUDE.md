# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

IMPORTANT: Always read PLANNING.md at the start of every new conversation, check
TASKS.md before starting your work, mark completed tasks to TASKS.md
immediately, and add newly discovered tasks to TASKS.md as soon as they are
found.

IMPORTANT: You should never make edits to the main branch directly. Always
create a feature branch for any changes, no matter how small. Always create a
branch for new features and commit often. When a feature is complete create a PR
and merge to main

## Development Workflow

1. Check what branch you are on. We NEVER actively develop on main
2. Create a branch if you are on main.

- Naming Conventions
  - `feature/quest-system-implementation`
  - `feature/character-stats-display`
  - `bugfix/dashboard-refresh-issue`
  - `refactor/component-structure-cleanup`

3. Plan your work using PLANNING.md and TASKS.md

- Update TASKS.md with subtasks for your planned work before you begin working

- Continuously update TASKS.md as you work with completed or newly discovered
  tasks as you work

4. Write Tests for jest and Playwright

- Tests MUST be comprehensive - happy path, edge cases, error conditions

5. Increment until all tests pass. Commit often. Update TASKS.md often.

- Write minimal code to make tests pass (Green phase)
- Make frequent, focused commits during development
- Don't just simplify the tests to make implementation easier. Break the
  implementation into smaller steps if necessary.

6. Refactor and impove code quality (Refactor phase)

7. Continue Red-Green-Refactor cycle until feature complete

### **Quality Gate - ALL MUST PASS**

```bash
npm run build        # Zero compilation errors
npm run lint         # Zero linting errors/warnings
npm run test         # All unit tests pass
npx playwright test  # All E2E tests pass. You will have to have a running dev server for this.
```

**If ANY step fails, fix it. No exceptions.**

### **Pull Request & Merge** 🚀

```bash
git push -u origin feature/feature-name
gh pr create --title "Feature description" --body "Detailed description"
gh pr merge --squash --delete-branch
```

### 🔧 Development Commands

```bash
# Essential TDD Commands
npm run test         # Run unit tests
npm run test:watch   # Watch mode for TDD cycles
npx playwright test  # E2E tests
npm run build        # Verify compilation
npm run lint         # Check code quality

# Database Operations
npx prisma generate  # After schema changes
npx prisma migrate dev # Apply migrations
```

### 💡 Lessons Learned

- **Always run tests headless for CI/automation**:
  `npx playwright test --reporter=line`
- **Use `--reporter=line` for clean output** - avoids spawning report servers
  that hang processes
- **Tests should complete and terminate properly** - no hanging servers blocking
  workflow
- **Use `--headed` only for debugging specific issues** - not for regular test
  runs
- **Create focused tests for specific bugs** - isolate the exact scenario being
  fixed

**Remember: The goal is quality software through disciplined TDD practice.**

## Extra Notes

### Development Environment Requirements

- **Docker Development Container**: Tests and development require PostgreSQL and Redis to be running via Docker:
  ```bash
  # Start development containers
  docker-compose -f docker-compose.dev.yml up -d

  # Stop development containers
  docker-compose -f docker-compose.dev.yml down
  ```

- **Development Server**: Run the dev server when necessary, but keep in mind:
  - The server should run on port 3000. If it starts on another port, there is
    already a dev server running. Stop it and restart on port 3000.
  - If you run `npm run build`, the dev server will need restarted. Running a
    build breaks any existing dev server.

- **Database**: All tests now use PostgreSQL (migrated from SQLite). The Docker development container must be running for tests to pass.

## Development Session History

**Session Log Guidelines:**
- Maximum 15 lines per session entry
- Focus on key accomplishments and current status only
- Use bullet points for technical highlights
- Include essential file changes but not exhaustive lists
- Consolidate related fixes into summary sections
- Keep technical details concise and actionable

### 2025-09-26: Real-Time Database System Integration (Current Session)

**Completed**: Full real-time database system integration with live synchronization across all family members.

**Key Accomplishments:**
- ✅ **Complete SSE Infrastructure**: Built `/api/events` endpoint with JWT auth and family-scoped event delivery
- ✅ **Database Change Detection**: Created `DatabaseChangeEmitter` with real-time event emission for quest, character, and reward changes
- ✅ **UI Integration**: Added live updates to QuestDashboard and RewardStore with connection status indicators
- ✅ **API Route Integration**: Connected real-time events to all existing quest and reward API endpoints
- ✅ **Comprehensive Testing**: 104+ tests covering SSE, database changes, React context, and integration flows
- ✅ **PostgreSQL Migration**: Full Docker development environment with real database testing

**What's Live Now:**
- ⚡ Quest status changes broadcast instantly to all family members
- ⚡ Character stats (XP, gold, level) update in real-time across devices
- ⚡ Reward redemptions and approvals sync immediately
- ⚡ Cross-device synchronization for entire family

**Files Created/Modified:**
- Core: `app/api/events/route.ts`, `lib/realtime-events.ts`, `lib/realtime-context.tsx`
- UI: `components/quest-dashboard.tsx`, `components/reward-store.tsx`
- Testing: 5 test files with comprehensive coverage
- Integration: All quest and reward API routes enhanced

**Latest Updates:**
- ✅ **Test Infrastructure Fixes**: Resolved all integration test timeout issues and circular dependencies
- ✅ **Complete Test Suite**: All 125 tests now passing with clean output and stable execution
- ✅ **Production Ready**: Real-time system fully tested and operational with comprehensive coverage

**Current Status**: Real-time database system 100% complete with full test coverage. All infrastructure ready for ChoreQuest 0.2.0 advanced features.

### 2025-09-25: Production Docker Deployment & Phase 1 MVP Completion

**Completed**: ChoreQuest v0.1.0 production-ready with zero-interaction Docker deployment.

**Key Accomplishments:**
- ✅ **Docker Production System**: Multi-stage build with automatic database initialization
- ✅ **Zero-Interaction Deployment**: Works instantly with Portainer - just paste and deploy
- ✅ **PostgreSQL Migration**: Full migration from SQLite for production scalability
- ✅ **Health Monitoring**: `/api/health` endpoint with database connectivity testing
- ✅ **Phase 1 MVP Complete**: Full family chore management with RPG elements
- ✅ **Mobile Optimization**: Touch-friendly responsive design for all devices
- ✅ **Comprehensive Testing**: Complete unit and E2E test coverage

**Current Status**: ChoreQuest Phase 1 MVP fully complete and production-deployed worldwide.

### Recent Bug Fixes & Enhancements

- **Docker Syntax Fix**: Resolved POSIX shell compatibility issue preventing container startup
- **React Performance**: Fixed useEffect dependency issues in QuestDashboard and RewardStore
- **Per-User Rewards**: Fixed family-wide blocking to enable independent user redemptions
- **Test Infrastructure**: Clean test output and reliable E2E testing system
- **Mobile UI**: Fantasy-themed styling with proper touch targets and responsive design
