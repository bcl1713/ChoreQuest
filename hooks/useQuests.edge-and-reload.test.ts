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

const createQuestQuery = (
  data: QuestInstance[] | null,
  error: Error | null,
) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue({ data, error }),
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

    onBossQuestUpdate: jest.fn(() => jest.fn()),
    onBossParticipantUpdate: jest.fn(() => jest.fn()),
  });
});

describe("useQuests - edge and reload", () => {
  it("should handle missing profile gracefully", async () => {
    mockUseAuth.mockReturnValue({
      profile: null,
      user: null,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
    });

    const { result } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quests).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("should handle missing family_id gracefully", async () => {
    mockUseAuth.mockReturnValue({
      profile: { ...mockProfile, family_id: null },
      user: null,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
    });

    const { result } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quests).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("should handle null data responses from Supabase", async () => {
    const mockQuery = createQuestQuery(null, null);

    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quests).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should reload data when reload is called", async () => {
    const mockQuery = createQuestQuery(mockQuests, null);

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
        title: "New Quest",
        description: "New description",
        status: "PENDING",
        difficulty: "HARD",
        category: "SPECIAL",
        xp_reward: 200,
        gold_reward: 50,
        quest_type: "INDIVIDUAL",
        created_by_id: "user-1",
        assigned_to_id: "user-2",
        created_at: "2024-01-03T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
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

    await result.current.reload();

    await waitFor(() => {
      expect(result.current.quests).toEqual(updatedQuests);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("quest_instances");
  });

  it("should handle errors during reload", async () => {
    const mockQuery = createQuestQuery(mockQuests, null);

    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockQuery.order.mockResolvedValue({
      data: null,
      error: new Error("Reload failed"),
    });

    await result.current.reload();

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Failed to fetch quest instances: Reload failed",
      );
    });
  });
});
