# ChoreQuest Tech Stack

## Frontend
- **Next.js 15**: App Router with server-side rendering
- **React 19**: Latest React version with new features
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS 4**: Modern utility-first CSS framework
- **Framer Motion 12**: Animations and transitions for fantasy theme

## Backend
- **Next.js API Routes**: RESTful API endpoints
- **Prisma 6**: ORM with type-safe database operations
- **SQLite**: Development database (configured for PostgreSQL in production)
- **JWT Authentication**: Token-based auth with bcryptjs for password hashing
- **Zod**: Schema validation for API inputs
- **Redis**: Configured for caching and sessions (not yet implemented)
- **Socket.io**: Real-time features (configured but not implemented)

## Development Tools
- **TypeScript 5**: Latest TypeScript version
- **ESLint**: Code linting with Next.js and TypeScript rules
- **Jest 30**: Unit testing framework with React Testing Library
- **Playwright**: End-to-end testing
- **Docker Compose**: Development environment setup
- **Prisma Studio**: Database GUI

## Database Architecture
- **Prisma Client**: Generated in `lib/generated/prisma` (custom output path)
- **Migrations**: Prisma-managed schema migrations
- **Seeding**: Database seeding script support

## Fonts & UI
- **Google Fonts**: Cinzel (fantasy headers), Orbitron (sci-fi elements)
- **Geist**: Sans and mono fonts for modern UI elements
- **Progressive Web App**: Configured for mobile installation