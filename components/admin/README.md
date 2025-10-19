# Admin Components

This folder contains all administrative components for the ChoreQuest application. These components are exclusively for Guild Masters (family admins) and provide comprehensive family oversight and management capabilities.

## Structure

```
admin/
├── admin-dashboard.tsx       # Main admin interface with tabbed navigation
├── guild-master-manager.tsx  # Guild Master role management
├── statistics-panel.tsx      # Family statistics and analytics
├── activity-feed.tsx         # Recent family activity log
└── index.ts                  # Barrel export
```

## Components

### Admin Dashboard (`admin-dashboard.tsx`)

The central administrative interface with tabbed navigation for all admin features:

**Key Features:**
- Tabbed interface with URL synchronization
- Uses `useTabNavigation` hook for state management
- Integrates all admin sub-components
- Responsive tab navigation with horizontal scrolling on mobile
- Persists selected tab in URL query parameters

**Available Tabs:**
1. **Overview** - Dashboard summary with key metrics
2. **Quests** - Quest management (via QuestDashboard)
3. **Rewards** - Reward and redemption management (via RewardManager)
4. **Family** - Family member management (via FamilyManagement)
5. **Statistics** - Detailed analytics (via StatisticsPanel)
6. **Activity** - Recent activity feed (via ActivityFeed)
7. **Guild Masters** - Guild Master role management (via GuildMasterManager)

**Responsibilities:**
- Orchestrates all admin functionality
- Manages tab state with URL sync
- Provides consistent navigation experience
- Mobile-responsive tab layout

**Performance:**
- Uses `useTabNavigation` hook with memoization
- Lazy loads tab content (only active tab is rendered)
- Optimized tab change handling with `useCallback`

### Guild Master Manager (`guild-master-manager.tsx`)

Interface for managing Guild Master roles within the family:

**Key Features:**
- View all current Guild Masters
- Promote family members to Guild Master status
- Demote Guild Masters to regular members
- Role change confirmations
- Permission validation

**Responsibilities:**
- Displays Guild Master roster
- Handles role promotion/demotion
- Validates permissions before role changes
- Prevents removing the last Guild Master
- Updates user roles in database

**Security:**
- Only existing Guild Masters can access
- Server-side role validation
- Audit trail for role changes

### Statistics Panel (`statistics-panel.tsx`)

Comprehensive family analytics and statistics dashboard:

**Key Features:**
- Family-wide quest completion metrics
- Individual member performance statistics
- XP and gold earning trends
- Quest difficulty distribution
- Completion rate over time
- Top performers leaderboard

**Metrics Displayed:**
- Total quests created vs completed
- Average completion time
- XP and gold distributed
- Most active family members
- Quest completion trends (daily, weekly, monthly)
- Reward redemption statistics

**Responsibilities:**
- Aggregates data from multiple sources
- Calculates meaningful metrics
- Visualizes statistics with charts/graphs
- Provides date range filtering
- Exports statistics reports

**Performance:**
- Uses memoization for expensive calculations
- Caches computed statistics
- Efficient data aggregation

### Activity Feed (`activity-feed.tsx`)

Real-time activity log showing recent family events:

**Key Features:**
- Real-time activity updates via Supabase subscriptions
- Filterable by activity type
- Paginated for performance
- Timestamped entries with relative time display

**Activity Types:**
- Quest created
- Quest started
- Quest completed
- Quest approved
- Reward redeemed
- Redemption approved/rejected
- Member joined family
- Member left family
- Role changes

**Responsibilities:**
- Subscribes to activity updates
- Displays formatted activity entries
- Provides activity filtering
- Shows user-friendly activity descriptions
- Handles pagination for large activity histories

**Performance:**
- Limits initial load to recent activities
- Virtual scrolling for large lists
- Optimistic updates for real-time feel

## Related Hooks

The admin components use custom hooks from `/hooks`:

- **`useTabNavigation`** - Tab state management with URL sync
  - Returns `{ selectedIndex, handleTabChange, tabs }`
  - Syncs tab selection with URL query parameters
  - Preserves existing URL parameters when changing tabs
  - Used in admin-dashboard.tsx

- **`useQuests`** - Quest data for statistics and activity
- **`useRewards`** - Reward data for statistics
- **`useFamilyMembers`** - Family member data for all admin views

## Related Services

Admin components may use services from `/lib`:

- **`supabase.ts`** - Direct Supabase client for admin operations
- **`reward-service.ts`** - Reward and redemption management
- **Statistics aggregation services** (if implemented)

## Related Utilities

Admin components use utilities from `/lib/utils`:

- **`formatting.ts`** - `formatDateTime()`, `formatXP()`, `formatGold()`, `formatPercent()`
- **`data.ts`** - `groupBy()`, `sortByKey()` for statistics calculations
- **`colors.ts`** - `getStatusColor()`, `getDifficultyColor()` for visual indicators

## Usage

```tsx
import { AdminDashboard } from '@/components/admin';

// Admin page (Guild Masters only)
function AdminPage() {
  return <AdminDashboard />;
}
```

### Using Individual Admin Components

```tsx
import { StatisticsPanel, ActivityFeed, GuildMasterManager } from '@/components/admin';

// Custom admin layout
function CustomAdminPage() {
  return (
    <div>
      <StatisticsPanel />
      <ActivityFeed />
      <GuildMasterManager />
    </div>
  );
}
```

## Access Control

All admin components are **Guild Master only**. Access control is implemented at multiple levels:

### Component Level
- Components check user role before rendering
- Redirect to dashboard if not Guild Master
- Show permission denied message

### Route Level
- Admin routes protected by middleware
- Server-side role validation
- Automatic redirect for unauthorized access

### API Level
- All admin operations validate role server-side
- Database RLS (Row Level Security) policies enforce permissions
- Audit logging for sensitive operations

## Permission Hierarchy

```
Guild Master (Admin)
├── Full access to all admin features
├── Can manage family members
├── Can promote/demote Guild Masters
├── Can approve/reject quests and redemptions
├── Can view all statistics
└── Can modify family settings

Parent
├── Limited admin access
├── Can create quests
└── Can view basic statistics

Child (Player)
└── No admin access
```

## Testing

Admin components have unit tests covering:
- Tab navigation and URL synchronization
- Role-based access control
- Statistics calculations
- Activity feed updates
- Guild Master management

Run tests: `npm test -- admin`

## Common Admin Workflows

### Reviewing Quest Completions
1. Navigate to Quests tab
2. Filter by "COMPLETED" status
3. Review quest details and evidence
4. Approve or reject completion
5. Member receives XP/gold upon approval

### Processing Reward Redemptions
1. Navigate to Rewards tab
2. View pending redemptions list
3. Verify member has sufficient gold
4. Approve or reject redemption
5. Mark as completed when reward is fulfilled

### Managing Family Members
1. Navigate to Family tab
2. View all family members and roles
3. Promote/demote members as needed
4. Send invitations to new members
5. Remove inactive members if necessary

### Analyzing Family Performance
1. Navigate to Statistics tab
2. Select date range for analysis
3. Review completion rates and trends
4. Identify top performers
5. Export reports for record keeping

## Architecture Principles

1. **Role-Based Access** - All admin features check Guild Master role
2. **Tabbed Navigation** - Organized interface with URL persistence
3. **Real-Time Updates** - Activity feed and statistics update live
4. **Performance Optimized** - Memoization and efficient data loading
5. **Type Safety** - Full TypeScript coverage with strict types
6. **Audit Trail** - All admin actions are logged
7. **Mobile Responsive** - Tabs scroll horizontally on small screens
8. **Composable** - Admin features can be used independently or together
