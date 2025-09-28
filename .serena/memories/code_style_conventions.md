# ChoreQuest Code Style & Conventions

## TypeScript Configuration
- **Target**: ES2017 with ESNext modules
- **Strict Mode**: Enabled for full type safety
- **Path Mapping**: `@/*` for absolute imports from project root
- **JSX**: Preserve mode for Next.js processing

## ESLint Configuration
- **Extends**: `next/core-web-vitals` and `next/typescript`
- **Ignored Paths**: node_modules, .next, generated files, config files
- **Zero Tolerance**: No ESLint warnings or errors allowed

## Prettier Configuration
- **Print Width**: 80 characters
- **Prose Wrap**: Always wrap markdown/text
- **End of Line**: Auto (cross-platform compatibility)
- **Enforced**: Via development workflow

## React Component Patterns

### Functional Components with TypeScript
```typescript
interface ComponentProps {
  prop: string;
  optional?: boolean;
}

export default function Component({ prop, optional = false }: ComponentProps) {
  // Component logic
}
```

### Context Pattern
```typescript
interface ContextType {
  data: SomeType;
  actions: () => void;
}

const Context = createContext<ContextType | undefined>(undefined);

export function useContext() {
  const context = useContext(Context);
  if (!context) {
    throw new Error('Hook must be used within Provider');
  }
  return context;
}
```

### Client Components
- All interactive components use `'use client'` directive
- Context providers are client components
- Server components used for static content

## Database Integration Patterns

### Supabase Client Usage
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('family_id', familyId)
  .single();

if (error) {
  console.error('Error:', error);
  throw error;
}
```

### Error Handling
- Consistent error logging with `console.error`
- User-friendly error messages in UI
- Validation using Zod schemas

## Styling Conventions

### Tailwind CSS Classes
- **Responsive**: Mobile-first approach with `sm:`, `md:`, `lg:` prefixes
- **Custom Classes**: `.fantasy-card`, `.fantasy-button`, `.touch-target`
- **Fantasy Theme**: Gold gradients, dark backgrounds, fantasy typography

### CSS Organization
- Global styles in `app/globals.css`
- Component-specific styles inline with Tailwind
- Custom utilities for common patterns

## Testing Patterns

### Unit Tests (Jest)
- **Setup**: `tests/jest.setup.js` with Testing Library
- **Coverage**: 80% threshold for branches, functions, lines, statements
- **Mocking**: Supabase client mocked for testing
- **File Naming**: `*.test.{ts,tsx}` pattern

### E2E Tests (Playwright)
- **Configuration**: `playwright.config.ts`
- **Test Location**: `tests/e2e/` directory
- **Reporter**: Line reporter for clean CI output
- **Headless**: Default mode for automation

## Development Workflow

### Quality Gates
1. `npm run build` - Zero compilation errors
2. `npm run lint` - Zero ESLint warnings
3. `npm run test` - All unit tests pass
4. `npx playwright test` - All E2E tests pass

### Git Conventions
- **Branching**: `feature/`, `bugfix/`, `refactor/` prefixes
- **Commits**: Meaningful commit messages, frequent commits
- **No Main Development**: Always work on feature branches

## Naming Conventions

### Variables & Functions
- **camelCase**: Standard JavaScript/TypeScript convention
- **Descriptive Names**: Clear purpose and scope
- **Boolean Prefixes**: `is`, `has`, `should`, `can`

### Files & Directories
- **kebab-case**: For utility files and contexts
- **PascalCase**: For React components
- **lowercase**: For Next.js routing directories

### Database
- **snake_case**: All table and column names
- **Plural Tables**: `families`, `user_profiles`, `quest_instances`
- **Descriptive IDs**: `family_id`, `user_id`, `quest_id`