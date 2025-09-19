# ChoreQuest Project Overview

## Purpose
ChoreQuest is a fantasy RPG-themed family chore management system designed to gamify household tasks. The system transforms daily chores into epic quests where family members become heroes earning XP, gold, and rewards through real-world task completion.

## Current Status
- **Phase**: Early implementation phase (Phase 1 MVP partially complete)
- **Authentication System**: ✅ Complete with family creation, user registration, and login
- **Character System**: ✅ Complete with character creation and class selection
- **Database Schema**: ✅ Complete comprehensive schema with all game mechanics
- **Basic UI**: ✅ Authentication pages and character creation pages
- **Quest System**: 🔄 In progress (database schema ready, API endpoints needed)
- **Boss Battles**: ❌ Not implemented yet
- **Reward System**: ❌ Not implemented yet

## Key Features Implemented
1. **User Authentication & Family Management**
   - Family creation with unique join codes
   - User registration and login with JWT tokens
   - Role-based access (GUILD_MASTER, HERO, YOUNG_HERO)

2. **Character System**
   - Character creation with 5 classes (KNIGHT, MAGE, RANGER, ROGUE, HEALER)
   - XP and leveling system (database ready)
   - Gold, gems, and honor points economy

3. **Database Architecture**
   - Complete Prisma schema with all game mechanics
   - SQLite for development
   - Comprehensive relationships between families, users, characters, quests, etc.

## Next Phase Priorities
1. Quest system implementation (templates and instances)
2. Dashboard UI with active quests
3. Quest completion and approval workflow
4. Basic reward store functionality