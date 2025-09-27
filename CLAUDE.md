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

- Run the dev server when necessary, but keep in mind:
  - The server should run on port 3000. If it starts on another port, there is
    already a dev server running. Stop it and restart on port 3000.
  - If you run `npm run build`, the dev server will need restarted. Running a
    build breaks any existing dev server.
