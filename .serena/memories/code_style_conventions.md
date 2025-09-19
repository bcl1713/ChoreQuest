# ChoreQuest Code Style & Conventions

## TypeScript Standards
- **Strict mode enabled**: All TypeScript strict checks active
- **No `any` types**: Use proper TypeScript interfaces and types
- **Zod schemas**: Input validation for all API endpoints
- **Import aliases**: Use `@/*` for absolute imports from project root

## File Organization
- **API Routes**: `/app/api/[feature]/route.ts` structure
- **Pages**: App Router structure in `/app` directory
- **Components**: Reusable components in `/components` directory
- **Libraries**: Utility functions in `/lib` directory
- **Types**: TypeScript types in `/types` directory
- **Tests**: Co-located with components or in `/tests` directory

## Naming Conventions
- **Files**: kebab-case for files and directories (`create-family`, `auth-context`)
- **Components**: PascalCase for React components (`RootLayout`, `CharacterCreation`)
- **Variables**: camelCase for variables and functions (`registerSchema`, `hashPassword`)
- **Constants**: UPPER_SNAKE_CASE for enums and constants (`GUILD_MASTER`, `CHARACTER_CLASS`)

## Database Conventions
- **Prisma Models**: PascalCase (`User`, `QuestInstance`, `BossBattle`)
- **Table Names**: snake_case with @@map (`users`, `quest_instances`, `boss_battles`)
- **Field Names**: camelCase in schema, snake_case in database
- **IDs**: `cuid()` for all primary keys
- **Relations**: Descriptive names with proper foreign key constraints

## API Design
- **REST principles**: Standard HTTP methods and status codes
- **Error responses**: Consistent JSON error format with descriptive messages
- **Fantasy theming**: Error messages use fantasy language ("A hero with this email already exists in the realm!")
- **Authentication**: JWT Bearer tokens in Authorization header
- **Validation**: Zod schemas for all input validation

## React Patterns
- **Contexts**: React contexts for global state (AuthContext, CharacterContext)
- **Custom hooks**: Extract reusable logic into custom hooks
- **Component composition**: Prefer composition over inheritance
- **Type safety**: Proper TypeScript interfaces for all props

## Testing Standards
- **Test-Driven Development**: Write tests before implementation
- **Coverage**: Maintain 80%+ code coverage
- **E2E Testing**: Comprehensive bash test scripts for API flows
- **Unit Tests**: Jest with React Testing Library