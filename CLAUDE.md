# CLAUDE.md - ChoreQuest Development Guidelines

## Core Principles

**Git Workflow:** Gitflow with disciplined branching
**Quality:** TDD with comprehensive test coverage
**Planning:** Long-term roadmap (TASKS.md) + focused active work (dev-docs system)
**Documentation:** Persistent task documentation that survives context resets

---

## Git Workflow - Gitflow with Discipline

**CRITICAL:** Never work directly on main or develop. Always create feature/bugfix branches.

### Branch Naming Conventions

```
feature/[feature-name]          # New features from develop
bugfix/[issue-number]-[name]    # Bug fixes from develop
refactor/[name]                 # Code cleanup from develop
hotfix/[issue-number]-[name]    # Critical fixes from main (tagged releases only)
```

**Examples:**
- `feature/quest-system-implementation`
- `bugfix/58-chrome-loading-spinner`
- `refactor/component-structure-cleanup`
- `hotfix/64-realtime-quest-deletion`

### Hotfix Process

When creating hotfixes (branch from main):
1. Create semantic version tag (e.g., v0.2.6)
2. Update local version files
3. Merge back into develop after merging to main

---

## Planning: Two-Level System

**Core Principle:** Keep all development documentation in the `dev/` directory. Root directory stays clean.

### 1. **TASKS.md** - Long-Term Roadmap (Root Level)

`TASKS.md` is your **project vision and release planning document** (kept at root):
- Release milestones (0.4.0, 0.5.0, etc.)
- Phase-based features (Phases 1-4)
- GitHub issue tracking
- Long-term feature roadmap (avatar systems, boss battles, community features, etc.)
- Historical completion dates

**When to use TASKS.md:**
- Planning releases
- Tracking phase completions
- Viewing the full feature backlog
- Adding new long-term features

### 2. **Dev-Docs System** - Active Work Planning (dev/ Directory)

Use `/dev-docs` command for **detailed tactical planning** of your current work:
- Creates persistent task structure in `dev/active/[task-name]/`
- Survives context resets
- Captures implementation decisions and context
- **All files stored in dev/ directory**

**Directory structure:**
```
dev/
├── README.md                           # Dev docs guide (this directory's README)
├── PROJECT_KNOWLEDGE.md               # Shared architecture (optional)
├── BEST_PRACTICES.md                  # Team coding standards (optional)
├── TROUBLESHOOTING.md                 # Known issues & solutions (optional)
└── active/[task-name]/
    ├── [task-name]-plan.md            # Comprehensive plan with phases and tasks
    ├── [task-name]-context.md         # Key files, decisions, dependencies, blockers
    └── [task-name]-tasks.md           # Checklist format for tracking progress
```

**When to use `/dev-docs`:**
- Starting work on a significant feature or bug fix
- Need to capture complex architectural decisions
- Approaching context limits and need to save state

**Example usage:**
```
/dev-docs Implement avatar customization system with 3D renderer integration
```

This creates:
- `dev/active/avatar-customization/avatar-customization-plan.md`
- `dev/active/avatar-customization/avatar-customization-context.md`
- `dev/active/avatar-customization/avatar-customization-tasks.md`

### 3. **Dev-Docs Update** - Context Preservation

Use `/dev-docs-update` when approaching context limits:
- Updates all `dev/active/` task documentation
- Captures session progress and decisions
- Documents blockers and next steps
- Ensures seamless continuation after context reset
- **Updates stay within dev/ directory**

**When to use `/dev-docs-update`:**
- Approaching token limit warnings
- Before long breaks in development
- When switching to a different task

---

## TDD Workflow - Red-Green-Refactor Cycle

### Step 1: Plan with `/dev-docs` (if significant feature)

Create or update task structure:
```bash
/dev-docs [Your feature description]
```

This gives you a persistent place to track decisions across context resets.

### Step 2: Write Failing Tests (Red Phase)

Tests MUST be comprehensive:
- Happy path scenarios
- Edge cases
- Error conditions
- Boundary conditions

**Test frameworks:**
- Jest for unit tests ✅
- Do NOT write Playwright tests during TDD

### Step 3: Write Minimal Code (Green Phase)

- Write minimal code to make tests pass
- Focus on correctness, not optimization
- Make frequent, focused commits
- Update `dev/active/[task-name]/[task-name]-tasks.md` with progress

### Step 4: Refactor (Refactor Phase)

- Improve code quality
- Extract duplicated logic
- Enhance readability
- All tests still pass

### Step 5: Continue Red-Green-Refactor Until Complete

Repeat until feature is complete and all tests pass.

---

## Quality Gate - ALL MUST PASS

Before committing or opening a PR, verify:

```bash
npm run build        # Zero TypeScript compilation errors
npm run lint         # Zero linting errors or warnings
npm run test         # All unit tests pass (no skipped tests in CI)
```

**If ANY step fails, fix it. No exceptions.** Don't commit incomplete work.

---

## Pull Request & Merge

### Create and Merge with Discipline

```bash
# Push your feature branch
git push -u origin feature/feature-name

# Create PR with detailed description
gh pr create --title "Feature description" --body "Detailed description"

# Review changes, then squash merge
gh pr merge --squash --delete-branch
```

### PR Requirements

- Quality gates pass (build/lint/test)
- All tests pass (no .skip() in test files)
- Comprehensive test coverage for the feature
- Commit message follows conventions

---

## Development Commands

### Essential TDD Commands

```bash
# Run tests once
npm run test

# Watch mode for TDD cycles (recommended)
npm run test:watch

# Verify TypeScript compilation
npm run build

# Check code quality
npm run lint

# Run everything (pre-commit check)
npm run build && npm run lint && npm run test
```

### Dev-Docs Commands

```bash
# Plan a significant feature or bug fix
/dev-docs Your feature description here

# Update documentation before context reset
/dev-docs-update Optional focus area

# View active tasks
cat dev/active/[task-name]/[task-name]-tasks.md
```

---

## Integration Points

### When Working on a Feature

1. **Start with `/dev-docs`** if it's substantial
   - Creates `dev/active/[feature-name]/` structure
   - Document architectural decisions
   - List all tasks with acceptance criteria

2. **Update task checklist regularly**
   - Mark tasks complete as you finish them
   - Add newly discovered tasks
   - Update in-progress tasks with status

3. **Update `dev/active/[task-name]/[task-name]-context.md`** before context reset
   - Current implementation state
   - Key decisions made
   - Files modified and why
   - Blockers or issues
   - Next immediate steps

4. **Sync with TASKS.md** when features complete
   - Mark GitHub issues as resolved in TASKS.md
   - Update release milestones
   - Move to completed section

---

## Extra Notes

- Do not run the dev server unless asked. If you need it running, ask the user.
- Always ask permission before using any `eslint-disable` comments and justify why it's necessary.
- When context limits approach, use `/dev-docs-update` to preserve your progress.
- Keep `dev/active/` documentation up-to-date for seamless context switches.

---

## Quick Reference

| Task | Tool | Purpose |
|------|------|---------|
| Long-term planning | TASKS.md | Release milestones, phases, roadmap |
| Detailed feature planning | `/dev-docs` | Create persistent task structure |
| Context preservation | `/dev-docs-update` | Update all task docs before reset |
| TDD cycle | npm test:watch | Red-Green-Refactor iterations |
| Pre-commit verification | npm run build && npm run lint && npm run test | Ensure quality gates pass |
