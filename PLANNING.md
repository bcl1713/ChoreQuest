# ChoreQuest: Project Planning Document

## Vision Statement

ChoreQuest transforms household chores into an epic fantasy RPG adventure where
family members become heroes completing quests (chores) to gain experience,
collect treasure, and defeat powerful bosses threatening their realm (home). The
system balances healthy competition between siblings with cooperative family
challenges, using positive reinforcement and catch-up mechanics to ensure
everyone stays engaged.

### Key Differentiators

- **Persistent boss battles** that require real teamwork and family cooperation
- **Full RPG progression** with classes, abilities, and equipment customization
- **Real-time collaboration** with push notifications and live family activity
  updates
- **Dual competitive/cooperative mechanics** that strengthen family bonds rather
  than create division
- **Smart home integration** for automated quest generation and completion
  detection
- **Seasonal content** that keeps the experience fresh and engaging year-round

## Architecture Overview

### High-Level System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile/Web    │    │   Load Balancer  │    │  Home Assistant │
│    Clients      │◄──►│     (NGINX)      │◄──►│   Integration   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │   React/Next.js │
                       │    Frontend     │
                       └────────┬────────┘
                                │
                       ┌────────▼────────┐
                       │  Node.js/Express│
                       │   API Server    │
                       └────────┬────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────▼────────┐ ┌─────▼─────┐ ┌────────▼────────┐
    │   PostgreSQL     │ │   Redis   │ │   Socket.IO     │
    │   Database       │ │   Cache   │ │  WebSocket      │
    └──────────────────┘ └───────────┘ └─────────────────┘
```

### Component Architecture

- **Frontend**: Mobile-first React 18 + Next.js 15 Progressive Web App
- **Backend**: Node.js/Express REST API with GraphQL layer for complex queries
- **Database**: PostgreSQL with Prisma ORM for type-safe operations
- **Real-time**: Socket.io for live updates, family activity feeds, and boss
  battles
- **Caching**: Redis for sessions, leaderboards, and performance optimization
- **Infrastructure**: Docker Compose containerization with NGINX reverse proxy

## Technology Stack

### Frontend Technologies

#### Core Framework & Language

- **Next.js 15** - Server-side rendering with App Router for optimal performance
- **React 18** - Modern React with concurrent features and suspense
- **TypeScript 5.4+** - Full type safety throughout the application
- **Tailwind CSS 3.4+** - Mobile-first responsive design system

#### UI & Animation

- **Framer Motion 11+** - Smooth animations and micro-interactions
- **@headlessui/react** - Accessible UI components
- **Lucide React** - Consistent icon library
- **React Query (TanStack)** - Efficient server state management and caching

#### PWA & Mobile Features

- **next-pwa** - Progressive Web App capabilities
- **workbox-webpack-plugin** - Service worker and offline functionality
- **Web Push API** - Browser-native push notifications

### Backend Technologies

#### Core Server & API

- **Node.js 18+** - JavaScript runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server-side development
- **GraphQL with Apollo** - Flexible data fetching for complex family
  relationships

#### Database & ORM

- **PostgreSQL 15** - Primary relational database
- **Prisma ORM** - Type-safe database operations with migrations
- **Database Migrations** - Version-controlled schema management

#### Authentication & Security

- **JSON Web Tokens (JWT)** - Stateless authentication system
- **bcrypt** - Password hashing and security
- **express-rate-limit** - API rate limiting protection
- **Zod** - Runtime type validation and input sanitization
- **Helmet.js** - Security headers and protection middleware

#### Real-time & Background Processing

- **Socket.io** - WebSocket connections for real-time features
- **Redis** - Session storage, caching, and real-time data
- **node-cron** - Scheduled task management
- **Bull Queue** - Background job processing

### Infrastructure & Deployment

#### Containerization & Orchestration

- **Docker** - Application containerization
- **Docker Compose** - Multi-service development and deployment
- **NGINX** - Reverse proxy, static file serving, SSL termination

#### Development & Quality Tools

- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting
- **Jest** - Unit testing framework
- **Playwright** - End-to-end testing
- **Husky** - Git hooks for quality gates

### Database Schema Design

#### Core Entity Relationships

```sql
-- User Management & Family Structure
families (id, name, invite_code, settings, created_at)
users (id, email, password_hash, family_id, role, display_name, last_active)
characters (id, user_id, name, class, level, xp, gold, gems, honor_points, avatar_config)

-- Quest System
quest_templates (id, family_id, name, category, difficulty, base_xp, base_gold, requirements)
quest_instances (id, template_id, assigned_to, status, due_date, completed_at, xp_awarded)

-- Boss Battle System
boss_battles (id, family_id, name, boss_type, max_hp, current_hp, status, loot_table)
boss_participants (id, boss_id, user_id, damage_dealt, abilities_used, last_action)

-- Economy & Rewards
transactions (id, user_id, type, amount, currency, reference_id, timestamp)
rewards (id, family_id, name, category, cost_gold, cost_gems, max_redemptions)
reward_redemptions (id, user_id, reward_id, status, approved_by, fulfilled_at)

-- Social & Achievement Systems
achievements (id, name, description, unlock_criteria, reward_xp, badge_image)
user_achievements (id, user_id, achievement_id, progress, unlocked_at)
family_messages (id, family_id, sender_id, message_type, content, created_at)
activity_feed (id, family_id, user_id, activity_type, title, description, metadata)
```

## Required Tools & Development Environment

### Development Setup Requirements

#### Core Development Tools

- **Node.js 18+** - JavaScript runtime
- **npm 9+** - Package manager
- **Git** - Version control system
- **Docker & Docker Compose** - Containerization platform
- **PostgreSQL 15** - Database server
- **Redis 7** - Caching and session store

#### Code Editors & Extensions

- **Visual Studio Code** (recommended)
  - TypeScript extension
  - ESLint extension
  - Prettier extension
  - Prisma extension
  - Tailwind CSS IntelliSense

#### Development Database Setup

```bash
# Local development environment
docker-compose -f docker-compose.dev.yml up -d postgres redis
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### Testing Tools

- **Jest** - Unit testing framework
- **React Testing Library** - Component testing utilities
- **Playwright** - End-to-end browser testing
- **Supertest** - API endpoint testing

#### Quality Assurance Tools

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking
- **Husky** - Pre-commit hooks
- **lint-staged** - Run linters on git staged files

### Production Deployment Requirements

#### Infrastructure Components

- **Docker Host** - Container runtime environment
- **NGINX** - Web server and reverse proxy
- **Let's Encrypt** - SSL certificate management
- **PostgreSQL Server** - Production database
- **Redis Server** - Production cache and sessions

#### Monitoring & Maintenance

- **Application Health Checks** - Built-in health monitoring endpoints
- **Database Backup Strategy** - Automated daily backups with retention
- **Log Management** - Centralized logging and error tracking
- **Performance Monitoring** - Application performance metrics

### Essential Development Commands

```bash
# Initial Setup
npm install                    # Install dependencies
npx prisma generate           # Generate Prisma client
npx prisma migrate dev        # Run database migrations
npm run dev                   # Start development server

# Development Workflow
npm run lint                  # Code linting
npm run test                  # Run unit tests
npm run test:watch           # Watch mode for TDD
npx playwright test          # End-to-end tests
npm run build               # Production build
npm run start               # Start production server

# Database Operations
npx prisma studio           # Database GUI
npx prisma migrate reset    # Reset database
npm run db:seed            # Seed test data

# Docker Operations
docker-compose -f docker-compose.dev.yml up    # Development environment
docker-compose up -d                           # Production deployment
```

### External Service Integrations

#### Required Third-Party Services

- **Email Service Provider** (optional) - For password resets and notifications
- **File Storage** (optional) - Avatar images and achievement badges

#### Optional Integration Services

- **Home Assistant** - Smart home integration API
- **Push Notification Services** - Enhanced mobile notifications
- **Analytics Services** - User engagement and application performance
  monitoring

## Implementation Strategy

### Development Phases

#### Phase 1: Core Foundation (3-4 weeks) ✅ COMPLETED

**MVP: "It Actually Works" Release** - v0.1.0

- ✅ User authentication with family grouping
- ✅ Basic character creation and progression
- ✅ Core quest system (create, assign, complete, approve)
- ✅ Simple reward store with approval workflow
- ✅ Mobile-responsive interface with touch-friendly controls
- ✅ Parent dashboard for quest management
- ✅ Production Docker deployment system

#### Phase 1.5: Advanced Family Management (3-4 weeks)

**The "Customizable Family Platform" Release** - v0.2.0

- Multi-Guild Master system for co-parenting couples
- Quest template creation and management interface
- Reward creation and management interface
- Real-time updates with Server-Sent Events
- Character class bonus display during creation
- Extended demo families with different management styles
- Consolidated admin dashboard for Guild Masters

#### Phase 2: Game Enhancement (3-4 weeks)

**The "Now It's Actually Fun" Release** - v0.3.0

- Fantasy-themed UI with animations
- Avatar customization system
- Class abilities and special powers
- Enhanced real-time features
- Interactive boss battle system
- Achievement system with celebrations

#### Phase 3: Social Features (3-4 weeks)

**The "Family Competition & Cooperation" Release**

- Dual leaderboard system
- SOS help request system
- Live activity feed
- Advanced catch-up mechanics
- In-app family messaging
- Advanced boss battle mechanics

#### Phase 4: Advanced Features (Ongoing)

**The "Full Featured Experience" Release**

- Home Assistant integration
- Seasonal event system
- Community features
- Machine learning recommendations
- Advanced customization options
- Performance optimization

### Development Methodology

#### Strict Test-Driven Development (TDD)

- **Red-Green-Refactor cycle** enforced for all features
- **80%+ code coverage** requirement across all layers
- **Comprehensive test suite** with unit, integration, and E2E tests
- **Quality gates** prevent deployment of untested code

#### Code Quality Standards

- **Zero tolerance** for ESLint warnings or TypeScript errors
- **Prettier formatting** enforced on all commits
- **Pre-commit hooks** ensure code quality
- **Frequent commits** with meaningful messages
- **Branch-based workflow** with pull request reviews

### Security Considerations

#### Authentication & Authorization

- **JWT-based authentication** with refresh token rotation
- **Role-based permissions** (Guild Master, Hero, Young Hero)
- **Multi-Guild Master support** - Multiple parents can co-manage families
- **Family-scoped data isolation** - no cross-family data leakage
- **Input validation** using Zod schemas for all API endpoints

#### Data Protection

- **Password hashing** with bcrypt
- **SQL injection prevention** through Prisma ORM
- **XSS protection** with content sanitization
- **Rate limiting** on API endpoints
- **HTTPS enforcement** in production

## Success Metrics & Analytics

### Key Performance Indicators

- **Daily Active Users**: >80% family participation
- **Quest Completion Rate**: >85% successfully completed quests
- **Family Engagement**: >90% all-family participation within 7 days
- **Long-term Retention**: >70% families active after 30 days
- **Real-world Impact**: Measurable improvement in household task completion

### Privacy-First Analytics

- **Family-only data** aggregation with no cross-family tracking
- **Opt-in reporting** for system improvement data
- **Local storage priority** for sensitive information
- **Anonymous usage patterns** collection without personal identification
- **Automatic data purging** after defined retention periods

## Future Vision

### Year 1 Roadmap

- **Q1 ✅**: Complete MVP with stable core functionality (v0.1.0)
- **Q2**: Advanced family management with multi-GM and real-time features
  (v0.2.0)
- **Q3**: Enhanced game experience with animations and interactive features
  (v0.3.0)
- **Q4**: Social features, family dynamics, and Home Assistant integration
  (v0.4.0)

### Long-term Expansion

- **Community Features**: Neighborhood guilds and family showcases
- **AI Integration**: Smart quest generation and predictive engagement
- **Educational Integration**: School partnerships and life skills curriculum
- **IoT Automation**: Smart home device integration for automatic quest
  detection

---

## Getting Started

### Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Docker and Docker Compose installed
- [ ] Git configured for development
- [ ] Code editor with recommended extensions
- [ ] PostgreSQL and Redis accessible (locally or via Docker)

### Quick Start Commands

```bash
git clone <repository-url>
cd ChoreQuest
npm install
cp .env.example .env.local
docker-compose -f docker-compose.dev.yml up -d
npx prisma migrate dev
npm run dev
```

### Development Resources

- **Technical Design Document**:
  `/docs/202508291550-Technical-Design-Documnent.md`
- **Game Design Document**: `/docs/202508291552-Game-Design-Document.md`
- **Project Instructions**: `/CLAUDE.md`

---

_Ready to transform chores into epic family adventures! 🏰⚔️_
