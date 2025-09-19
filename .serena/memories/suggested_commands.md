# ChoreQuest Development Commands

## Essential Development Commands

### Development Server
```bash
npm run dev              # Start Next.js development server with Turbopack
npm run build           # Production build with Turbopack
npm run start           # Start production server
```

### Database Operations
```bash
npm run db:generate     # Generate Prisma client (run after schema changes)
npm run db:migrate      # Create and apply database migrations
npm run db:reset        # Reset database and apply all migrations
npm run db:seed         # Seed database with test data
npm run db:studio       # Open Prisma Studio for database GUI
```

### Testing
```bash
npm run test            # Run Jest unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
./test-character-creation.sh  # Run E2E API tests for character system
```

### Code Quality
```bash
npm run lint            # Run ESLint for code quality checks
```

### Docker Environment
```bash
npm run docker:dev      # Start PostgreSQL and Redis in Docker
npm run docker:down     # Stop Docker services
```

## Important File Paths
- **Prisma Schema**: `prisma/schema.prisma`
- **Database File**: `prisma/dev.db` (SQLite)
- **Generated Client**: `lib/generated/prisma` (custom output path)
- **API Routes**: `app/api/[feature]/route.ts`
- **Test Scripts**: `test-character-creation.sh`

## Development Workflow
1. Always create feature branch: `git checkout -b feature/feature-name`
2. Make changes and test locally
3. Run linting: `npm run lint` 
4. Run tests: `npm run test`
5. Build verification: `npm run build`
6. Create PR and merge to main
7. Deploy and cleanup branch

## System Commands (Linux)
- File operations: `ls`, `cd`, `grep`, `find`
- Git operations: `git branch`, `git checkout`, `git commit`, `git push`
- Process management: `ps`, `kill`, `jobs`
- Network debugging: `curl`, `netstat`