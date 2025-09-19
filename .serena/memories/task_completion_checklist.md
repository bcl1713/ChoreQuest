# Task Completion Checklist

When completing any development task in ChoreQuest, follow this mandatory checklist:

## Code Quality Verification
- [ ] **TypeScript Compilation**: Run `npm run build` to ensure no compilation errors
- [ ] **Linting**: Run `npm run lint` to check code style and catch issues
- [ ] **Type Safety**: Verify all TypeScript types are properly defined (no `any` types)
- [ ] **Import Paths**: Ensure imports use `@/` aliases where appropriate

## Database Changes
- [ ] **Schema Updates**: If Prisma schema modified, run `npm run db:generate`
- [ ] **Migrations**: Run `npm run db:migrate` if database structure changed
- [ ] **Custom Client Path**: Verify imports use `@/lib/generated/prisma` not `@prisma/client`

## Testing Requirements
- [ ] **API Testing**: Test all new endpoints with appropriate test scripts
- [ ] **E2E Flow**: Run relevant E2E tests (e.g., `./test-character-creation.sh`)
- [ ] **Edge Cases**: Test error conditions and validation failures
- [ ] **Authentication**: Verify auth-protected endpoints work correctly

## Git Workflow Compliance
- [ ] **Feature Branch**: Work done on feature branch (not main)
- [ ] **Descriptive Commits**: Clear commit messages describing changes
- [ ] **Build Verification**: `npm run build` passes before committing
- [ ] **Pull Request**: Create PR with implementation summary
- [ ] **Clean Merge**: Merge to main and delete feature branch

## Code Standards
- [ ] **Fantasy Theme**: Error messages and UX maintain fantasy language
- [ ] **Proper Validation**: Zod schemas for all API input validation
- [ ] **Error Handling**: Consistent error responses with appropriate status codes
- [ ] **Security**: No secrets or sensitive data in code/commits

## Integration Checks
- [ ] **Context Updates**: Update React contexts if global state changed
- [ ] **Component Integration**: New components properly integrated into app
- [ ] **API Consistency**: New endpoints follow existing patterns
- [ ] **Documentation**: Update relevant documentation if needed

## Performance & UX
- [ ] **Mobile Responsive**: UI works properly on mobile devices
- [ ] **Loading States**: Appropriate loading/error states for async operations
- [ ] **User Feedback**: Clear success/error messages for user actions
- [ ] **Fantasy UX**: Maintain immersive RPG experience throughout

## Final Verification
- [ ] **Full App Flow**: Test complete user workflow from start to finish
- [ ] **Cross-browser**: Verify functionality works across different browsers
- [ ] **Clean Console**: No console errors or warnings in browser/server logs