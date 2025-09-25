# ChoreQuest Codebase Structure

## Root Directory Layout
```
ChoreQuest/
├── app/                    # Next.js App Router (pages and API routes)
├── components/             # Reusable React components
├── lib/                   # Utility libraries and shared code  
├── types/                 # TypeScript type definitions
├── prisma/                # Database schema and migrations
├── tests/                 # Test files (unit, integration, e2e)
├── public/                # Static assets
├── docs/                  # Project documentation
├── node_modules/          # Dependencies
├── .next/                 # Next.js build output
└── Configuration files
```

## App Directory (Next.js App Router)
```
app/
├── api/                   # API routes
│   ├── auth/             # Authentication endpoints
│   ├── characters/       # Character management
│   ├── quests/          # Quest system endpoints  
│   └── families/        # Family management
├── auth/                 # Authentication pages
├── dashboard/            # Main dashboard page
├── character/            # Character creation/management
├── layout.tsx           # Root layout component
├── page.tsx            # Home page
├── globals.css         # Global styles
└── favicon.ico         # App icon
```

## Components Directory
```
components/
├── auth/                 # Authentication-related components
├── character/            # Character system components
├── quest-dashboard.tsx   # Quest management dashboard
└── quest-create-modal.tsx # Quest creation interface
```

## Lib Directory (Utilities & Services)
```
lib/
├── generated/           # Generated Prisma client
├── prisma.ts           # Database client configuration
├── auth.ts             # Authentication utilities
├── auth-context.tsx    # Authentication React context
├── character-context.tsx # Character state management
├── middleware.ts       # Next.js middleware
├── quest-service.ts    # Quest business logic
├── user-service.ts     # User management logic
├── reward-calculator.ts # Reward calculation system
└── format-utils.ts     # Utility formatting functions
```

## Database Structure (Prisma)
```
prisma/
├── schema.prisma       # Database schema definition
├── migrations/         # Database migration files
├── seed.ts            # Database seeding script
├── dev.db             # SQLite development database
└── test.db           # SQLite test database
```

## Testing Structure
```
tests/
├── unit/              # Unit tests
│   ├── components/   # Component tests
│   └── rewards/      # Business logic tests  
├── api/              # API integration tests
├── e2e/              # End-to-end tests
│   └── helpers/      # E2E test utilities
├── utils/            # Test utilities
└── jest.setup.js     # Jest configuration
```

## Key Database Entities

### Core Models
- **families** - Family groups with invite codes
- **users** - Family members with roles (Guild Master, Hero, Young Hero)
- **characters** - RPG characters with classes, level, XP, currencies
- **quest_templates** - Reusable quest definitions
- **quest_instances** - Specific quest assignments
- **boss_battles** - Collaborative family challenges
- **transactions** - Currency tracking (gold, gems, honor points)
- **achievements** - Unlockable accomplishments
- **rewards** - Purchasable rewards with family approval

### Relationships
- families → users (one-to-many)
- users → characters (one-to-one)
- quest_templates → quest_instances (one-to-many)
- boss_battles ← boss_participants (many-to-many)
- families → all family-scoped data (privacy isolation)

## Component Architecture Patterns

### Authentication Flow
```
app/auth/ → components/auth/ → lib/auth-context.tsx → lib/auth.ts → app/api/auth/
```

### Quest Management Flow  
```
components/quest-dashboard.tsx → lib/quest-service.ts → app/api/quests/ → prisma/
```

### Character System Flow
```
app/character/ → lib/character-context.tsx → app/api/characters/ → prisma/
```

## API Route Structure
- **RESTful Design**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Family Scoping**: All endpoints respect family data isolation
- **Authentication**: JWT middleware on protected routes
- **Type Safety**: Zod schema validation on requests/responses

## File Naming Conventions
- **Pages**: `page.tsx` (Next.js App Router)
- **Layouts**: `layout.tsx` (Next.js App Router) 
- **Components**: kebab-case (`quest-dashboard.tsx`)
- **Utilities**: camelCase (`auth-context.tsx`)
- **Tests**: `*.test.ts` or `*.spec.ts`
- **API Routes**: RESTful structure (`/api/quests/[id]/route.ts`)

## Import Path Structure
- **Absolute Imports**: `@/` maps to project root
- **Relative Imports**: Used for same-directory files
- **Generated Code**: `lib/generated/prisma` (auto-generated client)

## Development Workflow Directories
- **Development Database**: `prisma/dev.db`
- **Test Database**: `prisma/test.db` 
- **Build Output**: `.next/` (ignored in git)
- **Test Results**: `test-results/`, `playwright-report/` (ignored in git)
- **Coverage Reports**: `coverage/` (ignored in git)