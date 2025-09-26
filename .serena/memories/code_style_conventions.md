# ChoreQuest Code Style & Conventions

## TypeScript Guidelines
- **Full Type Safety**: All code uses TypeScript with strict typing
- **Interface Definitions**: Clear interfaces for props and data structures
- **Zod Schemas**: Runtime validation with Zod for API inputs
- **No `any` Types**: Avoid using `any`, prefer specific types

## React Patterns
- **Functional Components**: Use function declarations, not arrow functions for components
- **Hooks**: Proper dependency arrays, avoid ESLint disable comments
- **useCallback**: Wrap functions passed as props to prevent re-renders
- **Context Usage**: Leverage existing contexts (auth, character) instead of duplicating API calls
- **Component Structure**: Props interface → component function → export default

## API Route Conventions
- **Next.js 15 Pattern**: Use async params with proper type annotations
- **Authentication**: Use `getTokenData()` for route authentication
- **Error Handling**: Consistent HTTP status codes and error responses
- **Family Scoping**: Always scope data by family ID for security

## Database Patterns
- **Prisma ORM**: Use Prisma client for all database operations
- **Transaction Support**: Use `prisma.$transaction()` for multi-table operations
- **Proper Relations**: Leverage Prisma relationships instead of manual joins
- **Seeding**: Comprehensive seed data for development and testing

## Styling Conventions
- **Tailwind Classes**: Use utility-first approach with semantic class combinations
- **Fantasy Theme**: Consistent use of custom CSS variables and utility classes
- **Mobile-First**: Always start with mobile layouts, enhance with `sm:` prefixes
- **Touch Targets**: Use `.touch-target` class for 44px minimum touch areas
- **Color System**: Use theme colors (gold, gem, xp, dark) consistently

## Component Naming
- **PascalCase**: Component files and function names
- **Descriptive Names**: Clear, intention-revealing names
- **File Extensions**: Use `.tsx` for React components, `.ts` for utilities
- **Directory Structure**: Group related components in subdirectories

## Testing Standards
- **TDD Approach**: Write tests before implementation
- **Comprehensive Coverage**: Happy path, edge cases, error conditions
- **Clean Output**: Mock console.error to keep test output clean
- **E2E Tests**: Focus on user workflows, not implementation details
- **Test Structure**: Describe blocks for organization, clear test names

## Git & Development Workflow
- **Branch Naming**: 
  - `feature/description-of-feature`
  - `bugfix/description-of-bug`
  - `refactor/description-of-change`
- **Never Develop on Main**: Always create feature branches
- **Frequent Commits**: Small, focused commits with clear messages
- **Quality Gates**: All tests must pass before merging
- **PR Process**: Use GitHub CLI for PR creation and merging

## Code Quality Rules
- **No Comments**: Code should be self-documenting
- **ESLint Compliance**: Zero warnings or errors allowed
- **Build Success**: `npm run build` must pass without errors
- **Test Coverage**: Maintain 80%+ coverage across all modules
- **Performance**: Optimize for mobile devices and slower connections