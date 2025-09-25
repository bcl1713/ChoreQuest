# ChoreQuest Development Commands

## Essential Daily Commands

### Development Server
```bash
npm run dev              # Start Next.js development server with Turbopack
npm run build           # Build production application  
npm run start           # Start production server
```

### Code Quality (Run Before Commits)
```bash
npm run lint            # Run ESLint code quality checks
npm run test            # Run all unit tests with Jest
npm run test:watch      # Run tests in watch mode (for TDD)
npm run test:coverage   # Generate test coverage report
npm run test:e2e        # Run end-to-end tests with Playwright
```

### Database Operations
```bash
npm run db:generate     # Generate Prisma client after schema changes
npm run db:migrate      # Run database migrations
npm run db:reset        # Reset database to initial state (destructive!)
npm run db:seed         # Seed database with test data
npm run db:studio       # Open Prisma Studio database GUI
```

### Docker Development Environment
```bash
npm run docker:dev      # Start PostgreSQL and Redis containers
npm run docker:down     # Stop all containers
```

## Testing Commands (TDD Workflow)

### Unit Testing
```bash
npm run test                        # Run all unit tests
npm run test:watch                  # Watch mode for TDD cycles
npm run test:coverage              # Coverage report (80%+ required)
npm run test:seed                  # Test database seeding functionality
```

### End-to-End Testing
```bash
npx playwright test                 # Run all E2E tests
npx playwright test --reporter=line # Clean output without report server
npx playwright test --headed       # Debug mode with browser visible
npx playwright test specific.spec.ts # Run specific test file
```

## Database Management

### Schema Changes Workflow
```bash
# 1. Modify prisma/schema.prisma
# 2. Generate new client
npm run db:generate
# 3. Create migration
npm run db:migrate
# 4. Optionally seed with test data
npm run db:seed
```

### Database Debugging
```bash
npm run db:studio      # Visual database browser
npx prisma format      # Format schema file
npx prisma validate    # Validate schema syntax
```

## Quality Assurance Workflow

### Pre-Commit Checklist
```bash
npm run build          # Verify clean build (zero compilation errors)
npm run lint           # Zero linting warnings allowed
npm run test           # All unit tests must pass
npx playwright test    # All E2E tests must pass
```

### Git Workflow Commands
```bash
git branch                          # Check current branch (never work on main!)
git checkout -b feature/description # Create feature branch
git add .                          # Stage changes
git commit -m "descriptive message" # Commit with clear message
git push -u origin feature/branch  # Push feature branch
```

## Troubleshooting Commands

### Development Issues
```bash
rm -rf .next           # Clear Next.js cache
rm -rf node_modules    # Clear dependencies
npm install            # Reinstall dependencies
npx prisma generate    # Regenerate Prisma client
```

### Database Issues
```bash
npm run db:reset       # Reset database completely
rm prisma/dev.db       # Delete SQLite database file
npm run db:migrate     # Recreate from migrations
npm run db:seed        # Repopulate with test data
```

### Testing Issues
```bash
npx playwright install  # Reinstall Playwright browsers
rm -rf test-results     # Clear old test artifacts
rm -rf playwright-report # Clear old reports
```

## Production Deployment (Future)
```bash
docker-compose up -d                    # Start production containers
docker-compose -f docker-compose.prod.yml up # Production deployment
```

## File System Operations (Linux)
```bash
find . -name "*.tsx" -not -path "./node_modules/*"  # Find React components
grep -r "function" --include="*.ts" lib/            # Search in TypeScript files  
ls -la app/api/                                     # List API endpoints
tree -I "node_modules|.next|.git"                  # Project structure overview
```

## Performance Monitoring
```bash
npm run build --analyze  # Analyze bundle size (when configured)
npm run test:coverage    # Code coverage analysis
```

## Important Notes
- **Never work directly on main branch** - always create feature branches
- **Run quality checks before commits** - build, lint, test, e2e
- **Database migrations are one-way** - be careful with db:reset
- **E2E tests require dev server running** - start with `npm run dev` first
- **Turbopack is enabled** - faster builds and hot reloading in development