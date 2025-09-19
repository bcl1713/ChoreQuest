# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ChoreQuest Project Overview

ChoreQuest is a fantasy RPG-themed family chore management system designed to gamify household tasks. The system transforms daily chores into epic quests where family members become heroes earning XP, gold, and rewards through real-world task completion.

## High-Level Architecture

This is a **planned full-stack web application** with the following intended architecture based on the design documents:

### Frontend
- **React 18 + Next.js 15**: Server-side rendering with App Router
- **TypeScript**: Full type safety throughout
- **Tailwind CSS**: Mobile-first responsive design
- **Framer Motion**: Animations and visual feedback
- **Progressive Web App**: Installable mobile experience

### Backend
- **Node.js/Express**: RESTful API server
- **PostgreSQL + Prisma ORM**: Primary database with type-safe operations
- **Redis**: Caching and session management
- **Socket.io**: Real-time features (family activity, boss battles)
- **JWT Authentication**: Role-based access control

### Infrastructure
- **Docker Compose**: Containerized development and deployment
- **NGINX**: Reverse proxy and static file serving
- **Automated backups**: PostgreSQL backup strategy

## Core Game Concepts

### Character System
- **Classes**: Knight, Mage, Ranger, Rogue, Healer (each with specialization bonuses)
- **Progression**: XP-based leveling with unlockable abilities
- **Avatars**: Customizable fantasy characters with equipment display

### Quest System
- **Daily Quests**: Routine household tasks (make bed, brush teeth, etc.)
- **Weekly Quests**: Larger projects (deep cleaning, yard work)
- **Boss Battles**: Collaborative family challenges with persistent HP
- **Bonus Objectives**: Optional extra challenges for additional rewards

### Economy
- **Gold**: Primary currency from quest completion
- **Gems**: Premium currency from boss battles and achievements
- **Honor Points**: Social currency from helping family members
- **Real-world Rewards**: Screen time, privileges, purchases, experiences

### Family Dynamics
- **Dual Leaderboards**: Individual achievement + family cooperation
- **SOS System**: Help requests between family members
- **Catch-up Mechanics**: Automatic balancing to prevent discouragement
- **Real-time Activity**: Live family quest completion feed

## Project Status

**Current State**: Early development phase
- Core authentication system implemented (JWT, family/user management)
- Character creation and basic dashboard functionality complete
- Database schema established with Prisma ORM
- Test infrastructure configured (Playwright E2E, Jest unit tests)
- Linting and build pipeline working

**Completed Features:**
- ✅ User authentication (login/register/create family)
- ✅ Character creation with class selection
- ✅ Basic dashboard with character stats
- ✅ JWT-based session management
- ✅ Family grouping system
- ✅ TypeScript integration throughout
- ✅ ESLint/Prettier configuration

**Next Priority (MVP Completion):**
- Quest system (create/assign/complete quests)
- Reward store and economy
- Mobile-responsive improvements
- Achievement system basics

**Development Approach**: Strict Test-Driven Development (TDD)
- Red-Green-Refactor cycle enforced
- Zero tolerance for linting warnings
- Comprehensive E2E test coverage required
- All features must pass quality gates before merge

## Development Commands

Since this is a new project, standard Next.js/Node.js commands will apply once implemented:

```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Code linting
npm run test            # Run test suite
npm run test:watch      # Watch mode testing
npm run test:e2e        # End-to-end tests with Playwright

# Database
npm run db:migrate      # Run Prisma migrations
npm run db:seed         # Seed database with test data
npm run db:studio       # Open Prisma Studio

# Docker
npm run docker:dev      # Development environment
npm run docker:prod     # Production deployment
```

## Key Features to Implement

### Phase 1 (MVP - 3-4 weeks)
- User authentication with family grouping
- Basic character creation and progression
- Core quest system (create/assign/complete/approve)
- Simple reward store
- Mobile-responsive interface

### Phase 2 (Game Enhancement - 3-4 weeks)
- Fantasy UI with animations
- Avatar customization
- Real-time updates via Socket.io
- Boss battle system
- Achievement system

### Phase 3 (Social Features - 3-4 weeks)
- Dual leaderboard system
- SOS help requests
- Family activity feed
- Advanced catch-up mechanics
- Parent analytics dashboard

### Phase 4 (Advanced Features - Ongoing)
- Home Assistant integration
- Seasonal events
- Community features
- IoT integration possibilities

## Database Schema Highlights

Key entity relationships:
- **Families** → **Users** → **Characters** (one-to-many hierarchies)
- **Quest Templates** → **Quest Instances** (reusable vs. specific tasks)
- **Boss Battles** ← **Boss Participants** (many-to-many collaboration)
- **Achievements** ← **User Achievements** (progress tracking)
- **Transactions** (comprehensive economy tracking)

## Testing Strategy

**TDD Requirements**:
- Write failing tests before any production code
- Maintain 80%+ code coverage across all layers
- Unit tests (70%), Integration tests (25%), E2E tests (5%)

**Test Categories**:
- API endpoints with authentication
- Database operations and transactions
- Real-time Socket.io events
- React component behavior
- Complete user workflows

## Security Considerations

- JWT-based authentication with refresh tokens
- Role-based permissions (Guild Master, Hero, Young Hero)
- Input validation using Zod schemas
- Rate limiting on API endpoints
- Family-scoped data isolation
- No cross-family data leakage

## Integration Points

### Home Assistant (Future)
- REST API endpoints for family metrics
- WebSocket events for real-time updates
- Webhook support for external triggers
- Automated quest creation from sensor data

### Smart Home Potential
- IoT sensor integration
- Voice assistant support
- Calendar synchronization
- Automatic task completion detection

## Development Notes

- **Mobile-first design**: All interfaces must work on phones/tablets
- **Family-focused**: Multi-user experience within single household
- **Real-time collaboration**: Socket.io for live family interactions
- **Positive reinforcement**: Game mechanics designed to encourage, not punish
- **Scalable architecture**: Docker-based deployment ready for growth

## Implementation Priority

1. **Start with Phase 1 MVP** - establish core functionality
2. **Focus on mobile experience** - primary interaction method
3. **Implement TDD rigorously** - quality foundation critical
4. **Design for real-time** - family collaboration is key differentiator
5. **Plan for Home Assistant integration** - technical differentiator

When implementing features, always consider:
- How does this strengthen family bonds?
- Is this accessible to younger users?
- Does this create positive motivation?
- Can this scale to different family sizes?
- How does this integrate with the fantasy theme?
- Always create a branch for new features and commit often.  When a feature is complete create a PR and merge to main

## 🚨 MANDATORY Test-Driven Development Workflow 🚨

**⚠️ CRITICAL: STRICT TDD PROCESS - NO EXCEPTIONS ⚠️**

Every change follows this exact sequence. No shortcuts, no "simplified testing", no workarounds.

### ✅ MANDATORY TDD Process (STRICT ORDER)

#### 1. **Identify & Branch** 🎯
```bash
# Clearly identify what we're working on
# Create feature branch immediately
git checkout -b feature/feature-name
```

#### 2. **Write Tests FIRST** 🧪
- Write failing tests for the functionality you want to implement
- Tests MUST be comprehensive - happy path, edge cases, error conditions
- Fix any test infrastructure issues (never skip broken tests)
- Run tests: `npm run test` and `npx playwright test`
- Tests MUST fail initially (Red phase)

#### 3. **Implement & Iterate** 🔄
- Write minimal code to make tests pass (Green phase)
- Make frequent, focused commits during development
- Refactor and improve code quality (Refactor phase)
- Continue Red-Green-Refactor cycle until feature complete

#### 4. **Quality Gate - ALL MUST PASS** ✅
```bash
npm run build        # Zero compilation errors
npm run lint         # Zero linting errors/warnings
npm run test         # All unit tests pass
npx playwright test  # All E2E tests pass
```
**If ANY step fails, fix it. No exceptions.**

#### 5. **Pull Request & Merge** 🚀
```bash
git push -u origin feature/feature-name
gh pr create --title "Feature description" --body "Detailed description"
gh pr merge --squash --delete-branch
```

### 🚨 CRITICAL RULES

#### Testing Infrastructure
- **If tests are broken, FIX THEM** - never work around broken tests
- **If Playwright fails, DEBUG AND FIX** - don't create simplified testing
- **Test coverage matters** - write comprehensive tests for all scenarios
- **E2E tests are mandatory** - they catch integration issues

#### Quality Standards
- **Zero tolerance for warnings** - fix all linting and TypeScript warnings
- **Build must be clean** - no compilation errors ever
- **Frequent commits** - commit often with meaningful messages
- **No direct main commits** - every change goes through branch → PR → merge

#### Test-First Mentality
1. **Write the test for what you want to build**
2. **Watch it fail (Red)**
3. **Write minimal code to pass (Green)**
4. **Improve the code (Refactor)**
5. **Repeat until feature complete**

### 🔧 Development Commands

```bash
# Essential TDD Commands
npm run test         # Run unit tests
npm run test:watch   # Watch mode for TDD cycles
npx playwright test  # E2E tests
npm run build        # Verify compilation
npm run lint         # Check code quality

# Database Operations
npx prisma generate  # After schema changes
npx prisma migrate dev # Apply migrations
```

### 💡 Lessons Learned

#### From Character Creation Fix Experience:
- **Tests revealed the real issue** - redirect loop due to stale context
- **Linting discipline matters** - clean code prevents future bugs
- **Build verification catches issues early** - don't skip this step
- **E2E tests are valuable** - they catch real user flow problems

#### Never Do This Again:
- ❌ Skip test writing because "tests are broken"
- ❌ Accept linting warnings "temporarily"
- ❌ Work around test infrastructure issues
- ❌ Make changes without comprehensive testing
- ❌ Create PRs with failing tests

#### Always Do This:
- ✅ Fix broken test infrastructure immediately
- ✅ Write tests before implementation
- ✅ Maintain zero warnings/errors standard
- ✅ Test all user scenarios end-to-end
- ✅ Commit frequently with clear messages

### 🎯 Success Criteria

Every feature completion must achieve:
- ✅ All tests written before implementation
- ✅ All tests passing (unit + E2E)
- ✅ Zero compilation errors
- ✅ Zero linting warnings
- ✅ Clean build successful
- ✅ PR merged with comprehensive description
- ✅ Feature branch cleaned up

**Remember: The goal is quality software through disciplined TDD practice.**