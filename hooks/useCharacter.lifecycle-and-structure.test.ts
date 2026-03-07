import { renderHook, waitFor } from "@testing-library/react";
import { useCharacter } from "./useCharacter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Tables } from "@/lib/types/database";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
};

const mockCharacter: Tables<"characters"> = {
  id: "char-1",
  user_id: "user-1",
  name: "Test Hero",
  class: "WARRIOR",
  level: 5,
  xp: 500,
  gold: 100,
  total_quests_completed: 10,
  current_streak: 3,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  active_family_quest_id: null,
};

beforeEach(() => {
  jest.clearAllMocks();

  mockUseAuth.mockReturnValue({
    user: mockUser,
    profile: null,
    session: null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    signInWithGoogle: jest.fn(),
  });
});

describe("useCharacter - lifecycle and structure", () => {
  it("should reload when user changes", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockCharacter,
        error: null,
      }),
    };

     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result, rerender } = renderHook(() => useCharacter());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newUser = { ...mockUser, id: "user-2" };
    const newCharacter = { ...mockCharacter, user_id: "user-2", id: "char-2" };

    mockUseAuth.mockReturnValue({
      user: newUser,
      profile: null,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
    });

    mockQuery.single.mockResolvedValue({
      data: newCharacter,
      error: null,
    });

    rerender();

    await waitFor(() => {
      expect(result.current.character).toEqual(newCharacter);
    });
  });

  it("should return all expected properties", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockCharacter,
        error: null,
      }),
    };

     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useCharacter());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toHaveProperty("character");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("error");
    expect(typeof result.current.reload).toBe("function");
  });
});
