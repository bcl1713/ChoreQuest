# ChoreQuest Tech Stack

## Frontend Technologies
- **Next.js 15**: App Router with Turbopack for fast development
- **React 19**: Modern React with concurrent features
- **TypeScript**: Full type safety throughout application
- **Tailwind CSS 4**: Utility-first styling with custom fantasy theme
- **Framer Motion**: Animation library for enhanced UX

## Backend Technologies
- **Next.js API Routes**: RESTful API endpoints
- **PostgreSQL**: Production database (migrated from SQLite)
- **Prisma 6.15.0**: Type-safe ORM with automatic migrations
- **JWT**: Authentication with jsonwebtoken library
- **bcryptjs**: Password hashing and verification
- **Redis**: Caching and session management (development setup)
- **Zod**: Runtime type validation and schema parsing

## Development Tools
- **ESLint**: Code quality and style enforcement
- **Prettier**: Code formatting (configured)
- **Jest**: Unit testing framework with Testing Library
- **Playwright**: End-to-end testing framework
- **tsx**: TypeScript execution for scripts

## Infrastructure & Deployment
- **Docker**: Development and production containerization
- **Docker Compose**: Multi-service orchestration
- **GitHub**: Version control with Git workflow
- **Socket.io**: Real-time communication (configured, not fully implemented)

## Key Dependencies
```json
{
  "next": "15.5.2",
  "react": "19.1.0", 
  "typescript": "^5",
  "tailwindcss": "^4",
  "@prisma/client": "^6.15.0",
  "framer-motion": "^12.23.12",
  "jsonwebtoken": "^9.0.2",
  "zod": "^4.1.5"
}
```

## Development Environment
- **Node.js**: 20+ required
- **PostgreSQL**: Local development via Docker
- **Redis**: Caching layer via Docker
- **Git**: Version control with branch-based workflow