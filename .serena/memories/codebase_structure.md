# ChoreQuest Codebase Structure

## Directory Layout
```
ChoreQuest/
├── app/                    # Next.js app router pages
│   ├── api/               # API route handlers
│   │   ├── auth/          # Authentication endpoints
│   │   ├── character/     # Character management
│   │   ├── rewards/       # Reward system endpoints
│   │   ├── quests/        # Quest management
│   │   ├── health/        # Health check endpoint
│   │   └── test/          # Test-only API endpoints
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard page
│   ├── character/         # Character pages
│   ├── globals.css        # Global styles & fantasy theme
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Landing/home page
├── components/            # Reusable React components
│   ├── auth/              # Authentication components
│   │   └── AuthForm.tsx   # Login/register/create family forms
│   ├── character/         # Character-related components
│   ├── quest-dashboard.tsx    # Quest management UI
│   ├── reward-store.tsx       # Reward redemption UI
│   └── quest-create-modal.tsx # Quest creation modal
├── lib/                   # Utility libraries
│   ├── auth.ts            # JWT & password utilities
│   ├── auth-context.tsx   # Authentication React context
│   ├── character-context.tsx # Character data context
│   ├── prisma.ts          # Database client configuration
│   ├── quest-service.ts   # Quest business logic
│   ├── user-service.ts    # User management utilities
│   ├── reward-calculator.ts # Reward calculation logic
│   └── generated/         # Prisma generated client
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Database schema definition
│   ├── seed.ts            # Database seeding script
│   └── migrations/        # Database migration files
├── tests/                 # Test files
│   ├── api/               # API endpoint tests
│   ├── e2e/               # End-to-end Playwright tests
│   │   └── helpers/       # Test helper functions
│   └── jest.setup.js      # Jest test configuration
├── types/                 # TypeScript type definitions
├── public/                # Static assets
├── docs/                  # Project documentation
├── docker-compose.yml     # Development Docker setup
├── docker-compose.prod.yml # Production Docker setup
├── Dockerfile             # Production container build
└── entrypoint.sh          # Container startup script
```

## Key Configuration Files
- `package.json` - Dependencies and npm scripts
- `next.config.ts` - Next.js configuration with standalone output
- `eslint.config.mjs` - ESLint configuration
- `jest.config.js` - Jest testing configuration
- `playwright.config.ts` - E2E testing configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration (implied)
- `.env` - Environment variables for development
- `CLAUDE.md` - Development workflow and conventions
- `PLANNING.md` - Project planning and roadmap
- `TASKS.md` - Task tracking and completion status