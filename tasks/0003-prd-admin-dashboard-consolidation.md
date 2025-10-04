# PRD: Admin Dashboard Consolidation

## Introduction/Overview

Guild Masters (parents/admins) currently have to navigate between multiple scattered sections across the application to manage their family's ChoreQuest experience. This fragmentation makes it difficult to get a holistic view of family activity, pending approvals, and overall engagement. The Admin Dashboard Consolidation will create a dedicated, centralized interface accessible to Guild Masters that brings together all administrative functions, family statistics, and real-time activity monitoring into a single, organized location.

**Problem:** Guild Masters lack a single place to oversee family activity, manage administrative tasks, and access key statistics, leading to inefficient family management and reduced visibility into engagement.

**Solution:** A consolidated admin dashboard that serves as the command center for Guild Masters, providing comprehensive family oversight and streamlined management tools.

## Goals

1. **Centralize Admin Functions:** Consolidate all Guild Master management features into a single, easy-to-navigate interface
2. **Improve Family Visibility:** Provide real-time insights into family activity, pending tasks, and engagement metrics
3. **Streamline Administrative Tasks:** Reduce the time and clicks required to complete common admin operations
4. **Enhance User Experience:** Create an intuitive, well-organized interface that makes family management feel effortless
5. **Maintain Mobile Accessibility:** Ensure full functionality on mobile devices with responsive design

## User Stories

### Guild Master Management
- **As a Guild Master**, I want to access all admin features from a single dedicated dashboard, so that I don't have to navigate through multiple sections of the app
- **As a Guild Master**, I want to see all pending approvals (quests and rewards) in one place, so that I can quickly review and take action
- **As a Guild Master**, I want to view real-time family activity, so that I can stay engaged with my family's progress and celebrate achievements

### Family Oversight
- **As a Guild Master**, I want to see comprehensive family statistics at a glance, so that I can understand engagement patterns and identify who might need encouragement
- **As a Guild Master**, I want to monitor quest completion rates and reward redemptions, so that I can adjust the difficulty and rewards to keep everyone engaged

### User & Template Management
- **As a Guild Master**, I want to manage quest templates and rewards from the admin dashboard, so that I can easily customize our family's ChoreQuest experience
- **As a Guild Master**, I want to promote or demote other family members to Guild Master status, so that co-parents can share administrative responsibilities

### Mobile Access
- **As a Guild Master on mobile**, I want full access to all admin features in a responsive layout, so that I can manage the family on-the-go

## Functional Requirements

### FR-1: Dashboard Access & Navigation
1.1. The system must provide a dedicated admin dashboard button in the application header/navbar
1.2. The admin dashboard button must be visible only to users with the Guild Master role
1.3. Clicking the admin button must navigate to `/app/admin` route
1.4. Heroes (non-Guild Masters) attempting to access `/app/admin` must be redirected to the main dashboard with an appropriate message

### FR-2: Dashboard Layout & Structure
2.1. The admin dashboard must use a tabbed interface to organize major sections
2.2. The dashboard must include the following tabs:
   - Overview (statistics and activity feed)
   - Quest Templates
   - Rewards
   - Guild Masters
   - Family Settings
2.3. The dashboard must be fully responsive and adapt to mobile, tablet, and desktop viewports
2.4. The active tab must be visually highlighted and persist when navigating away and returning

### FR-3: Overview Tab - Family Statistics Panel
3.1. The statistics panel must display the following metrics:
   - Total quests completed this week/month (with comparison to previous period)
   - Total gold and XP earned by the family
   - Individual character progress with current levels
   - Quest completion rate by family member (percentage)
   - Most active family member (based on quest completions)
   - Count of pending approvals (quests and rewards combined)
   - Reward redemption statistics (total redemptions this week/month)
3.2. Statistics must be presented using cards or visual widgets for easy scanning
3.3. Statistics must update in real-time as family members complete quests, redeem rewards, etc.
3.4. Statistics must be accurate based on data from the Supabase database

### FR-4: Overview Tab - Real-time Activity Monitor
4.1. The activity monitor must display all family events in chronological order (most recent first)
4.2. The activity feed must include the following event types:
   - Quest completions (with character name and quest title)
   - Reward redemptions (with character name and reward name)
   - Character level-ups (with character name and new level)
   - User logins/activity (optional - can be toggled)
   - Pending approvals (highlighted for quick action)
   - Family member online status (real-time presence)
4.3. Each activity entry must display a timestamp (relative time, e.g., "5 minutes ago")
4.4. The activity feed must auto-scroll to show new events as they occur
4.5. The activity feed must support manual refresh
4.6. The activity feed must be limited to the last 50 events to prevent performance issues
4.7. Pending approval events must have quick action buttons (approve/deny) directly in the feed

### FR-5: Quest Templates Tab
5.1. The Quest Templates tab must integrate the existing `QuestTemplateManager` component
5.2. Guild Masters must be able to view, create, edit, activate/deactivate, and delete quest templates
5.3. The interface must match the existing quest template functionality (no regression)
5.4. Real-time updates must work when templates are modified by another Guild Master

### FR-6: Rewards Tab
6.1. The Rewards tab must integrate the existing `RewardManager` component
6.2. Guild Masters must be able to view, create, edit, activate/deactivate, and delete rewards
6.3. Guild Masters must be able to approve, deny, and fulfill reward redemptions
6.4. The interface must match the existing reward management functionality (no regression)
6.5. Real-time updates must work when rewards or redemptions are modified

### FR-7: Guild Masters Tab
7.1. The Guild Masters tab must display a list of all family members with their current roles
7.2. The tab must show each user's display name, character name, and current role (Guild Master or Hero)
7.3. Guild Masters must be able to promote Heroes to Guild Master status via a "Promote" button
7.4. Guild Masters must be able to demote other Guild Masters to Hero status via a "Demote" button
7.5. The system must prevent demotion of the last remaining Guild Master (show warning message)
7.6. Promotion and demotion actions must require confirmation (modal dialog)
7.7. Real-time updates must reflect role changes immediately across all connected clients

### FR-8: Family Settings Tab
8.1. The Family Settings tab must display the current family name
8.2. The tab must display the family invite code for new member invitations
8.3. The tab must provide a "Copy Invite Code" button that copies to clipboard
8.4. The tab must allow Guild Masters to regenerate the invite code if needed
8.5. The tab must display a list of all family members with join dates
8.6. Future: The tab may include additional settings (notification preferences, family theme, etc.)

### FR-9: Player-Facing Views
9.1. Existing player-facing views (quest dashboard, reward store) must remain in their current locations
9.2. Heroes must continue to see quest and reward interfaces as they currently do
9.3. Admin-specific features (template management, redemption approval, role management) must only appear in the admin dashboard
9.4. The quest creation flow must continue to use quest templates seamlessly

### FR-10: Mobile Responsiveness
10.1. All admin dashboard tabs must be fully functional on mobile devices
10.2. Tabbed navigation must adapt to mobile viewports (horizontal scroll tabs or dropdown)
10.3. Statistics cards must stack vertically on mobile
10.4. Activity feed must be scrollable and touch-friendly
10.5. Modals and forms must be mobile-optimized with appropriate sizing
10.6. All buttons and interactive elements must meet minimum touch target sizes (44x44px)

### FR-11: Real-time Updates & Subscriptions
11.1. The admin dashboard must subscribe to relevant Supabase realtime channels
11.2. Statistics must update automatically when underlying data changes
11.3. Activity feed must receive new events in real-time without page refresh
11.4. Tab content must reflect changes made by other Guild Masters in real-time
11.5. Real-time subscriptions must be properly cleaned up when navigating away from the admin dashboard

### FR-12: Performance & Data Loading
12.1. The admin dashboard must load initial data within 2 seconds on standard connections
12.2. Statistics calculations must be optimized to avoid heavy database queries
12.3. Activity feed must use pagination or windowing to limit data fetched
12.4. Tab content must lazy-load to avoid fetching unnecessary data upfront

## Non-Goals (Out of Scope)

1. **User/Character Deletion:** This PRD does not include the ability to delete users or characters (future feature)
2. **Advanced Analytics:** No detailed charts, graphs, or export functionality (future phase)
3. **Audit Logs:** No detailed history of admin actions taken (future feature)
4. **Bulk Operations:** No bulk editing or batch approval features (future enhancement)
5. **Custom Dashboards:** No ability to customize which widgets or stats appear (future personalization)
6. **Third-party Integrations:** No external service integrations (Home Assistant, etc.)
7. **Email Notifications:** No email alerts for admin events (future feature)
8. **Role Permissions Granularity:** No fine-grained permissions (e.g., "can manage quests but not rewards") - Guild Masters have full admin access

## Design Considerations

### UI/UX Requirements
- **Consistent Design Language:** Use existing Tailwind CSS styles, components, and patterns from the current dashboard
- **Tabbed Navigation:** Implement using `@headlessui/react` Tab components for accessibility
- **Card-Based Layout:** Statistics and sections should use card components with shadows and rounded corners
- **Color Coding:**
  - Pending approvals: Yellow/amber highlights
  - Success actions: Green
  - Destructive actions: Red
  - Information: Blue
- **Icons:** Use Lucide React icons consistently throughout the dashboard
- **Loading States:** Show skeleton loaders while data is fetching
- **Empty States:** Provide helpful messages when no data exists (e.g., "No pending approvals")

### Component Reuse
- Integrate existing components:
  - `QuestTemplateManager` for quest templates tab
  - `RewardManager` for rewards tab
  - Existing modal components for confirmations
- Create new components:
  - `AdminDashboard` (main container)
  - `StatisticsPanel` (overview stats)
  - `ActivityFeed` (real-time events)
  - `GuildMasterManager` (role management)
  - `FamilySettings` (family info and settings)

### Accessibility
- All interactive elements must be keyboard navigable
- Tab panels must follow ARIA patterns
- Color must not be the only indicator of state
- All images/icons must have appropriate alt text

## Technical Considerations

### Dependencies
- **Existing Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase
- **Component Library:** @headlessui/react for accessible tabs and modals
- **Icons:** Lucide React
- **Real-time:** Supabase Realtime subscriptions

### API Requirements
- **Family Statistics Endpoint:** May need to create optimized query/service method for statistics aggregation
- **Activity Feed Endpoint:** Create service method to fetch recent family events
- **Role Management Endpoints:** Already exist (`/api/families/[familyId]/users/[userId]/promote` and `demote`)

### Database Considerations
- Statistics should leverage existing tables (`quest_instances`, `reward_redemptions`, `characters`, `users`)
- Activity feed may require querying multiple tables (consider creating a materialized view or aggregation logic)
- Real-time subscriptions already exist for `quest_instances`, `reward_redemptions`, `characters`, `quest_templates`, `rewards`

### State Management
- Use React Context for admin dashboard state (similar to existing `RealtimeProvider`)
- Leverage existing Supabase client hooks for data fetching
- Consider creating `AdminDashboardProvider` to manage shared state across tabs

### Routing
- Create `/app/admin/page.tsx` for admin dashboard route
- Implement role-based access guard (redirect non-Guild Masters)
- Preserve tab state in URL query params (e.g., `/app/admin?tab=rewards`)

### Testing Requirements
- **Unit Tests:** Create tests for new service methods (statistics, activity feed)
- **E2E Tests:** Create Playwright tests covering:
  - Admin dashboard access (Guild Masters can access, Heroes cannot)
  - Tab navigation and content rendering
  - Statistics display and real-time updates
  - Activity feed displaying events
  - Role promotion/demotion workflow
  - Mobile responsive behavior

## Success Metrics

### Quantitative Metrics
1. **Task Efficiency:** Guild Masters complete common admin tasks (approve quest, create template) 30% faster than before consolidation
2. **Reduced Navigation:** Average number of page navigations for admin tasks decreases by 50%
3. **Visibility:** Guild Masters report 80%+ satisfaction with family activity visibility in user testing

### Qualitative Metrics
1. **User Feedback:** Positive feedback from Guild Masters during manual testing and beta usage
2. **Ease of Use:** Junior developers can understand and extend the admin dashboard without extensive documentation
3. **Organization:** Guild Masters report feeling more in control of family management
4. **Mobile Usability:** Guild Masters successfully use admin features on mobile devices during testing

### Technical Metrics
1. **Performance:** Admin dashboard loads in under 2 seconds on standard connections
2. **Test Coverage:** All admin dashboard features covered by unit and E2E tests
3. **Quality Gates:** All builds pass linting, type checking, and automated tests

## Open Questions

1. **Activity Feed Retention:** Should we store activity feed events permanently or only keep recent events in memory?
2. **Statistics Caching:** Should we cache expensive statistics calculations (e.g., Redis) or compute on-demand?
3. **Notification Preferences:** Should Guild Masters be able to configure which events appear in the activity feed?
4. **Family Settings Scope:** What additional family settings should be included in the initial release vs. future enhancements?
5. **Role Management Audit:** Should we track who promoted/demoted whom and when (audit trail)?
6. **Activity Feed Filtering:** Should Guild Masters be able to filter the activity feed by event type or family member?

---

**Document Version:** 1.0
**Created:** 2025-10-02
**Status:** Ready for Implementation
**Target Release:** ChoreQuest v0.2.0
