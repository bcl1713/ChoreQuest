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

## 🚨 MANDATORY Test-Driven Development Workflow 🚨

### 🛑 **STOP: BRANCH CHECK REQUIRED BEFORE ANY CODE CHANGES** 🛑

Before touching ANY code, run these commands and follow the checklist:

```bash
# 1. Check current branch status
git branch

# 2. Verify you are NOT on main
# If on main, IMMEDIATELY create feature branch
```

**MANDATORY CHECKLIST - NO EXCEPTIONS:**

- [ ] ✅ Verified current branch with `git branch`
- [ ] ✅ If on main: Created feature branch with
      `git checkout -b feature/descriptive-name`
- [ ] ✅ Ready to start TDD process

Branch naming conventions:

- `feature/quest-system-implementation`
- `feature/character-stats-display`
- `bugfix/dashboard-refresh-issue`
- `refactor/component-structure-cleanup`

- If you are on main and about to make changes, STOP immediately
- Create a feature branch first, no matter how small the change
- This applies to: bug fixes, features, refactoring, documentation, EVERYTHING

### **Write Tests FIRST** 🧪

- Write failing tests for the functionality you want to implement
- Tests MUST be comprehensive - happy path, edge cases, error conditions
- Fix any test infrastructure issues (never skip broken tests)
- Run tests: `npm run test` and `npx playwright test`
- Tests MUST fail initially (Red phase)

### **Implement & Iterate** 🔄

- Write minimal code to make tests pass (Green phase)
- Make frequent, focused commits during development
- Refactor and improve code quality (Refactor phase)
- Continue Red-Green-Refactor cycle until feature complete

### **Quality Gate - ALL MUST PASS** ✅

```bash
npm run build        # Zero compilation errors
npm run lint         # Zero linting errors/warnings
npm run test         # All unit tests pass
npx playwright test  # All E2E tests pass
```

**If ANY step fails, fix it. No exceptions.**

#### 5. **Pull Request & Merge** 🚀

```bash
git push -u origin feature/feature-name
gh pr create --title "Feature description" --body "Detailed description"
gh pr merge --squash --delete-branch
```

### 🚨 CRITICAL RULES

#### Quality Standards

- **Zero tolerance for warnings** - fix all linting and TypeScript warnings
- Do not add ignore comments or disable rules
- **Build must be clean** - no compilation errors ever
- **Frequent commits** - commit often with meaningful messages
- **No direct main commits** - every change goes through branch → PR → merge

#### Test-First Mentality

1. **Write the test for what you want to build**
2. **Watch it fail (Red)**
3. **Write minimal code to pass (Green)**
4. **Improve the code (Refactor)**
5. **Repeat until feature complete**

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

#### Never Do This Again

- ❌ **MAKE ANY CHANGES WHILE ON MAIN BRANCH** - THIS IS THE #1 VIOLATION
- ❌ Skip the `git branch` check before starting work
- ❌ Treat small changes as "too minor" for branching
- ❌ Edit files directly on main "just this once"
- ❌ Skip test writing because "tests are broken"
- ❌ Accept linting warnings "temporarily"
- ❌ Work around test infrastructure issues
- ❌ Make changes without comprehensive testing
- ❌ Create PRs with failing tests
- ❌ Run Playwright tests without proper completion (hanging report servers)
- ❌ Assume context loading states work correctly during page refresh
- ❌ Use generic text selectors like `'text=Cancel'` when multiple elements
  contain that text
- ❌ Forget to switch modal tabs/modes before filling form fields
- ❌ Ignore test selector specificity - always target the exact element intended

#### Always Do This

- ✅ **RUN `git branch` BEFORE ANY CODE CHANGES** - MANDATORY FIRST STEP
- ✅ **CREATE FEATURE BRANCH IF ON MAIN** - NO EXCEPTIONS
- ✅ Follow the mandatory pre-work checklist every single time
- ✅ Use descriptive branch names with proper prefixes (feature/, bugfix/,
  refactor/)
- ✅ Fix broken test infrastructure immediately
- ✅ Write tests before implementation
- ✅ Maintain zero warnings/errors standard
- ✅ Test all user scenarios end-to-end
- ✅ Commit frequently with clear messages
- ✅ Run Playwright tests with `--reporter=line` for proper process termination
- ✅ Test page refresh scenarios explicitly - they often reveal race conditions
- ✅ Verify context state management during initialization sequences
- ✅ Use specific selectors in E2E tests - avoid generic text selectors that
  match multiple elements
- ✅ Always switch to correct modal tabs/modes before interacting with form
  elements
- ✅ Target modal elements with specific CSS selectors (e.g.,
  `.fixed button:has-text("Cancel")`) to avoid conflicts

### 🎯 Success Criteria

Every feature completion must achieve:

- ✅ All tests written before implementation
- ✅ All tests passing (unit + E2E)
- ✅ Zero compilation errors
- ✅ Zero linting warnings
- ✅ Clean build successful
- ✅ PR merged with comprehensive description
- ✅ Feature branch cleaned up

**Remember: The goal is quality software through disciplined TDD practice.**

## Extra Notes

- Run the dev server when necessary, but keep in mind:
  - The server should run on port 3000. If it starts on another port, there is
    already a dev server running. Stop it and restart on port 3000.
  - If you run `npm run build`, the dev server will need restarted. Running a
    build breaks any existing dev server.
