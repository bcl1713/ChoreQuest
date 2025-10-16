# CLAUDE.md

IMPORTANT: You should never make edits to the main branch directly. Always check
your branch before starting work and never work directly on main. We are
following a Gitflow style workflow. New features should branch from develop, and
hotfixes should branch from main. When hotfixes are merged, they should be
tagged with a new semantic version number, making appropriate changes to local
files with version numbers. They should also be merged back into develop.

## Development Workflow

1. Check what branch you are on. We NEVER actively develop on main

- Naming Conventions
  - `feature/quest-system-implementation`
  - `feature/character-stats-display`
  - `bugfix/dashboard-refresh-issue`
  - `refactor/component-structure-cleanup`

3. Plan your work using PLANNING.md and TASKS.md

- Update TASKS.md with subtasks for your planned work before you begin working

- Continuously update TASKS.md as you work with completed or newly discovered
  tasks as you work

4. Write Tests for jest. Do NOT write tests for Playwright or run Playwright
   tests during TDD. Playwright tests are for end-to-end testing after feature
   complete and will be written by the user.

- Tests MUST be comprehensive - happy path, edge cases, error conditions

5. Increment until all tests pass. Commit often. Update TASKS.md often.

- Write minimal code to make tests pass (Green phase)
- Make frequent, focused commits during development
- Don't just simplify the tests to make implementation easier. Break the
  implementation into smaller steps if necessary.

6. Refactor and improve code quality (Refactor phase)

7. Continue Red-Green-Refactor cycle until feature complete

### **Quality Gate - ALL MUST PASS**

```bash
npm run build        # Zero compilation errors
npm run lint         # Zero linting errors/warnings
npm run test         # All unit tests pass
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
npm run build        # Verify compilation
npm run lint         # Check code quality
```

**Remember: The goal is quality software through disciplined TDD practice.**

## Extra Notes

- Do not run the dev server. If you need it to be running, ask the user to run
  it.
