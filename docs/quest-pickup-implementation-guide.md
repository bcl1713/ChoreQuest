# Quest Pickup & Management System Implementation Guide

## 📚 Learning Objectives

By following this guide, you will learn:

- **Test-Driven Development (TDD)** - Making failing tests pass through minimal implementation
- **Component-based UI Architecture** - Adding role-based interaction elements
- **API Design** - Creating RESTful endpoints for quest operations
- **State Management** - Handling UI updates after server operations
- **Role-based Access Control** - Implementing user permission systems
- **Error Handling** - Graceful handling of failed operations

## 🧪 TDD Principles to Follow

### **Red-Green-Refactor Cycle**

1. **RED**: Run tests - they should fail with clear error messages
2. **GREEN**: Write minimal code to make tests pass
3. **REFACTOR**: Improve code quality while keeping tests green

### **Test-First Mentality**

- Never write production code without a failing test first
- Each test should specify ONE specific behavior
- Make the smallest change possible to make tests pass

## 📋 Implementation Checklist

### **Phase 1: Frontend UI Components (Component Architecture)**

#### **1.1 Add Pick Up Quest Button for Heroes**

**Test File**: `tests/unit/quest-interaction-buttons.test.tsx` (Hero test)

**Key Concepts**: Conditional rendering, user role checking, button event handling

**Implementation Steps**:

```typescript
// In components/quest-dashboard.tsx, Available Quests section
// Around line 286-316 in the quest card mapping

{unassignedQuests.map((quest) => (
  <motion.div key={quest.id} ...>
    <div className="flex justify-between items-start">
      <div>{/* existing quest info */}</div>

      {/* NEW: Add action buttons section */}
      <div className="flex gap-2">
        {/* Hero pickup button */}
        {user?.role !== 'GUILD_MASTER' && (
          <button
            onClick={() => handlePickupQuest(quest.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Pick Up Quest
          </button>
        )}
      </div>
    </div>
  </motion.div>
))}
```

**Learning Focus**:

- Conditional rendering based on user role
- Event handler function structure
- CSS styling consistency with existing buttons

#### **1.2 Add Guild Master Management Controls**

**Test File**: `tests/unit/quest-interaction-buttons.test.tsx` (GM tests)

**Key Concepts**: Dropdown components, multiple action buttons, form state management

**Implementation Steps**:

```typescript
    await expect(page.locator('.modal')).toBeVisible();
// Add state for assignment dropdowns
const [selectedAssignee, setSelectedAssignee] = useState<{[questId: string]: string}>({});

// In the action buttons section:
{user?.role === 'GUILD_MASTER' && (
  <>
    {/* GM can also pick up quests */}
    <button onClick={() => handlePickupQuest(quest.id)}>
      Pick Up Quest
    </button>

    {/* Assignment dropdown */}
    <select
      data-testid="assign-quest-dropdown"
      value={selectedAssignee[quest.id] || ''}
      onChange={(e) => setSelectedAssignee({
        ...selectedAssignee,
        [quest.id]: e.target.value
      })}
    >
      <option value="">Assign to...</option>
      {familyMembers.map(member => (
        <option key={member.id} value={member.id}>
          {member.characterName || member.userName}
        </option>
      ))}
    </select>

    <button
      onClick={() => handleAssignQuest(quest.id, selectedAssignee[quest.id])}
      disabled={!selectedAssignee[quest.id]}
    >
      Assign
    </button>

    {/* Cancel quest button */}
    <button
      onClick={() => handleCancelQuest(quest.id)}
      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
    >
      Cancel Quest
    </button>
  </>
)}
```

**Learning Focus**:

- Complex conditional rendering
- Form state management for dropdowns
- Multiple button interactions in same component

#### **1.3 Add Family Members Data Fetching**

**Key Concepts**: Data fetching, loading states, error handling

**Implementation Steps**:

```typescript
// Add family members state
const [familyMembers, setFamilyMembers] = useState<User[]>([]);

// Add to useEffect for data loading
useEffect(() => {
  if (user && token) {
    loadQuests();
    loadFamilyMembers(); // New function
  }
}, [user, token]);

const loadFamilyMembers = async () => {
  try {
    const members = await userService.getFamilyMembers();
    setFamilyMembers(members);
  } catch (err) {
    console.error("Failed to load family members:", err);
  }
};
```

### **Phase 2: Event Handler Functions (Business Logic)**

#### **2.1 Implement Quest Pickup Handler**

**Test File**: Unit tests checking `handlePickupQuest` calls

**Key Concepts**: Async operations, optimistic updates, error handling

```typescript
const handlePickupQuest = async (questId: string) => {
  if (!user) return;

  try {
    // Call API to assign quest to current user
    await questService.assignQuest(questId, user.id);

    // Refresh quest list to show updated assignments
    await loadQuests();
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to pick up quest";
    setError(errorMsg);
    onError?.(errorMsg);
  }
};
```

#### **2.2 Implement Quest Assignment Handler**

**Key Concepts**: Form validation, user feedback, state updates

```typescript
const handleAssignQuest = async (questId: string, assigneeId: string) => {
  if (!assigneeId) return;

  try {
    await questService.assignQuest(questId, assigneeId);

    // Clear the dropdown selection
    setSelectedAssignee((prev) => ({
      ...prev,
      [questId]: "",
    }));

    await loadQuests();
  } catch (err) {
    // Handle error
  }
};
```

#### **2.3 Implement Quest Cancellation Handler**

**Key Concepts**: Confirmation dialogs, destructive operations, user experience

```typescript
const handleCancelQuest = async (questId: string) => {
  // Add confirmation dialog
  const confirmed = window.confirm(
    "Are you sure you want to cancel this quest?",
  );
  if (!confirmed) return;

  try {
    await questService.cancelQuest(questId);
    await loadQuests();
  } catch (err) {
    // Handle error
  }
};
```

### **Phase 3: Backend API Implementation (Server-Side Logic)**

#### **3.1 Implement Quest Assignment API Endpoint**

**Test File**: E2E tests verifying full user flows

**Key Concepts**: RESTful API design, database transactions, validation

**File**: `app/api/quest-instances/[id]/assign/route.ts`

```typescript
// PATCH /api/quest-instances/[id]/assign
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // 1. Validate authentication
    const { user } = await validateAuth(request);

    // 2. Parse request body
    const { assigneeId } = await request.json();

    // 3. Validate assignee is in same family
    const assignee = await validateFamilyMember(assigneeId, user.familyId);

    // 4. Update quest assignment
    const updatedQuest = await prisma.questInstance.update({
      where: { id: params.id },
      data: {
        assignedToId: assigneeId,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({ success: true, quest: updatedQuest });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to assign quest" },
      { status: 500 },
    );
  }
}
```

**Learning Focus**:

- API route structure in Next.js App Router
- Database operations with Prisma
- Input validation and security checks
- Error handling and HTTP status codes

#### **3.2 Implement Quest Cancellation API Endpoint**

**File**: `app/api/quest-instances/[id]/cancel/route.ts`

**Key Concepts**: Soft vs hard deletes, audit trails, permissions

```typescript
// DELETE /api/quest-instances/[id]/cancel
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user } = await validateAuth(request);

    // Only Guild Masters can cancel quests
    if (user.role !== "GUILD_MASTER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Delete the quest (or mark as cancelled)
    await prisma.questInstance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to cancel quest" },
      { status: 500 },
    );
  }
}
```

#### **3.3 Add Family Members API Endpoint**

**File**: `app/api/users/family-members/route.ts`

**Key Concepts**: Data filtering, relationships, privacy

```typescript
// GET /api/users/family-members
export async function GET(request: Request) {
  try {
    const { user } = await validateAuth(request);

    const familyMembers = await prisma.user.findMany({
      where: {
        familyId: user.familyId,
        id: { not: user.id }, // Exclude current user
      },
      select: {
        id: true,
        userName: true,
        role: true,
        character: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ members: familyMembers });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load family members" },
      { status: 500 },
    );
  }
}
```

### **Phase 4: Service Layer Implementation (Client-Server Interface)**

#### **4.1 Add Quest Service Methods**

**File**: `lib/quest-service.ts`

**Key Concepts**: Service layer pattern, error handling, TypeScript interfaces

```typescript
class QuestService {
  // Existing methods...

  async assignQuest(
    questId: string,
    assigneeId: string,
  ): Promise<{ success: boolean }> {
    const response = await fetch(`/api/quest-instances/${questId}/assign`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ assigneeId }),
    });

    if (!response.ok) {
      throw new Error("Failed to assign quest");
    }

    return await response.json();
  }

  async cancelQuest(questId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/quest-instances/${questId}/cancel`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to cancel quest");
    }

    return await response.json();
  }
}
```

#### **4.2 Add User Service Methods**

**File**: `lib/user-service.ts` (create if doesn't exist)

```typescript
class UserService {
  async getFamilyMembers(): Promise<User[]> {
    const response = await fetch("/api/users/family-members", {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load family members");
    }

    const data = await response.json();
    return data.members;
  }
}

export const userService = new UserService();
```

### **Phase 5: Testing & Quality Assurance**

#### **5.1 Run Tests Frequently**

```bash
# Run unit tests during development
npm test -- tests/unit/quest-interaction-buttons.test.tsx --watch

# Run E2E tests after major changes
npx playwright test tests/e2e/quest-interaction-buttons.spec.ts
```

#### **5.2 Test Each Phase Incrementally**

1. **After Phase 1**: UI buttons should appear (some tests may still fail on API calls)
2. **After Phase 2**: Click handlers should trigger (may fail on missing API endpoints)
3. **After Phase 3**: API endpoints should work independently
4. **After Phase 4**: Full integration should pass all tests

#### **5.3 Quality Gates**

```bash
# Before committing any phase:
npm run build        # Verify compilation
npm run lint         # Fix any linting issues
npm run test         # Unit tests should pass
npx playwright test  # E2E tests should pass
```

## 🎯 Key Learning Outcomes

### **TDD Mastery**

- **Red Phase**: Understanding what failing tests teach us
- **Green Phase**: Implementing minimal solutions that work
- **Refactor Phase**: Improving code quality without breaking functionality

### **Full-Stack Development**

- **Frontend**: Component composition, state management, user interaction
- **Backend**: RESTful API design, database operations, authentication
- **Integration**: Service layers, error handling, data flow

### **Software Architecture**

- **Separation of Concerns**: UI, business logic, data access
- **Role-Based Access**: Implementing permission systems
- **Error Handling**: Graceful failure and user feedback

### **Professional Development Practices**

- **Quality Gates**: Ensuring code standards before commits
- **Incremental Development**: Building features step by step
- **Documentation**: Clear implementation guidance

## 🚀 Success Criteria

### **Functional Requirements**

- ✅ Heroes can pick up available quests
- ✅ Guild Masters can assign quests to family members
- ✅ Guild Masters can cancel unassigned quests
- ✅ Quests update in real-time after actions
- ✅ Proper error handling for failed operations

### **Technical Requirements**

- ✅ All unit tests pass
- ✅ All E2E tests pass
- ✅ Zero linting warnings
- ✅ Clean build compilation
- ✅ Role-based permissions enforced

### **User Experience**

- ✅ Intuitive button placement and styling
- ✅ Clear feedback for user actions
- ✅ Responsive design on mobile devices
- ✅ Consistent with existing UI patterns

## 📝 Implementation Notes

### **Common Pitfalls to Avoid**

1. **Skipping Tests**: Don't implement without failing tests first
2. **Over-engineering**: Implement minimal solution to pass tests
3. **Ignoring Errors**: Always handle API failures gracefully
4. **Security Gaps**: Validate permissions on both client and server
5. **UI Inconsistency**: Match existing component patterns and styling

### **Debugging Tips**

- Use browser dev tools to inspect component props and state
- Check network tab for API call failures
- Use console.log strategically, then remove
- Test with different user roles to verify permissions

### **Performance Considerations**

- Minimize API calls (batch operations when possible)
- Use loading states for better user experience
- Implement optimistic updates where appropriate
- Cache family member data to avoid repeated fetching

---

**Remember**: The goal is not just to make tests pass, but to understand the architectural patterns and development practices that make maintainable, scalable applications. Take time to understand each concept before moving to the next phase.
