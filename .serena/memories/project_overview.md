# ChoreQuest Project Overview

ChoreQuest is a fantasy RPG-themed family chore management system that transforms household tasks into epic adventures. Built with modern web technologies, it's designed for families who want to gamify their daily routines.

## Vision Statement
ChoreQuest transforms household chores into an epic fantasy RPG adventure where family members become heroes completing quests (chores) to gain experience, collect treasure, and defeat powerful bosses threatening their realm (home). The system balances healthy competition between siblings with cooperative family challenges, using positive reinforcement and catch-up mechanics to ensure everyone stays engaged.

## Key Features
- **Fantasy RPG Experience**: Character classes (Knight, Mage, Ranger, Rogue, Healer), XP/leveling, currency system (gold, gems, honor points), boss battles
- **Family-Focused**: Private family guilds with join codes, role-based access (Guild Master, Hero, Young Hero), real-time updates, SOS help system
- **Quest System**: Daily/Weekly/Boss Battle categories, difficulty levels, assignment and approval workflow
- **Progressive Web App**: Mobile-first design, installable, offline capabilities

## Current Development Status
**Phase 1 (MVP)** - Nearly complete:
- ✅ Authentication & user management (JWT-based)
- ✅ Database foundation (SQLite with Prisma ORM)
- ✅ Character system (classes, progression, currencies)
- ✅ Basic quest system (templates, instances, status management)
- ✅ Frontend foundation (Next.js 15, React 19, TypeScript)
- ✅ Development infrastructure (Jest, Playwright, TDD workflow)
- 🔄 In Progress: Parent dashboard, quest board UI, character stats display

**Next Phases**: Game enhancement (animations, boss battles, real-time features), social features (leaderboards, SOS system), advanced features (Home Assistant integration, AI recommendations)

## Family-Scoped Privacy
- All data is isolated by family - no cross-family data leakage
- Private family guilds with unique invite codes
- Role-based permissions ensure appropriate access levels
- Privacy-first analytics - only family-scoped data collection