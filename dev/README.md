# Development Documentation - ChoreQuest

This directory contains persistent task documentation that survives context resets.

## Structure

```
dev/
├── README.md                    # This file
├── PROJECT_KNOWLEDGE.md         # Shared project architecture and patterns (optional)
├── BEST_PRACTICES.md           # Team coding standards and patterns (optional)
├── TROUBLESHOOTING.md          # Known issues and solutions (optional)
└── active/                      # Currently active tasks/features
    └── [task-name]/
        ├── [task-name]-plan.md      # Comprehensive plan with phases and tasks
        ├── [task-name]-context.md   # Current state, decisions, blockers, next steps
        └── [task-name]-tasks.md     # Checklist format for daily tracking
```

**Everything stays in `dev/` - no development documents in the root directory!**

## Using the Dev-Docs System

### Create a New Task Plan

When starting work on a significant feature or bug fix, use the `/dev-docs` command:

```bash
/dev-docs Implement avatar customization system with 3D renderer integration
```

This creates:
- `dev/active/avatar-customization/avatar-customization-plan.md` - Full strategic plan
- `dev/active/avatar-customization/avatar-customization-context.md` - Implementation state
- `dev/active/avatar-customization/avatar-customization-tasks.md` - Task checklist

### Update Documentation During Development

As you work:

1. **Update `[task-name]-tasks.md`** regularly
   - Mark tasks complete with ✅
   - Add newly discovered tasks
   - Update in-progress task status

2. **Keep `[task-name]-context.md`** current before context resets
   - Current implementation state
   - Key architectural decisions made
   - Files modified and why
   - Blockers or issues discovered
   - Next immediate steps
   - Update timestamp

### Preserve State Before Context Reset

Use `/dev-docs-update` when approaching token limits:

```bash
/dev-docs-update Describe any specific focus areas
```

This updates all active task documentation to capture:
- Session progress
- Decisions made
- Files modified
- Blockers encountered
- Next immediate steps

### Reference TASKS.md for Long-Term Planning

- `../TASKS.md` contains your release milestones and long-term roadmap
- `dev/active/` contains detailed tactical plans for current work
- Sync completed features from `dev/active/` back to TASKS.md

## Shared Documentation Files (Optional)

### `PROJECT_KNOWLEDGE.md`

Shared architecture and patterns across all tasks:
- System architecture overview
- Data flow and relationships
- Key architectural decisions
- Integration points between components
- Database schema notes
- API patterns and conventions

### `BEST_PRACTICES.md`

Team coding standards referenced across tasks:
- Code style guidelines (specific to this project)
- Design patterns used
- Testing approach and standards
- Common patterns and conventions
- Performance optimization strategies
- Error handling patterns

### `TROUBLESHOOTING.md`

Common issues and solutions discovered:
- Known problems and their solutions
- Gotchas to watch out for
- Performance issues and fixes
- Common mistakes to avoid
- Debugging tips and tricks
- Integration quirks

---

## Active Task Files

### `active/[task-name]/[task-name]-plan.md`

Comprehensive strategic plan including:
- Executive Summary
- Current State Analysis
- Proposed Future State
- Implementation Phases (multiple sections)
- Detailed Tasks (with acceptance criteria)
- Risk Assessment
- Success Metrics
- Timeline Estimates

### `active/[task-name]/[task-name]-context.md`

Implementation state and critical information:
- Current implementation status
- Key files being modified
- Architectural decisions made
- Dependencies and integration points
- Known blockers or challenges
- Next immediate steps
- Last Updated timestamp

### `active/[task-name]/[task-name]-tasks.md`

Daily task tracking in checklist format:
- [ ] Task 1 with clear acceptance criteria
- [x] Completed task
- Progress tracking as you work

## Best Practices

1. **Create early** - Use `/dev-docs` at the start of significant work
2. **Update frequently** - Keep task checklists current during development
3. **Document decisions** - Record "why" not just "what" in context.md
4. **Preserve state** - Use `/dev-docs-update` before context resets
5. **Sync on completion** - Update TASKS.md when features complete

## Integration with Git Workflow

- `dev/` directory should be committed to git
- Each task's documentation lives in its own directory under `dev/active/`
- Keep shared files (`PROJECT_KNOWLEDGE.md`, `BEST_PRACTICES.md`, `TROUBLESHOOTING.md`) in `dev/`
- Merge strategies: Keep documentation files when merging feature branches
- Cleanup: Archive completed tasks to `dev/completed/[task-name]/` if desired
- **Goal:** Keep root directory clean - all development documentation belongs in `dev/`

---

**For more information, see:** `../CLAUDE.md` - Development Guidelines
