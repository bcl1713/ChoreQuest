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
  {
    id: "quest-2",
    family_id: "family-1",
    title: "Test Quest 2",
    description: "Description 2",
    status: "IN_PROGRESS",
    difficulty: "MEDIUM",
    category: "WEEKLY",
    xp_reward: 100,
    gold_reward: 25,
    quest_type: "FAMILY",
    created_by_id: "user-1",
    assigned_to_id: null,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    due_date: null,
    completed_at: null,
    recurrence_pattern: null,
    parent_template_id: null,
    volunteer_bonus: 0.2,
    streak_bonus: null,
    streak_count: null,
  },
];

const createQuestQuery = (data: QuestInstance[] | null, error: Error | null) => ({
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
  });
});

describe("useQuests - loading and errors", () => {
  it("should load quests successfully", async () => {
    const mockQuery = createQuestQuery(mockQuests, null);
     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useQuests());

    expect(result.current.loading).toBe(true);
    expect(result.current.quests).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quests).toEqual(mockQuests);
    expect(mockQuery.select).toHaveBeenCalledWith("*");
    expect(mockQuery.eq).toHaveBeenCalledWith("family_id", "family-1");
    expect(mockQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("should handle empty quest list", async () => {
    const mockQuery = createQuestQuery([], null);
     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quests).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should handle errors when fetching quests", async () => {
    const mockQuery = createQuestQuery(null, new Error("Database error"));
     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch quests: Database error");
    expect(result.current.quests).toEqual([]);
  });

  it("should handle non-Error exceptions", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockRejectedValue("String error"),
    };

     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load quests");
  });
});
