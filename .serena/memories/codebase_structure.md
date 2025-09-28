# ChoreQuest Codebase Structure

## Project Organization
```
ChoreQuest/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints (minimal after Supabase migration)
│   │   ├── health/        # Health check endpoint for Docker
│   │   └── test/          # Test endpoints for development
│   ├── auth/              # Authentication pages (login, register, create-family)
│   ├── dashboard/         # Main application dashboard
│   ├── character/         # Character creation and management
│   └── debug/             # Debug tools for development
├── components/            # Reusable React components
│   ├── auth/              # Authentication forms and components
│   ├── character/         # Character-related components
│   └── migration/         # Migration-specific components
├── lib/                   # Utility libraries and contexts
│   ├── generated/         # Generated Prisma client (legacy)
│   ├── auth-context.tsx   # Supabase authentication context
│   ├── character-context.tsx # Character state management
│   ├── realtime-context.tsx  # Supabase realtime subscriptions
│   └── supabase.ts        # Supabase client configuration
├── supabase/              # Supabase configuration and migrations
│   └── migrations/        # SQL migration files
├── tests/                 # Test files
│   ├── unit/              # Unit tests (Jest)
│   └── e2e/               # End-to-end tests (Playwright)
├── types/                 # TypeScript type definitions
├── public/                # Static assets
├── docs/                  # Project documentation
└── scripts/               # Utility scripts
```

## Key Architecture Patterns

### App Router Structure (Next.js 15)
- File-based routing in `app/` directory
- Server and client components properly separated
- API routes co-located with pages where appropriate

### Component Organization
- **Context Providers**: Authentication, character state, realtime updates
- **Reusable Components**: AuthForm, CharacterCreation, QuestDashboard, RewardStore
- **Page Components**: Dashboard, character creation, authentication flows

### Database Architecture
- **Supabase Native**: Direct client connections with Row Level Security
- **Family-Scoped Data**: All data isolated by family_id using RLS policies
- **Real-time Updates**: Automatic UI updates via Supabase subscriptions

### State Management
- React Context for authentication state (`lib/auth-context.tsx`)
- Character state management (`lib/character-context.tsx`)
- Real-time subscriptions for live data (`lib/realtime-context.tsx`)

## File Naming Conventions
- **Pages**: `page.tsx` in directory structure (Next.js App Router)
- **Components**: PascalCase `.tsx` files
- **Contexts**: kebab-case with `.tsx` extension
- **Utilities**: kebab-case with `.ts` extension
- **Types**: PascalCase interfaces and types

## Import Patterns
- Absolute imports using `@/` path mapping
- Components import types from same file when possible
- Consistent use of named exports for utilities
- Default exports for page and main components