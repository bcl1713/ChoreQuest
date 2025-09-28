# ChoreQuest Development Commands

## Essential Development Commands

### Development Server
```bash
npm run dev                 # Start Next.js development server with Turbopack
```

### Quality Assurance (MUST PASS BEFORE ANY COMMIT)
```bash
npm run build              # Build production application (zero errors required)
npm run lint               # Run ESLint code quality checks (zero warnings required)
npm run test               # Run all unit tests (all must pass)
npx playwright test        # Run E2E tests (all must pass)
```

### Database Operations (Supabase)
```bash
npx supabase start         # Start local Supabase development environment
npx supabase stop          # Stop local Supabase services
npx supabase status        # Check status of local Supabase services
npx supabase migration new <name>  # Create new migration file
npx supabase db push       # Apply local schema changes to remote
npx supabase db pull       # Pull remote schema changes to local
npx supabase db reset      # Reset local database to clean state
```

### Testing Commands
```bash
npm run test:watch         # Run tests in watch mode for TDD
npm run test:coverage      # Generate test coverage report
npm run test:e2e           # Run E2E tests with line reporter (alias for playwright test)
npx playwright test --headed --debug  # Debug E2E tests with browser UI
```

### Docker Development
```bash
npm run docker:dev         # Start PostgreSQL and Redis containers for development
npm run docker:down        # Stop all Docker containers
docker-compose up -d       # Start production containers
docker-compose down        # Stop production containers
```

### Legacy Commands (No Longer Used After Supabase Migration)
```bash
# These commands were removed after Supabase migration:
# npm run db:generate      # Generate Prisma client (replaced by Supabase)
# npm run db:migrate       # Run Prisma migrations (replaced by Supabase)
# npm run db:reset         # Reset Prisma database (replaced by Supabase)
# npm run db:seed          # Seed Prisma database (replaced by Supabase)
# npm run db:studio        # Open Prisma Studio (replaced by Supabase dashboard)
```

## Development Workflow Commands

### Daily Development
```bash
# Start development environment
npm run dev

# Run tests continuously during development
npm run test:watch

# Check code quality before commit
npm run lint && npm run test && npm run build
```

### Feature Development
```bash
# Create feature branch
git checkout -b feature/feature-name

# Development cycle
npm run test:watch  # Keep running in one terminal
npm run dev         # Keep running in another terminal

# Pre-commit checks
npm run build && npm run lint && npm run test && npx playwright test

# Commit and push
git add . && git commit -m "feat: description" && git push
```

### Production Deployment
```bash
# Build and test
npm run build
npm run test
npx playwright test

# Docker production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## Utility Commands

### Linux System Commands (Available)
```bash
ls                         # List files
cd <directory>            # Change directory
grep <pattern> <files>    # Search for patterns (use Grep tool instead)
find <path> <criteria>    # Find files (use Glob tool instead)
git status                # Check git status
git log --oneline -10     # View recent commits
git diff                  # View changes
```

### Project-Specific Utilities
```bash
# Check application health
curl http://localhost:3000/api/health

# View application logs
docker-compose logs -f

# Connect to database (via Supabase dashboard)
# Visit: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

# Monitor realtime subscriptions
# Use browser dev tools to inspect realtime connection
```

## TDD Workflow Commands

### Red-Green-Refactor Cycle
```bash
# 1. RED: Write failing test
npm run test              # Should fail

# 2. GREEN: Write minimal code to pass
npm run test:watch        # Should pass

# 3. REFACTOR: Improve code quality
npm run lint              # Should pass
npm run build             # Should pass
npx playwright test       # Should pass
```

## Emergency Commands

### Reset Development Environment
```bash
# Reset Supabase
npx supabase db reset

# Reset Node modules
rm -rf node_modules package-lock.json
npm install

# Reset Docker
docker-compose down
docker system prune -f
npm run docker:dev
```

### Debug Issues
```bash
# View detailed test output
npm run test -- --verbose

# Run specific test file
npm run test -- tests/unit/specific-test.test.ts

# Debug specific E2E test
npx playwright test tests/e2e/specific-test.spec.ts --headed --debug
```