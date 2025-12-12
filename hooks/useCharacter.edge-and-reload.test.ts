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

describe("useCharacter - edge and reload", () => {
  it("should handle missing user gracefully", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
    });

    const { result } = renderHook(() => useCharacter());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.character).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("should handle null data responses from Supabase", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useCharacter());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.character).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should handle null user_id during reload gracefully", async () => {
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

    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
    });

    await result.current.reload();

    expect(result.current.character).toBeNull();
  });

  it("should reload data when reload is called", async () => {
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

    jest.clearAllMocks();

    const updatedCharacter = { ...mockCharacter, level: 6 };
    mockQuery.single.mockResolvedValue({
      data: updatedCharacter,
      error: null,
    });

    await result.current.reload();

    await waitFor(() => {
      expect(result.current.character).toEqual(updatedCharacter);
    });
    expect(mockSupabase.from).toHaveBeenCalledWith("characters");
  });

  it("should handle errors during reload", async () => {
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

    mockQuery.single.mockResolvedValue({
      data: null,
      error: new Error("Reload failed"),
    });

    await result.current.reload();

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch character: Reload failed");
    });
  });
});
