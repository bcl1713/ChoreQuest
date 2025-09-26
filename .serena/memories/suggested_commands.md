# ChoreQuest Development Commands

## Essential TDD Commands (Daily Use)
```bash
# Unit testing - primary development cycle
npm run test                # Run all unit tests
npm run test:watch          # Watch mode for TDD red-green-refactor cycles
npm run test:coverage       # Generate test coverage report

# E2E testing - integration verification
npx playwright test         # Run all E2E tests (requires dev server running)
npx playwright test --reporter=line  # Clean output for CI/automation
npx playwright test --headed # Debug mode (only for specific issues)

# Code quality - must pass before commits
npm run build              # Verify TypeScript compilation (zero errors required)
npm run lint               # Check ESLint rules (zero warnings/errors required)
```

## Development Server
```bash
# Primary development
npm run dev                # Start Next.js development server with Turbopack
npm run start             # Start production server (after build)

# Development environment
npm run docker:dev        # Start PostgreSQL and Redis containers
npm run docker:down       # Stop all containers
```

## Database Operations
```bash
# Core database workflow
npx prisma generate       # Generate Prisma client (after schema changes)
npx prisma migrate dev    # Create and apply new migration
npm run db:migrate        # Apply existing migrations
npm run db:seed           # Populate database with sample data
npm run db:reset          # Reset database to initial state (destructive)
npm run db:studio         # Open Prisma Studio GUI for database inspection
```

## Production Deployment
```bash
# Docker production deployment
docker compose -f docker-compose.prod.yml up -d    # Deploy production stack
docker compose -f docker-compose.prod.yml down     # Stop production stack
docker compose -f docker-compose.prod.yml logs -f  # Follow container logs
```

## Git Workflow Commands
```bash
# Branch management
git checkout main         # Switch to main branch
git checkout -b feature/your-feature  # Create new feature branch
git status               # Check working directory status
git add .                # Stage all changes
git commit -m "message"  # Commit with message

# PR workflow using GitHub CLI
git push -u origin feature/your-feature           # Push feature branch
gh pr create --title "Title" --body "Description" # Create pull request
gh pr merge --squash --delete-branch             # Merge and cleanup
```

## Quality Gate Sequence (Required Before Merge)
```bash
# Run this sequence - ALL must pass:
npm run build        # ✅ Zero TypeScript compilation errors
npm run lint         # ✅ Zero ESLint warnings/errors  
npm run test         # ✅ All unit tests pass
npx playwright test  # ✅ All E2E tests pass (requires dev server)
```

## Useful Development Utilities
```bash
# Linux system commands (this environment)
ls -la                   # List directory contents with details
find . -name "*.tsx"     # Find TypeScript React files
grep -r "searchTerm" .   # Search for text in files
ps aux | grep node      # Find running Node processes
lsof -i :3000           # Check what's using port 3000
pkill node              # Kill all Node processes (if needed)
```

## Project-Specific Scripts
```bash
# Specialized testing
npm run test:seed       # Test database seeding functionality
npm run test:e2e        # Alternative E2E test command

# Development helpers
chmod +x test-character-creation.sh  # Make shell script executable
./test-character-creation.sh         # Run custom test script
```

## Environment Setup
```bash
# Initial project setup
npm install             # Install all dependencies
cp .env.example .env    # Copy environment template
npm run docker:dev      # Start development services
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Apply database migrations
npm run db:seed         # Add sample data
```

## Health Monitoring
```bash
# Check application health
curl http://localhost:3000/api/health  # Verify API and database connectivity
docker ps                             # Check running containers
docker logs chorequest-app            # View application logs
docker logs chorequest-postgres       # View database logs
```