# ChoreQuest Project Overview

## Purpose
ChoreQuest is a fantasy RPG-themed family chore management system that transforms household tasks into epic adventures. It gamifies daily routines for families by providing:
- Character classes (Knight, Mage, Ranger, Rogue, Healer)
- Experience points and leveling system
- Currency system (gold, gems, honor points)
- Family guild system with role-based access
- Quest management and reward redemption system

## Current Status
- **Version**: 0.1.0 (Production-ready MVP)
- **Phase**: Phase 1 complete, ready for Phase 2 enhancements
- **Deployment**: Enterprise-grade Docker deployment with zero-interaction setup

## Key Features Implemented
- Complete user authentication and family management
- Character creation and progression mechanics
- Quest system with approval workflows
- Reward store with redemption and approval system
- Mobile-responsive design with touch-friendly controls
- Comprehensive testing suite (unit and E2E tests)

## Architecture
- **Frontend**: Next.js 15 App Router with React 19
- **Backend**: API routes with PostgreSQL database
- **Real-time**: Socket.io for live updates (planned)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with custom fantasy theme
- **Testing**: Jest (unit tests) + Playwright (E2E tests)
- **Deployment**: Docker with production-ready configuration

## Development Philosophy
- Test-Driven Development (TDD) approach
- Family-first design with positive reinforcement
- Mobile-first responsive design
- Dark fantasy RPG theme throughout
- Quality-focused with 80%+ test coverage target