# ChoreQuest Codebase Structure

## Root Directory Layout
```
ChoreQuest/
├── app/                 # Next.js App Router (main application)
├── components/          # Reusable React components
├── lib/                 # Utility libraries and configurations
├── prisma/             # Database schema and migrations
├── public/             # Static assets
├── tests/              # Test files
├── types/              # TypeScript type definitions
├── docs/               # Project documentation
└── Configuration files (package.json, tsconfig.json, etc.)
```

## App Directory Structure (Next.js 15 App Router)
```
app/
├── api/                # API routes
│   ├── auth/          # Authentication endpoints
│   │   ├── register/
│   │   ├── login/
│   │   └── create-family/
│   ├── character/     # Character management
│   │   └── create/
│   └── profile/       # User profile
├── auth/              # Authentication pages
│   ├── login/
│   ├── register/
│   └── create-family/
├── character/         # Character-related pages
│   └── create/
├── dashboard/         # Main dashboard
├── layout.tsx         # Root layout with fonts and styles
├── page.tsx           # Home page
└── globals.css        # Global styles
```

## Library Structure
```
lib/
├── generated/         # Generated Prisma client (custom output)
├── auth.ts           # Authentication utilities (JWT, password hashing)
├── auth-context.tsx  # React context for authentication state
├── character-context.tsx # React context for character state
├── prisma.ts         # Prisma client configuration
├── middleware.ts     # Next.js middleware
└── format-utils.ts   # Utility functions for formatting
```

## Database Structure
```
prisma/
├── schema.prisma     # Complete database schema
├── dev.db           # SQLite development database
└── migrations/      # Prisma migration files (auto-generated)
```

## Key Implementation Files

### Authentication System
- `app/api/auth/register/route.ts` - User registration
- `app/api/auth/login/route.ts` - User login  
- `app/api/auth/create-family/route.ts` - Family creation
- `lib/auth.ts` - JWT and password utilities
- `lib/auth-context.tsx` - Global auth state

### Character System  
- `app/api/character/route.ts` - Character data retrieval
- `app/api/character/create/route.ts` - Character creation
- `lib/character-context.tsx` - Global character state
- `app/character/create/page.tsx` - Character creation UI

### Testing
- `test-character-creation.sh` - E2E API testing script
- `jest.config.js` - Jest configuration
- `playwright.config.ts` - E2E testing configuration

## Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint rules and settings
- `next.config.ts` - Next.js configuration
- `docker-compose.yml` - Docker development environment
- `tailwind.config.js` - Tailwind CSS configuration (implied)