# ChoreQuest Development Tasks

## Project Overview

ChoreQuest is a fantasy RPG-themed family chore management system that
transforms household tasks into epic adventures.

## Phase 1: Core Foundation (MVP) - COMPLETED

- [x] Authentication and user management system
- [x] Database schema with Prisma migrations
- [x] Character creation and progression system
- [x] Quest system with templates, instances, and approval workflow
- [x] Reward store with redemption and approval system
- [x] Frontend dashboard with Next.js 15 and React 19
- [x] Testing infrastructure with Jest
- [x] Docker development environment
- [x] Mobile-responsive UI with Tailwind CSS

## ChoreQuest 0.2.0 Release Plan

### Core Features for 0.2.0

#### Multi-Guild Master System - COMPLETED 2025-10-02

#### Quest Template Management System - COMPLETED 2025-10-01

#### Real-time Updates System - COMPLETED 2025-09-27

#### Enhanced Character Creation - COMPLETED 2025-10-02

#### Template Rewards - COMPLETED 2025-10-10

#### Admin Management Interface - COMPLETED 2025-10-03

## Phase 2: Game Enhancement

### Visual & UI Enhancement - COMPLETED 2025-10-10

### Avatar & Customization System

- [ ] Avatar display system
- [ ] Basic avatar customization (hair, clothing, equipment)
- [ ] Equipment display on character avatar
- [ ] Unlockable cosmetics
- [ ] Avatar upload system
- [ ] Class visual differentiation
- [ ] Avatar editor interface

### Class Abilities & Powers

- [ ] Class bonus system with +20% XP bonuses
- [ ] Special abilities implementation
- [ ] Ability cooldown system
- [ ] Class ultimate powers
- [ ] Ability unlock progression
- [ ] Combo system for boss battles
- [ ] Ability usage interface

### Boss Battle System

- [ ] Boss battle creation admin interface
- [ ] Persistent HP system
- [ ] Multi-player damage system
- [ ] Boss battle UI with health bar and participant tracking
- [ ] Victory celebrations
- [ ] Boss battle history
- [ ] Boss categories (mini-boss, major boss, raid boss)
- [ ] Loot system with exclusive rewards

### Achievement System

- [ ] Achievement definition system
- [ ] Progress tracking
- [ ] Achievement notifications
- [ ] Badge display system
- [ ] Achievement categories
- [ ] Hidden achievements
- [ ] Family achievements

## Phase 3: Social Features

### Leaderboard & Competition

- [ ] Individual leaderboard
- [ ] Family unity dashboard
- [ ] Monthly recognition system
- [ ] Streak tracking
- [ ] Class mastery rankings
- [ ] Speed run records
- [ ] Historical progress tracking

### SOS & Help System

- [ ] SOS request creation with push notifications
- [ ] SOS response system
- [ ] Honor point rewards for helping
- [ ] Help request history
- [ ] Emergency quest system
- [ ] Mentorship rewards
- [ ] SOS notification settings

### Family Communication

- [ ] In-app messaging system
- [ ] Quest coordination tools
- [ ] Victory celebrations sharing
- [ ] Family announcements
- [ ] Voice message support
- [ ] Message history
- [ ] Notification settings

### Balance & Fairness Systems

- [ ] Catch-up mechanics
- [ ] Dynamic quest scaling
- [ ] Inspiration bonus system (+50% XP for falling behind)
- [ ] Multiple victory conditions
- [ ] Participation rewards
- [ ] Effort recognition
- [ ] Flexible quest assignment with AI suggestions

### Advanced Analytics

- [ ] Parent analytics dashboard
- [ ] Individual progress reports
- [ ] Family cooperation metrics
- [ ] Engagement trend analysis
- [ ] Optimization suggestions
- [ ] Custom report generation
- [ ] Privacy-first data collection

## Phase 4: Advanced Features

### Smart Home Integration

- [ ] Home Assistant API integration
- [ ] Family stats endpoint
- [ ] Player status API
- [ ] Active quest feed
- [ ] Emergency quest creation
- [ ] Webhook support
- [ ] WebSocket events stream
- [ ] IoT quest completion

### Seasonal Content System

- [ ] Seasonal event framework
- [ ] Halloween event
- [ ] Winter holiday event
- [ ] Spring cleaning event
- [ ] Summer adventure event
- [ ] Event content management
- [ ] Legacy event access
- [ ] Community event sharing

### AI & Automation Features

- [ ] Smart quest recommendations
- [ ] Predictive engagement warnings
- [ ] Optimal timing analysis
- [ ] Difficulty auto-adjustment
- [ ] Natural language processing
- [ ] Automated achievement detection
- [ ] Personalized reward suggestions

### Community Features

- [ ] Neighborhood guilds
- [ ] Inter-family challenges
- [ ] Achievement trading cards
- [ ] Community quest library
- [ ] Family showcases
- [ ] Community events
- [ ] Privacy controls

### Advanced Mobile Features

- [ ] Progressive Web App
- [ ] Offline functionality
- [ ] Camera integration for photo verification
- [ ] Location-based quests
- [ ] Voice commands
- [ ] Biometric authentication
- [ ] Native app store versions

### Performance & Optimization

- [ ] Database query optimization
- [ ] Redis caching strategy
- [ ] Image optimization
- [ ] Bundle splitting
- [ ] Service worker
- [ ] CDN integration
- [ ] Performance monitoring

## Deployment & Infrastructure

### Development Infrastructure - COMPLETED

### Docker Production Deployment - COMPLETED 2025-09-25

## Hotfix 0.2.5 - Enable Real-time Quest Deletion Events - IN PROGRESS 2025-10-17

Quest cancellation UI was not updating in real-time due to missing database configuration:

- [x] #64 - UI does not update in real-time after cancelling a Family Quest
  - [x] Root cause: quest_instances table missing REPLICA IDENTITY FULL setting
  - [x] Created migration 20251017000002_set_quest_instances_replica_identity.sql
  - [x] Added ALTER TABLE quest_instances REPLICA IDENTITY FULL
  - [x] Enables Postgres to include full old row data in DELETE events
  - [x] Allows Supabase Realtime to evaluate RLS policies and filters on DELETE
  - [x] Wrote comprehensive tests for real-time DELETE event handling
  - [x] Verified real-time subscription now receives DELETE events with old_record
  - [x] Quest cards now disappear immediately when GM cancels them

Technical details:
- Without REPLICA IDENTITY FULL, Postgres only sends primary key in DELETE events
- Supabase Realtime couldn't evaluate family_id filter without full old row
- DELETE events were silently dropped, requiring manual page refresh
- Solution matches existing pattern for quest_templates and rewards tables

## Hotfix 0.2.1 - Mobile Responsiveness & UI Polish - COMPLETED 2025-10-16

Critical mobile responsiveness issues and UI consistency improvements:

- [x] #58 - Chrome/Chromium mobile reload hangs on "Loading your realm"
  - [x] Review prior fixes to network/auth/character realtime startup flow
  - [x] Reproduce spinner hang locally in Chromium user agent emulation
  - [x] Trace auth + realtime initialization to locate deadlock/infinite loop
  - [x] Implement targeted fix and verify Chrome/Chromium resume works
  - [x] Ensure no regressions in Firefox/Safari and update automated tests
- [x] #40 - Landing page logo overflow on mobile (shows "ChoreQue")
  - Implemented responsive text sizing: text-4xl sm:text-5xl md:text-6xl
  - Also fixed subtitle text sizing
- [x] #41 - Reward store cards should match admin panel style
  - Updated to use fantasy-card styling with dark theme
  - Added gold-text for pricing consistency
  - Updated button styling to match admin panel gradient buttons
  - Added status badges with consistent dark theme colors
  - Improved visual hierarchy and readability
- [x] #42 - Admin dashboard tabs overlap on small screens
  - Changed from flex-1 min-w-[120px] to flex-shrink-0 for proper scrolling
  - Reduced padding on mobile screens (px-3 sm:px-4)
  - Added scrollbar styling for better UX
- [x] #43 - Claim Quest buttons too large on mobile
  - Changed layout from flex-row to flex-col on mobile (sm:flex-row)
  - Button takes full-width on mobile (w-full sm:w-auto)
  - Added 44px min-height for proper touch targets
  - Added gap-3 for proper spacing between content and button
- [x] #44 - Family quests (GM view) not responsive on mobile
  - Changed layout from flex-row to flex-col on mobile (sm:flex-row)
  - Button container now full-width on mobile (w-full sm:w-auto)
  - Removed restrictive min-w-[200px] on mobile
  - Added 44px min-height for proper touch targets
- [x] Loading spinner stuck on mobile and Chrome desktop refresh
  - Memoized `waitForReady` function with useCallback to prevent infinite re-renders
  - Added network ready wait to AuthContext before all Supabase calls
  - Fixed dependency arrays to include stable memoized functions
  - Prevented race condition where AuthContext made requests before network ready
  - Eliminated infinite re-render loop in RealtimeContext and CharacterContext
