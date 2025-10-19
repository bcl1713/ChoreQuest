# Reward Components

This folder contains all reward-related components for the ChoreQuest application. The components handle reward management (creation, editing, deletion) and redemption processing.

## Structure

```
rewards/
├── reward-manager/         # Reward and redemption management interface (Guild Master)
├── reward-store/          # Player-facing reward redemption store
└── index.ts              # Barrel export
```

## Components

### Reward Manager (`reward-manager/`)

The reward manager is the admin/Guild Master interface for managing rewards and processing redemptions. It's decomposed into focused, single-responsibility components:

- **`index.tsx`** (295 LOC) - Main orchestrator component that:
  - Uses `useRewards` hook for data fetching with realtime updates
  - Manages modal state for reward creation/editing
  - Composes sub-components (RewardList, RewardForm, RedemptionList)
  - Handles all reward CRUD operations
  - Processes redemption approvals and rejections

- **`reward-item.tsx`** (101 LOC) - Individual reward card component
  - Displays a single reward with icon, name, description, cost
  - Shows reward type and availability status
  - Provides edit and delete action buttons
  - Uses `React.memo` for performance optimization

- **`reward-list.tsx`** (47 LOC) - Reward list view component
  - Renders a grid of reward cards
  - Handles empty state when no rewards exist
  - Uses `React.memo` for performance

- **`reward-form.tsx`** (133 LOC) - Reward creation/edit form
  - Fields: name, description, type, cost, availability
  - Reward type selection (privilege, item, experience)
  - Form validation with inline error messages
  - Uses `React.memo` and `useMemo` for performance
  - Constants: `REWARD_TYPE_ICONS`, `REWARD_TYPE_LABELS`

- **`redemption-list.tsx`** (137 LOC) - Redemption history component
  - Displays pending, approved, and completed redemptions
  - Shows redeemer name, reward, status, timestamp
  - Provides approve/reject buttons for pending redemptions
  - Filters redemptions by status with `useMemo`
  - Uses `React.memo` for performance

**Key Features:**
- Realtime reward and redemption updates via Supabase subscriptions
- Optimistic UI updates for rewards (INSERT/UPDATE/DELETE)
- Redemption workflow (pending → approved/rejected → completed)
- Role-based access (Guild Masters only)
- Performance optimized with memoization

### Reward Store (`reward-store/`)

The reward store is the player-facing interface for browsing and redeeming rewards. It's decomposed into focused, single-responsibility components:

- **`index.tsx`** (299 LOC) - Main orchestrator component that:
  - Uses `useRewards` hook for data fetching with realtime updates
  - Uses `useCharacter` hook for gold balance
  - Manages redemption state and success notifications
  - Composes sub-components (RewardCatalog, RewardCard, RedemptionHistory)
  - Handles reward redemption and Guild Master approval actions

- **`reward-catalog.tsx`** (42 LOC) - Grid display of available rewards
  - Renders rewards in responsive grid layout (md:2-col, lg:3-col)
  - Uses render prop pattern for flexible reward rendering
  - Handles empty state when no rewards available
  - Uses `React.memo` for performance optimization

- **`reward-card.tsx`** (119 LOC) - Individual reward display card
  - Displays reward icon, name, description, cost
  - Shows redemption button with gold validation
  - Handles disabled states (insufficient gold, pending, approved)
  - Shows status badges (PENDING, APPROVED)
  - Uses `React.memo` and `useMemo` for performance

- **`redemption-history.tsx`** (148 LOC) - User's redemption history
  - Displays past and pending redemptions (limited to 5 most recent)
  - Shows redemption status (pending, approved, fulfilled, denied)
  - Provides Guild Master actions (approve, deny, fulfill)
  - Uses `React.memo` and `useMemo` for performance

**Key Features:**
- Real-time gold balance and redemption updates
- Validation of redemption eligibility
- Guild Master approval workflow UI
- User-friendly error messages and success notifications
- Visual feedback for available/unavailable rewards
- Performance optimized with memoization

## Related Hooks

The reward components use custom hooks from `/hooks`:

- **`useRewards`** - Fetches rewards and redemptions with realtime updates
  - Returns `{ rewards, redemptions, loading, error, reload }`
  - Subscribes to reward table changes (INSERT/UPDATE/DELETE)
  - Reloads redemptions when any redemption changes occur
  - Uses `Promise.all` for parallel data loading

## Related Services

Reward components use services from `/lib`:

- **`reward-service.ts`** - RewardService class
  - `getRewardsForFamily(familyId)` - Fetches all family rewards
  - `getRedemptionsForFamily(familyId)` - Fetches redemptions with user info
  - `createReward(reward)` - Creates new reward
  - `updateReward(id, updates)` - Updates reward
  - `deleteReward(id)` - Deletes reward
  - `redeemReward(rewardId, userId)` - Creates redemption request
  - `approveRedemption(redemptionId)` - Approves pending redemption
  - `rejectRedemption(redemptionId)` - Rejects pending redemption

## Related Utilities

Reward components use utilities from `/lib/utils`:

- **`formatting.ts`** - `formatGold()`, `formatDateTime()`
- **`validation.ts`** - `validateRewardName()`, `validateRewardDescription()`, `validateRewardCost()`

## Usage

```tsx
import { RewardManager } from '@/components/rewards';
import { RewardStore } from '@/components/rewards/reward-store';

// Guild Master view
function AdminPage() {
  return <RewardManager />;
}

// Player view
function PlayerPage() {
  return <RewardStore />;
}
```

## Reward Types

The application supports three reward types:

1. **Privilege** - Special permissions or privileges (e.g., "Choose movie night")
2. **Item** - Physical or virtual items (e.g., "30 minutes of screen time")
3. **Experience** - Activities or experiences (e.g., "Trip to the park")

Each type has an associated icon and label defined in `reward-form.tsx`.

## Redemption Workflow

1. **Player Initiates** - Player redeems a reward from the store
2. **Request Created** - Redemption request created with status "PENDING"
3. **Guild Master Reviews** - GM sees pending redemption in redemption list
4. **Approval/Rejection** - GM approves or rejects the redemption
5. **Completion** - Approved redemptions can be marked as "COMPLETED" when fulfilled

## Testing

All components have comprehensive unit tests located in `__tests__/` subdirectories:

**Reward Manager:**
- Reward item rendering and actions (22 tests)
- Reward list display and empty states (16 tests)
- Reward form validation and submission (31 tests)
- Redemption list filtering and actions (30 tests)

**Reward Store:**
- Reward catalog grid and empty states (7 tests)
- Reward card rendering, states, and interactions (22 tests)
- Redemption history display and Guild Master actions (21 tests)

Run tests: `npm test -- rewards`

## Architecture Principles

1. **Small Components** - No component exceeds 400 LOC (largest is 295 LOC)
2. **Single Responsibility** - Each component has one clear purpose
3. **Composition** - Complex UIs built from simple, reusable pieces
4. **Performance** - Memoization with `React.memo`, `useMemo`, `useCallback`
5. **Type Safety** - Full TypeScript coverage with strict types
6. **Testability** - Comprehensive unit test coverage
7. **Service Layer** - Business logic in RewardService, not components
