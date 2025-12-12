import { renderHook, waitFor } from "@testing-library/react";
import { useQuests } from "./useQuests";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
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
});

describe("useQuests - return shape", () => {
  it("should return all expected properties", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockQuests, error: null }),
    };

    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.quests)).toBe(true);
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("error");
    expect(typeof result.current.reload).toBe("function");
  });
});
