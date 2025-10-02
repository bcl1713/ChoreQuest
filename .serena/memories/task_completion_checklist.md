# ChoreQuest Task Completion Checklist

## Quality Gates - ALL MUST PASS (Zero Tolerance)

### 1. Build Verification
```bash
npm run build
```
- ✅ **MUST** complete with zero compilation errors
- ✅ **MUST** generate valid Next.js production build
- ❌ **FAIL** if any TypeScript errors or build failures

### 2. Code Quality (ESLint)
```bash
npm run lint
```
- ✅ **MUST** complete with zero warnings or errors
- ✅ **MUST** follow Next.js TypeScript configuration
- ❌ **FAIL** if any ESLint violations

### 3. Unit Testing (Jest)
```bash
npm run test
```
- ✅ **MUST** have all tests passing (currently 26/26)
- ✅ **MUST** maintain 80%+ code coverage across all metrics
- ✅ **MUST** include tests for new functionality
- ❌ **FAIL** if any test failures or coverage drops

### 4. End-to-End Testing (Playwright)
```bash
npx playwright test --reporter=line
```
- ✅ **MUST** have all E2E tests passing (currently 30/30)
- ✅ **MUST** test complete user workflows
- ✅ **MUST** run headless for CI/automation
- ❌ **FAIL** if any E2E test failures

## Pre-Commit Checklist

### Code Quality Standards
- [ ] **TypeScript Strict Mode**: No `any` types unless absolutely necessary
- [ ] **ESLint Clean**: Zero warnings or errors
- [ ] **Prettier Formatted**: Consistent code formatting
- [ ] **No Console Logs**: Remove debug console.log statements
- [ ] **Import Organization**: Clean, organized imports

### Testing Requirements
- [ ] **Unit Tests Added**: New functionality has corresponding tests
- [ ] **E2E Tests Updated**: User workflows tested end-to-end
- [ ] **Test Coverage**: Maintained 80%+ across all metrics
- [ ] **Test Cleanup**: No hanging processes or servers

### Documentation Updates
- [ ] **TASKS.md Updated**: Mark completed tasks, add new discoveries
- [ ] **Code Comments**: Complex logic properly documented
- [ ] **Type Definitions**: All interfaces and types documented
- [ ] **README Updates**: If adding new features or changing setup

## Development Workflow Checklist

### Feature Branch Creation
- [ ] **Branch Naming**: `feature/`, `bugfix/`, `refactor/` prefix
- [ ] **Never Main**: Create branch from main, never develop on main
- [ ] **Descriptive Name**: Clear purpose and scope

### Development Process
- [ ] **TDD Approach**: Write tests first, then implementation
- [ ] **Frequent Commits**: Small, focused commits with clear messages
- [ ] **Context Updates**: Keep auth, character, and realtime contexts in sync
- [ ] **Error Handling**: Proper error boundaries and user feedback

### Code Review Preparation
- [ ] **Self Review**: Review your own changes before requesting review
- [ ] **Test All Paths**: Verify both happy path and error conditions
- [ ] **Mobile Testing**: Verify responsive design on mobile devices
- [ ] **Browser Testing**: Test in Chrome, Firefox, Safari if possible

## Supabase-Specific Checklist

### Database Changes
- [ ] **Migrations Created**: Use `npx supabase migration new <name>`
- [ ] **RLS Policies**: Ensure Row Level Security for family data isolation
- [ ] **Foreign Keys**: Proper relationships and constraints
- [ ] **Data Validation**: Zod schemas for client-side validation

### Authentication Flow
- [ ] **Session Management**: Proper Supabase session handling
- [ ] **Context Updates**: AuthProvider properly manages state
- [ ] **Error Handling**: Clear error messages for auth failures
- [ ] **Navigation**: Proper routing after auth state changes

### Real-time Features
- [ ] **Subscription Management**: Proper channel cleanup
- [ ] **Family Scoping**: Events filtered by family_id
- [ ] **Connection Handling**: Graceful disconnect/reconnect
- [ ] **Performance**: No memory leaks or infinite re-renders

## Docker Deployment Checklist

### Production Readiness
- [ ] **Health Check**: `/api/health` endpoint working
- [ ] **Environment Variables**: All production configs set
- [ ] **Database Connectivity**: Supabase connection established
- [ ] **Security Headers**: Next.js security headers configured

### Container Testing
- [ ] **Build Success**: Docker image builds without errors
- [ ] **Startup Success**: Container starts and serves application
- [ ] **Health Monitoring**: Health checks pass consistently
- [ ] **Volume Persistence**: Data persists across container restarts

## Definition of Done

A task is considered complete when:

1. ✅ **All Quality Gates Pass**: Build, lint, unit tests, E2E tests
2. ✅ **Code Review Approved**: Peer review completed (if team environment)
3. ✅ **Documentation Updated**: TASKS.md and relevant docs updated
4. ✅ **Feature Tested**: Manual testing of complete user workflow
5. ✅ **Mobile Verified**: Responsive design works on mobile devices
6. ✅ **Error Paths Tested**: Error conditions handled gracefully
7. ✅ **Performance Verified**: No significant performance regressions
8. ✅ **Security Reviewed**: No new security vulnerabilities introduced

## Emergency Rollback Criteria

Stop development and investigate if:
- Build fails for more than 30 minutes
- Test suite drops below 80% pass rate
- Application becomes unresponsive
- Authentication system fails
- Database connections fail
- Critical user workflows broken

**Remember**: Quality over speed. Better to take time ensuring quality than to introduce technical debt or bugs.