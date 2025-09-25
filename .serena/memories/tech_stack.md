# ChoreQuest Technology Stack

## Frontend Technologies
- **Next.js 15**: Server-side rendering with App Router and Turbopack
- **React 19**: Modern React with concurrent features
- **TypeScript 5**: Full type safety throughout the application
- **Tailwind CSS 4**: Mobile-first responsive design system with fantasy theme
- **Framer Motion 12**: Animations and micro-interactions (planned)

## Backend Technologies
- **Node.js 18+**: JavaScript runtime environment
- **Next.js API Routes**: Built-in API endpoints
- **TypeScript**: Type-safe server-side development
- **JWT Authentication**: Stateless authentication with bcryptjs password hashing
- **Zod 4**: Runtime type validation and input sanitization

## Database & ORM
- **SQLite**: Development database (file-based)
- **PostgreSQL**: Production database (planned migration path)
- **Prisma ORM**: Type-safe database operations with migrations
- **Generated Prisma Client**: Located in `lib/generated/prisma`

## Real-Time & Background Processing (Planned)
- **Socket.io 4**: WebSocket connections for real-time features
- **Redis 5**: Session storage, caching, and real-time data

## Testing Framework
- **Jest 30**: Unit testing with 80%+ coverage requirement
- **@testing-library/react & jest-dom**: Component testing utilities
- **Playwright 1.55**: End-to-end browser testing
- **jsdom**: Test environment for React components

## Development & Quality Tools
- **ESLint**: Code linting with Next.js configuration
- **Prettier**: Code formatting (80 char width, auto endOfLine)
- **TypeScript Compiler**: Strict type checking enabled
- **Docker Compose**: Containerized development environment

## Infrastructure
- **Docker**: Application containerization
- **NGINX**: Reverse proxy and static file serving (planned)
- **Let's Encrypt**: SSL certificate management (planned)

## Package Management
- **npm**: Package manager with lockfile
- **Next.js 15.5.2**: Latest framework version
- **React 19.1.0**: Latest React version

## Architecture Notes
- **File-based routing**: Next.js App Router in `/app` directory
- **API Routes**: RESTful endpoints in `/app/api`
- **Component Structure**: Organized by feature in `/components`
- **Utility Libraries**: Shared code in `/lib` directory
- **Type Definitions**: Custom types in `/types` directory
- **Database Schema**: Prisma schema with comprehensive relationships