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

describe("useCharacter - loading and errors", () => {
  it("should load character successfully", async () => {
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

    expect(result.current.loading).toBe(true);
    expect(result.current.character).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.character).toEqual(mockCharacter);
    expect(result.current.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith("characters");
  });

  it("should handle user with no character (PGRST116 error)", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: {
          code: "PGRST116",
          message: "No rows returned",
        },
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

  it("should call Supabase with correct parameters", async () => {
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

    expect(mockQuery.select).toHaveBeenCalledWith("*");
    expect(mockQuery.eq).toHaveBeenCalledWith("user_id", mockUser.id);
    expect(mockQuery.single).toHaveBeenCalled();
    expect(result.current.character).toEqual(mockCharacter);
  });

  it("should handle errors when fetching character", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: new Error("Database error"),
      }),
    };

     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useCharacter());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.character).toBeNull();
    expect(result.current.error).toBe("Failed to fetch character: Database error");
  });

  it("should handle non-Error exceptions", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue("String error"),
    };

     
    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useCharacter());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load character");
  });
});
