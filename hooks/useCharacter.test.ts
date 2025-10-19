import { renderHook, waitFor } from "@testing-library/react";
import { useCharacter } from "./useCharacter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Tables } from "@/lib/types/database";

// Mock dependencies
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

describe("useCharacter", () => {
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

    // Default mock implementation for useAuth
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

  describe("successful data loading", () => {
    it("should load character successfully", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCharacter,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useCharacter());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.character).toBeNull();
      expect(result.current.error).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Data should be loaded
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not treat this as an error
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      renderHook(() => useCharacter());

      await waitFor(() => {
        expect(mockQuery.select).toHaveBeenCalledWith("*");
        expect(mockQuery.eq).toHaveBeenCalledWith("user_id", mockUser.id);
        expect(mockQuery.single).toHaveBeenCalled();
      });
    });
  });

  describe("error handling", () => {
    it("should handle database errors", async () => {
      const mockError = {
        code: "SOME_ERROR",
        message: "Database connection failed",
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.character).toBeNull();
      expect(result.current.error).toBe("Failed to fetch character: Database connection failed");
    });

    it("should handle non-Error exceptions", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue("String error"),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.character).toBeNull();
      expect(result.current.error).toBe("Failed to load character");
    });

    it("should clear character data when error occurs", async () => {
      // First load successfully
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCharacter,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.character).toEqual(mockCharacter);
      });

      // Now make reload fail
      mockQuery.single.mockResolvedValue({
        data: null,
        error: {
          code: "ERROR",
          message: "Failed",
        },
      });

      await result.current.reload();

      await waitFor(() => {
        expect(result.current.character).toBeNull();
        expect(result.current.error).toBe("Failed to fetch character: Failed");
      });
    });
  });

  describe("edge cases", () => {
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

      // Should not make any Supabase calls
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should handle user without id", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, id: undefined } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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

    it("should handle null data response from Supabase", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.character).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("should distinguish between no character (PGRST116) and other errors", async () => {
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // PGRST116 should not be treated as an error
      expect(result.current.character).toBeNull();
      expect(result.current.error).toBeNull();

      // Now test a different error code
      mockQuery.single.mockResolvedValue({
        data: null,
        error: {
          code: "PGRST301",
          message: "Permission denied",
        },
      });

      await result.current.reload();

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch character: Permission denied");
      });
    });
  });

  describe("reload functionality", () => {
    it("should reload data when reload is called", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCharacter,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock call history
      jest.clearAllMocks();

      // Update mock data for reload
      const updatedCharacter = { ...mockCharacter, level: 6, xp: 600 };
      mockQuery.single.mockResolvedValue({
        data: updatedCharacter,
        error: null,
      });

      // Call reload
      await result.current.reload();

      await waitFor(() => {
        expect(result.current.character).toEqual(updatedCharacter);
      });

      // Verify Supabase was called again
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Make reload fail
      mockQuery.single.mockResolvedValue({
        data: null,
        error: {
          code: "ERROR",
          message: "Reload failed",
        },
      });

      // Call reload
      await result.current.reload();

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch character: Reload failed");
      });
    });

    it("should set loading state during reload", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCharacter,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Make reload slow
      let resolveReload: (value: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
      mockQuery.single.mockReturnValue(
        new Promise((resolve) => {
          resolveReload = resolve;
        })
      );

      // Call reload (don't await yet)
      const reloadPromise = result.current.reload();

      // Should be loading
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve the reload
      resolveReload!({ data: mockCharacter, error: null });
      await reloadPromise;

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("React lifecycle", () => {
    it("should reload when user.id changes", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCharacter,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result, rerender } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change user
      const newUser = { ...mockUser, id: "user-2" };
      const newCharacter = { ...mockCharacter, id: "char-2", user_id: "user-2", name: "New Hero" };

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

      // Trigger re-render
      rerender();

      await waitFor(() => {
        expect(result.current.character).toEqual(newCharacter);
      });
    });

    it("should clear data when user logs out", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCharacter,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result, rerender } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.character).toEqual(mockCharacter);
      });

      // User logs out
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

      // Trigger re-render
      rerender();

      await waitFor(() => {
        expect(result.current.character).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("return value structure", () => {
    it("should return all expected properties", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCharacter,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify structure
      expect(result.current).toHaveProperty("character");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("reload");

      // Verify types
      expect(typeof result.current.loading).toBe("boolean");
      expect(typeof result.current.reload).toBe("function");
      expect(result.current.character).not.toBeUndefined();
    });

    it("should maintain referential stability for reload function", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCharacter,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result, rerender } = renderHook(() => useCharacter());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstReload = result.current.reload;

      // Trigger re-render
      rerender();

      // reload function should be the same reference
      expect(result.current.reload).toBe(firstReload);
    });
  });
});
