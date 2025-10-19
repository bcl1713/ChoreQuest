# Family Components

This folder contains all family-related components for the ChoreQuest application. These components handle family management, settings, and family quest claiming functionality.

## Structure

```
family/
├── family-management.tsx      # Family member management and invitations
├── family-settings.tsx        # Family configuration and settings
├── family-quest-claiming.tsx  # Family quest claiming interface
└── index.ts                   # Barrel export
```

## Components

### Family Management (`family-management.tsx`)

Primary interface for managing family members and invitations:

**Key Features:**
- Display all family members with their roles
- Show pending family invitations
- Create and send family invitations
- Manage family member roles and permissions
- Remove family members (Guild Master only)
- Accept/decline family invitations

**Responsibilities:**
- Uses `useFamilyMembers` hook for realtime family member data
- Handles invitation creation and management
- Manages role-based permissions
- Displays family hierarchy (Guild Master, Parents, Children)

**User Roles:**
- **Guild Master** - Full family management privileges
- **Parent** - Can invite new members and manage children
- **Child** - Limited permissions, view-only for most features

### Family Settings (`family-settings.tsx`)

Configuration interface for family-wide settings:

**Key Features:**
- Edit family name
- Configure family preferences
- Set default quest rewards
- Manage family-wide notification settings
- Configure XP and gold earning rates

**Responsibilities:**
- Loads and updates family configuration
- Validates family settings before saving
- Provides user-friendly setting descriptions
- Guild Master only access

### Family Quest Claiming (`family-quest-claiming.tsx`)

Interface for claiming family quests (quests not assigned to specific members):

**Key Features:**
- Display available family quests (unassigned or assigned to "ALL")
- Allow family members to claim quests for themselves
- Show claimed status and who claimed each quest
- Filter quests by availability

**Responsibilities:**
- Lists family quests with "AVAILABLE" status
- Handles quest claiming action
- Updates quest assignment to current user
- Shows real-time claim status updates
- Prevents duplicate claims

**Quest Claiming Flow:**
1. Family quest created with status "AVAILABLE"
2. Any family member can view available quests
3. Member clicks "Claim Quest"
4. Quest is assigned to that member
5. Quest status changes to "CLAIMED"
6. Member can now start and complete the quest

## Related Hooks

The family components use custom hooks from `/hooks`:

- **`useFamilyMembers`** - Fetches family members and characters with realtime updates
  - Returns `{ familyMembers, familyCharacters, loading, error, reload }`
  - Subscribes to family member table changes (INSERT/UPDATE/DELETE)
  - Automatically reloads when family member data changes
  - Used across all family components for consistency

## Related Services

Family components may use services from `/lib`:

- **`supabase.ts`** - Direct Supabase client for family operations
  - Family invitation management
  - Family settings updates
  - Quest claiming operations

## Related Utilities

Family components use utilities from `/lib/utils`:

- **`formatting.ts`** - `formatDateTime()` for displaying invitation timestamps
- **`validation.ts`** - Email validation for invitations

## Usage

```tsx
import { FamilyManagement, FamilySettings, FamilyQuestClaiming } from '@/components/family';

// Family management page
function FamilyPage() {
  return (
    <div>
      <FamilyManagement />
      <FamilySettings />
    </div>
  );
}

// Family quests page
function FamilyQuestsPage() {
  return <FamilyQuestClaiming />;
}
```

## Family Member Roles

The ChoreQuest family system uses a role-based hierarchy:

### Guild Master (Admin)
- Creates and manages the family
- Full permissions for all family operations
- Can invite/remove members
- Manages family settings
- Approves quest completions
- Processes reward redemptions

### Parent
- Can invite new family members
- Can create quests for children
- Can view family statistics
- Limited admin privileges

### Child (Player)
- Can complete quests
- Can claim family quests
- Can redeem rewards
- View-only access to family settings

## Testing

Family components have unit tests:
- Family quest claiming functionality (in `family-quest-claiming.test.tsx`)
- Tests cover claiming flow, permissions, and edge cases

Run tests: `npm test -- family`

## Security Considerations

1. **Role Validation** - All family operations verify user roles server-side
2. **Family Isolation** - Users can only access data from their own family
3. **Invitation Security** - Invitations use secure tokens and expiration
4. **Permission Checks** - Components check permissions before showing actions

## Common Workflows

### Creating a Family
1. User signs up and creates a character
2. User creates a new family (becomes Guild Master)
3. Family is created with a unique family_id
4. User can invite other members

### Joining a Family
1. Existing family member sends invitation
2. New user receives invitation link/code
3. New user accepts invitation
4. User is added to family with appropriate role
5. User can now see family quests and participate

### Claiming Family Quests
1. Guild Master creates quest assigned to "ALL" or no one
2. Quest appears in Family Quest Claiming interface
3. Any family member clicks "Claim"
4. Quest is assigned to that member
5. Member completes quest as normal

## Architecture Principles

1. **Role-Based Access** - All operations respect user roles
2. **Realtime Updates** - Family data updates live via Supabase subscriptions
3. **Data Consistency** - `useFamilyMembers` hook ensures consistent state
4. **Type Safety** - Full TypeScript coverage with strict types
5. **User Experience** - Clear feedback for all family operations
6. **Security First** - Server-side validation for all critical operations
