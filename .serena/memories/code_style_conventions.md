# ChoreQuest Code Style & Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled with full type safety
- **Target**: ES2017 with modern features
- **Module Resolution**: bundler (Next.js optimized)
- **Path Mapping**: `@/*` maps to project root
- **JSX**: preserve (handled by Next.js)

## ESLint Configuration
- **Base Config**: Extends Next.js core-web-vitals and TypeScript rules
- **Ignored Directories**: node_modules, .next, build, coverage, lib/generated
- **No Custom Rules**: Uses Next.js defaults for consistency

## Prettier Configuration
- **Print Width**: 80 characters
- **Prose Wrap**: always (for markdown files)
- **End of Line**: auto (cross-platform compatibility)
- **Other Settings**: Uses Prettier defaults (2-space indentation, single quotes, no semicolons where optional)

## Naming Conventions
- **Files**: kebab-case for components (`quest-dashboard.tsx`), camelCase for utilities (`auth-context.tsx`)
- **Components**: PascalCase (`QuestDashboard`, `LoginForm`)
- **Functions**: camelCase (`generateToken`, `verifyPassword`)
- **Variables**: camelCase (`selectedAssignee`, `familyMembers`)
- **Constants**: SCREAMING_SNAKE_CASE for enums (`GUILD_MASTER`, `BOSS_BATTLE`)
- **Types/Interfaces**: PascalCase (`AuthResponse`, `QuestDashboardProps`)

## File Organization
- **Components**: Feature-based organization in `/components`
- **Pages**: Next.js App Router in `/app` directory
- **API Routes**: RESTful structure in `/app/api`
- **Utilities**: Shared code in `/lib` directory
- **Types**: Custom definitions in `/types` directory
- **Tests**: Mirror source structure in `/tests` directory

## Code Structure Patterns
- **Export Style**: Named exports preferred, default exports for pages/components
- **Function Declaration**: Function expressions for components, function declarations for utilities
- **Error Handling**: Throw errors with descriptive messages, proper error boundaries
- **Type Safety**: Strict TypeScript, no `any` types unless absolutely necessary with eslint-disable comment

## Database Conventions
- **Prisma Schema**: Comprehensive comments explaining relationships
- **Model Names**: PascalCase (`User`, `QuestInstance`)
- **Field Names**: camelCase (`familyId`, `createdAt`)
- **Enums**: SCREAMING_SNAKE_CASE values with descriptive comments

## Component Patterns
- **Props Interface**: Define explicit props interface for each component
- **State Management**: Local state with hooks, context for shared state
- **Event Handlers**: Descriptive names (`handleQuestSubmit`, `onAssigneeSelect`)
- **Conditional Rendering**: Clear boolean conditions, guard clauses

## API Conventions
- **RESTful Endpoints**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Request/Response**: Typed with Zod schemas for validation
- **Error Handling**: Consistent error response format
- **Authentication**: JWT token validation middleware

## Import Organization
- **Third-party Imports**: First (React, Next.js, libraries)
- **Internal Imports**: Second (components, utilities, types)
- **Relative Imports**: Last (local files)
- **Path Mapping**: Use `@/` for absolute imports from project root

## Comment Guidelines
- **Schema Comments**: Comprehensive database field explanations
- **Complex Logic**: Brief explanations for non-obvious code
- **TODO Comments**: Include ticket/issue references when possible
- **Type Overrides**: Justify any eslint-disable comments

## Testing Conventions
- **File Naming**: `*.test.ts` or `*.spec.ts`
- **Test Organization**: Mirror source directory structure
- **Test Categories**: Unit (`/tests/unit`), Integration (`/tests/api`), E2E (`/tests/e2e`)
- **Test Names**: Descriptive test case names explaining expected behavior