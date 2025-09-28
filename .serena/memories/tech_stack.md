# ChoreQuest Technology Stack

## Frontend Technologies
- **Next.js 15** - React framework with App Router and Turbopack for fast development
- **React 19** - Modern React with concurrent features
- **TypeScript 5** - Full type safety throughout the application
- **Tailwind CSS 4** - Utility-first styling with custom fantasy theme
- **Framer Motion 12** - Animation library for smooth transitions (installed but not heavily used yet)

## Backend & Database
- **Supabase** - PostgreSQL database with built-in authentication and realtime subscriptions
- **@supabase/supabase-js 2.58** - JavaScript client library
- **Row Level Security (RLS)** - Family-scoped data isolation
- **Real-time Subscriptions** - Live updates for quest/reward changes

## Authentication & Security
- **Supabase Auth** - Built-in JWT authentication with session management
- **bcryptjs** - Password hashing (legacy, now handled by Supabase)
- **Zod 4.1.5** - Runtime type validation and input sanitization
- **Security Headers** - X-Frame-Options, X-Content-Type-Options, Referrer-Policy in Next.js config

## Development Tools
- **ESLint 9** - Code linting with Next.js TypeScript config
- **Prettier** - Code formatting (80 char width, prose wrap always, auto line endings)
- **Jest 30** - Unit testing framework with jsdom environment
- **@playwright/test 1.55** - End-to-end testing framework
- **@testing-library/react 16.3** - React component testing utilities

## Infrastructure & Deployment
- **Docker** - Containerized development and production deployment
- **PostgreSQL 16** - Production database (via Supabase)
- **Node.js 20+** - Runtime environment
- **Docker Compose** - Multi-service development setup

## Key Dependencies
- **jsonwebtoken 9.0.2** - JWT token handling (legacy)
- **uuid 13.0.0** - Unique identifier generation
- **socket.io 4.8.1** - Real-time communication (installed, not yet implemented)
- **redis 5.8.2** - Caching layer (installed, not yet implemented)

## Migration Status
- Recently migrated from custom Prisma + JWT system to native Supabase
- Eliminated ~500 lines of custom infrastructure code
- All API routes replaced with direct Supabase client calls
- Real-time system now uses Supabase subscriptions instead of custom SSE