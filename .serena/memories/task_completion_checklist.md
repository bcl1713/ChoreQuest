# ChoreQuest Task Completion Checklist

## Pre-Development Setup
- [ ] Check current git branch (never develop on `main`)
- [ ] Create feature branch if needed: `git checkout -b feature/description`
- [ ] Read PLANNING.md and TASKS.md
- [ ] Update TASKS.md with subtasks before beginning work

## Development Workflow (TDD Red-Green-Refactor)
- [ ] Write failing tests first (Red phase)
- [ ] Write minimal code to make tests pass (Green phase)
- [ ] Refactor and improve code quality (Refactor phase)
- [ ] Commit frequently with clear, focused messages
- [ ] Update TASKS.md continuously as work progresses

## Quality Gates - ALL MUST PASS (No Exceptions)
```bash
- [ ] npm run build        # Zero TypeScript compilation errors
- [ ] npm run lint         # Zero ESLint warnings/errors
- [ ] npm run test         # All unit tests pass (60/60 expected)
- [ ] npx playwright test  # All E2E tests pass (requires dev server)
```

## Code Review Checklist
- [ ] Follow React best practices (proper hooks, dependencies)
- [ ] Use existing contexts instead of duplicating API calls
- [ ] Apply mobile-first responsive design with Tailwind
- [ ] Implement proper error handling and validation
- [ ] Ensure family-scoped data security
- [ ] No ESLint disable comments (fix dependencies properly)
- [ ] TypeScript strict typing (no `any` types)

## Testing Requirements
- [ ] Tests cover happy path, edge cases, and error conditions
- [ ] E2E tests focus on user workflows, not implementation
- [ ] Mock console.error for clean test output
- [ ] Tests should terminate properly without hanging processes
- [ ] Use `--reporter=line` for clean CI output

## Pre-Commit Validation
- [ ] All files saved and staged: `git add .`
- [ ] Quality gates passed (see above)
- [ ] TASKS.md updated with completed items
- [ ] Commit message describes the change clearly
- [ ] No sensitive data (keys, passwords) in commit

## Pull Request Process
```bash
- [ ] git push -u origin feature/feature-name
- [ ] gh pr create --title "Description" --body "Details"
- [ ] PR includes comprehensive description of changes
- [ ] All CI checks pass in GitHub
- [ ] gh pr merge --squash --delete-branch
```

## Post-Merge Cleanup
- [ ] Switch back to main: `git checkout main`
- [ ] Pull latest changes: `git pull origin main`
- [ ] Mark major tasks complete in TASKS.md
- [ ] Update CLAUDE.md development history if significant

## Database Changes Checklist
- [ ] Run `npx prisma generate` after schema changes
- [ ] Create migration: `npx prisma migrate dev`
- [ ] Update seed data if needed
- [ ] Test migration on clean database
- [ ] Verify production compatibility

## Docker Deployment Checklist
- [ ] Test with production compose file
- [ ] Verify environment variables are set
- [ ] Check health endpoint: `/api/health`
- [ ] Validate database connectivity
- [ ] Test automatic initialization process

## Special Considerations
- [ ] Mobile touch targets minimum 44px (use `.touch-target`)
- [ ] Fantasy theme consistency (use custom CSS classes)
- [ ] Real-time features properly scoped by family
- [ ] Parent/Guild Master role permissions enforced
- [ ] Performance optimized for mobile devices

## Final Verification
- [ ] Feature works end-to-end in browser
- [ ] Mobile responsive design verified
- [ ] No console errors in browser dev tools
- [ ] Database operations complete successfully
- [ ] Authentication and authorization working properly