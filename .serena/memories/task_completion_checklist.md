# ChoreQuest Task Completion Checklist

## 🚨 MANDATORY: Pre-Work Branch Check
**⚠️ NEVER WORK ON MAIN BRANCH - NO EXCEPTIONS ⚠️**

### Before ANY Code Changes:
- [ ] ✅ Run `git branch` to check current branch
- [ ] ✅ If on main: Create feature branch with `git checkout -b feature/descriptive-name`
- [ ] ✅ Branch follows naming: `feature/`, `bugfix/`, or `refactor/` prefix
- [ ] ✅ Branch name is descriptive and kebab-case

## 🧪 Test-Driven Development (TDD) Process
**STRICT ORDER - NO SHORTCUTS**

### 1. Write Tests FIRST (Red Phase)
- [ ] ✅ Write failing tests for new functionality
- [ ] ✅ Include happy path, edge cases, error conditions
- [ ] ✅ Tests use descriptive names explaining expected behavior
- [ ] ✅ Run `npm run test` - tests MUST fail initially

### 2. Implement & Iterate (Green Phase)
- [ ] ✅ Write minimal code to make tests pass
- [ ] ✅ Run `npm run test` frequently during development
- [ ] ✅ Make frequent, focused commits
- [ ] ✅ Continue Red-Green-Refactor until feature complete

### 3. Quality Gate - ALL MUST PASS
- [ ] ✅ `npm run build` - Zero compilation errors
- [ ] ✅ `npm run lint` - Zero linting errors/warnings  
- [ ] ✅ `npm run test` - All unit tests pass
- [ ] ✅ `npx playwright test --reporter=line` - All E2E tests pass

## 📋 Code Quality Standards

### TypeScript & Linting
- [ ] ✅ No TypeScript compilation errors
- [ ] ✅ No ESLint warnings (zero tolerance)
- [ ] ✅ Proper type safety (no `any` without justification)
- [ ] ✅ Consistent naming conventions followed

### Testing Requirements
- [ ] ✅ Unit tests for all new functions/components
- [ ] ✅ Integration tests for API endpoints
- [ ] ✅ E2E tests for complete user workflows
- [ ] ✅ Test coverage maintains 80%+ threshold
- [ ] ✅ All tests have descriptive, clear names

### Database Operations (if applicable)
- [ ] ✅ `npm run db:generate` after schema changes
- [ ] ✅ `npm run db:migrate` for new migrations
- [ ] ✅ Database changes are backward compatible
- [ ] ✅ Seed data updated if needed

## 🔄 Feature Completion Workflow

### Final Verification
- [ ] ✅ Feature works in development environment
- [ ] ✅ All acceptance criteria met
- [ ] ✅ Error handling implemented
- [ ] ✅ Loading states added where appropriate
- [ ] ✅ Mobile responsiveness verified

### Git & Documentation
- [ ] ✅ Commit messages are clear and descriptive
- [ ] ✅ No temporary/debug code left in codebase
- [ ] ✅ Update TASKS.md to mark completed items
- [ ] ✅ Add newly discovered tasks to TASKS.md

## 🚀 Pull Request & Merge Process

### Create Pull Request
- [ ] ✅ `git push -u origin feature/branch-name`
- [ ] ✅ `gh pr create` with descriptive title and body
- [ ] ✅ PR includes summary of changes
- [ ] ✅ PR references any related issues

### Final Checks Before Merge
- [ ] ✅ All CI checks passing
- [ ] ✅ No merge conflicts
- [ ] ✅ Feature branch is up to date with main
- [ ] ✅ `gh pr merge --squash --delete-branch`

## ❌ Critical "Never Do" Rules

### Branching Violations (ZERO TOLERANCE)
- ❌ **NEVER make changes directly on main branch**
- ❌ Never skip the `git branch` pre-work check
- ❌ Never consider any change "too small" for branching
- ❌ Never commit directly to main "just this once"

### Quality Violations  
- ❌ Never skip test writing because "tests are broken"
- ❌ Never accept linting warnings "temporarily"
- ❌ Never work around test infrastructure issues
- ❌ Never create PRs with failing tests
- ❌ Never ignore build errors

### Testing Anti-Patterns
- ❌ Never run Playwright without `--reporter=line` (causes hanging)
- ❌ Never use generic selectors like `'text=Cancel'` in E2E tests
- ❌ Never assume page/context state during refresh scenarios
- ❌ Never skip E2E tests for "simple" changes

## ✅ Success Criteria

### Every Task Must Achieve:
- ✅ All tests written before implementation (TDD)
- ✅ All tests passing (unit + integration + E2E)
- ✅ Zero compilation errors
- ✅ Zero linting warnings
- ✅ Clean build successful
- ✅ Feature branch workflow completed
- ✅ TASKS.md updated with progress

## 🔧 Essential Commands Reference

### Daily Development
```bash
git branch                    # MANDATORY first check
npm run dev                  # Development server
npm run test:watch          # TDD cycle
npm run lint                # Code quality
npx playwright test --reporter=line  # E2E testing
```

### Quality Gates  
```bash
npm run build               # Build verification
npm run test               # Unit test suite
npm run test:coverage      # Coverage check
npx playwright test --reporter=line  # E2E verification
```

### Database Updates
```bash
npm run db:generate        # After schema changes
npm run db:migrate         # Apply migrations
npm run db:seed           # Populate test data
```

## 💡 Lessons Learned Reminders

### From Previous Debugging Sessions
- Context state management needs careful sequencing during page refresh
- Modal state matters for form interactions - always ensure correct tab/mode
- Use specific CSS selectors in tests to avoid conflicts
- E2E tests catch real user issues that unit tests miss
- Race conditions are subtle - test page refresh scenarios explicitly

### TDD Benefits Observed
- Tests reveal the real issues (not assumed problems)  
- Clean code prevents future bugs
- Build verification catches integration issues early
- Comprehensive testing provides confidence in changes