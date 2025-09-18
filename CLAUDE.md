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

**Current State**: Early planning phase
- Design documents completed (Game Design Document, Technical Design Document)
- No code implementation yet
- Architecture and feature specifications defined

**Development Approach**: Test-Driven Development (TDD)
- Red-Green-Refactor cycle mandatory
- 80%+ code coverage required
- Unit, integration, and E2E testing strategy defined

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

## 🚨 MANDATORY Development Workflow 🚨

**⚠️ CRITICAL: NO CODE CHANGES WITHOUT FOLLOWING THIS PROCESS ⚠️**

Every single code change, no matter how small (even 1-line changes), MUST follow this workflow:

### ✅ MANDATORY Development Process (NO EXCEPTIONS)
1. **Feature Branch Creation**: ALWAYS create a feature branch before ANY code changes (`git checkout -b feature/feature-name`)
2. **Implement Changes**: Make your code changes on the feature branch
3. **Commit Changes**: Make focused commits with descriptive messages
4. **Test Implementation**: Verify functionality works as expected
5. **Build Verification**: Run `npm run build` to ensure no compilation errors
6. **Pull Request**: Create PR with implementation summary
7. **Merge & Cleanup**: Merge to main and delete feature branch

**🛑 STOP: If you find yourself making direct changes to main branch or skipping the branch creation step, STOP IMMEDIATELY and create a branch first.**

### 🧪 Testing Requirements
- **API Testing**: Create automated test scripts for all endpoints (bash scripts work well)
- **Edge Case Testing**: Test error conditions, validation failures, and edge cases
- **Integration Testing**: Verify full user flows work end-to-end
- **Test Data**: Include proper test attributes (`data-testid`) for UI testing
- **Documentation**: Document test results in PR descriptions

### 🔧 Technical Implementation Notes
- **Prisma Setup**: Always run `npx prisma generate` after schema changes
- **Import Paths**: Use generated Prisma client from `@/lib/generated/prisma` not `@prisma/client`
- **Type Safety**: Create proper TypeScript interfaces instead of using `any`
- **Error Handling**: Implement proper validation and error responses in API routes
- **Context Management**: Use React contexts for app-wide state (auth, character, etc.)

### 🚀 Deployment Checklist
- [ ] Feature branch created and pushed
- [ ] All tests passing (API + E2E)
- [ ] Build compiles successfully (`npm run build`)
- [ ] TypeScript errors resolved
- [ ] Commit messages follow convention
- [ ] PR created with comprehensive description
- [ ] Feature merged and branch cleaned up

### ⚡ Performance & Quality
- **Build Verification**: Run `npm run build` to catch compilation issues early
- **Development Server**: Clean `.next` cache if encountering build issues
- **Database**: Keep migrations and schema in sync
- **Code Quality**: Address TypeScript/ESLint warnings proactively

## 🚨 CRITICAL WORKFLOW REMINDER 🚨
**BEFORE ANY CODE CHANGES:**
1. Check current branch: `git branch`
2. If on main branch, create feature branch IMMEDIATELY: `git checkout -b feature/feature-name`
3. Make changes only on feature branch
4. Follow full PR workflow (commit, test, build, PR, merge)
5. NO EXCEPTIONS - Even single-line changes require branches and PRs