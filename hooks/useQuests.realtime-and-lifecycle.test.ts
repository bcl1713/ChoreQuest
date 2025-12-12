import { renderHook, waitFor } from "@testing-library/react";
import { useQuests } from "./useQuests";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import type { QuestInstance } from "@/lib/types/database";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/realtime-context", () => ({
  useRealtime: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRealtime = useRealtime as jest.MockedFunction<typeof useRealtime>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const mockProfile = {
  id: "user-1",
  family_id: "family-1",
  role: "HERO" as const,
  name: "Test User",
  email: "test@example.com",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockQuests: QuestInstance[] = [
  {
    id: "quest-1",
    family_id: "family-1",
    title: "Test Quest 1",
    description: "Description 1",
    status: "PENDING",
    difficulty: "EASY",
    category: "DAILY",
    xp_reward: 50,
    gold_reward: 10,
    quest_type: "INDIVIDUAL",
    created_by_id: "user-1",
    assigned_to_id: "user-2",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    due_date: null,
    completed_at: null,
    recurrence_pattern: null,
    parent_template_id: null,
    volunteer_bonus: null,
    streak_bonus: null,
    streak_count: null,
  },
];

const createQuestQuery = (data: QuestInstance[] | null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue({ data, error: null }),
});

beforeEach(() => {
  jest.clearAllMocks();

  mockUseAuth.mockReturnValue({
    profile: mockProfile,
    user: null,
    session: null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    signInWithGoogle: jest.fn(),
  });

  mockUseRealtime.mockReturnValue({
    onFamilyMemberUpdate: jest.fn(() => jest.fn()),
    onQuestUpdate: jest.fn(() => jest.fn()),
    onRewardUpdate: jest.fn(() => jest.fn()),
    onRedemptionUpdate: jest.fn(() => jest.fn()),
  });
});

describe("useQuests - lifecycle and realtime", () => {
  it("should reload when family_id changes", async () => {
    const mockQuery = createQuestQuery(mockQuests);
     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result, rerender } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedQuests = [{ ...mockQuests[0], id: "quest-2" }];
    mockQuery.order.mockResolvedValue({ data: updatedQuests, error: null });

    mockUseAuth.mockReturnValue({
      profile: { ...mockProfile, family_id: "family-2" },
      user: null,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
    });

    rerender();

    await waitFor(() => {
      expect(result.current.quests).toEqual(updatedQuests);
    });
  });

  it("should subscribe to quest updates", async () => {
    const mockUnsubscribe = jest.fn();
    const mockOnQuestUpdate = jest.fn(() => mockUnsubscribe);

    mockUseRealtime.mockReturnValue({
      onFamilyMemberUpdate: jest.fn(() => jest.fn()),
      onQuestUpdate: mockOnQuestUpdate,
      onRewardUpdate: jest.fn(() => jest.fn()),
      onRedemptionUpdate: jest.fn(() => jest.fn()),
    });

    const mockQuery = createQuestQuery(mockQuests);
     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { unmount } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(mockOnQuestUpdate).toHaveBeenCalled();
    });

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("should reload quests on quest updates", async () => {
    let updateCallback: (event: any) => void;  
    const mockOnQuestUpdate = jest.fn((callback) => {
      updateCallback = callback;
      return jest.fn();
    });

    mockUseRealtime.mockReturnValue({
      onFamilyMemberUpdate: jest.fn(() => jest.fn()),
      onQuestUpdate: mockOnQuestUpdate,
      onRewardUpdate: jest.fn(() => jest.fn()),
      onRedemptionUpdate: jest.fn(() => jest.fn()),
    });

    const mockQuery = createQuestQuery(mockQuests);
     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    jest.clearAllMocks();

    const updatedQuests = [
      ...mockQuests,
      {
        id: "quest-3",
        family_id: "family-1",
        title: "Realtime Quest",
        description: "Realtime description",
        status: "PENDING",
        difficulty: "MEDIUM",
        category: "DAILY",
        xp_reward: 75,
        gold_reward: 15,
        quest_type: "INDIVIDUAL",
        created_by_id: "user-1",
        assigned_to_id: "user-2",
        created_at: "2024-01-04T00:00:00Z",
        updated_at: "2024-01-04T00:00:00Z",
        due_date: null,
        completed_at: null,
        recurrence_pattern: null,
        parent_template_id: null,
        volunteer_bonus: null,
        streak_bonus: null,
        streak_count: null,
      },
    ];

    mockQuery.order.mockResolvedValue({
      data: updatedQuests,
      error: null,
    });

    updateCallback!({
      action: "UPDATE",
      record: { id: "quest-1", status: "IN_PROGRESS" },
    });

    await waitFor(() => {
      expect(result.current.quests).toEqual(updatedQuests);
    });
    expect(mockSupabase.from).toHaveBeenCalledWith("quest_instances");
  });
});
