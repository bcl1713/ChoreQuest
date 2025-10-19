import { renderHook, waitFor } from "@testing-library/react";
import { useFamilyMembers } from "./useFamilyMembers";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
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

jest.mock("@/lib/realtime-context", () => ({
  useRealtime: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRealtime = useRealtime as jest.MockedFunction<typeof useRealtime>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe("useFamilyMembers", () => {
  const mockProfile = {
    id: "user-1",
    family_id: "family-1",
    role: "HERO" as const,
    name: "Test User",
    email: "test@example.com",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mockFamilyMembers: Tables<"user_profiles">[] = [
    {
      id: "user-1",
      family_id: "family-1",
      role: "HERO",
      name: "Alice",
      email: "alice@example.com",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "user-2",
      family_id: "family-1",
      role: "GUILD_MASTER",
      name: "Bob",
      email: "bob@example.com",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const mockCharacters: Tables<"characters">[] = [
    {
      id: "char-1",
      user_id: "user-1",
      name: "Alice the Brave",
      class: "WARRIOR",
      level: 5,
      xp: 500,
      gold: 100,
      total_quests_completed: 10,
      current_streak: 3,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      active_family_quest_id: null,
    },
    {
      id: "char-2",
      user_id: "user-2",
      name: "Bob the Wise",
      class: "MAGE",
      level: 8,
      xp: 800,
      gold: 200,
      total_quests_completed: 20,
      current_streak: 5,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      active_family_quest_id: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for useAuth
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

    // Default mock implementation for useRealtime
    mockUseRealtime.mockReturnValue({
      onFamilyMemberUpdate: jest.fn(() => jest.fn()),
      onQuestUpdate: jest.fn(() => jest.fn()),
      onRewardUpdate: jest.fn(() => jest.fn()),
      onRedemptionUpdate: jest.fn(() => jest.fn()),
    });
  });

  describe("successful data loading", () => {
    it("should load family members and characters successfully", async () => {
      // Mock Supabase queries
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const { result } = renderHook(() => useFamilyMembers());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.familyMembers).toEqual([]);
      expect(result.current.familyCharacters).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Data should be loaded
      expect(result.current.familyMembers).toEqual(mockFamilyMembers);
      expect(result.current.familyCharacters).toEqual(mockCharacters);
      expect(result.current.error).toBeNull();
    });

    it("should handle family with no characters", async () => {
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.familyMembers).toEqual(mockFamilyMembers);
      expect(result.current.familyCharacters).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should handle family with no members", async () => {
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.familyMembers).toEqual([]);
      expect(result.current.familyCharacters).toEqual([]);
      expect(result.current.error).toBeNull();

      // Characters query should not be called when there are no members
      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
      expect(mockSupabase.from).not.toHaveBeenCalledWith("characters");
    });
  });

  describe("error handling", () => {
    it("should handle error when fetching family members fails", async () => {
      const mockError = new Error("Database error");
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockUserProfilesQuery as any);

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.familyMembers).toEqual([]);
      expect(result.current.familyCharacters).toEqual([]);
      expect(result.current.error).toBe("Failed to fetch family members: Database error");
    });

    it("should handle error when fetching characters fails", async () => {
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Characters fetch error"),
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.familyMembers).toEqual([]);
      expect(result.current.familyCharacters).toEqual([]);
      expect(result.current.error).toBe("Failed to fetch family characters: Characters fetch error");
    });

    it("should handle non-Error exceptions", async () => {
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue("String error"),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockUserProfilesQuery as any);

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to load family members");
    });
  });

  describe("edge cases", () => {
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

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.familyMembers).toEqual([]);
      expect(result.current.familyCharacters).toEqual([]);
      expect(result.current.error).toBeNull();

      // Should not make any Supabase calls
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

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.familyMembers).toEqual([]);
      expect(result.current.familyCharacters).toEqual([]);
      expect(result.current.error).toBeNull();

      // Should not make any Supabase calls
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should handle null data responses from Supabase", async () => {
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockUserProfilesQuery as any);

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.familyMembers).toEqual([]);
      expect(result.current.familyCharacters).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should handle null character data responses", async () => {
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.familyMembers).toEqual(mockFamilyMembers);
      expect(result.current.familyCharacters).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe("reload functionality", () => {
    it("should reload data when reload is called", async () => {
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock call history
      jest.clearAllMocks();

      // Update mock data for reload
      const updatedMembers = [
        ...mockFamilyMembers,
        {
          id: "user-3",
          family_id: "family-1",
          role: "YOUNG_HERO" as const,
          name: "Charlie",
          email: "charlie@example.com",
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
      ];

      mockUserProfilesQuery.eq.mockResolvedValue({
        data: updatedMembers,
        error: null,
      });

      // Call reload
      await result.current.reload();

      await waitFor(() => {
        expect(result.current.familyMembers).toEqual(updatedMembers);
      });

      // Verify Supabase was called again
      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
    });

    it("should handle errors during reload", async () => {
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Make reload fail
      mockUserProfilesQuery.eq.mockResolvedValue({
        data: null,
        error: new Error("Reload failed"),
      });

      // Call reload
      await result.current.reload();

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch family members: Reload failed");
      });
    });
  });

  describe("React lifecycle", () => {
    it("should reload when family_id changes", async () => {
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const { result, rerender } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change family_id
      const newFamilyMembers = [mockFamilyMembers[0]];
      mockUserProfilesQuery.eq.mockResolvedValue({
        data: newFamilyMembers,
        error: null,
      });

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

      // Trigger re-render
      rerender();

      await waitFor(() => {
        expect(result.current.familyMembers).toEqual(newFamilyMembers);
      });
    });
  });

  describe("realtime subscriptions", () => {
    it("should subscribe to family member updates", async () => {
      const mockUnsubscribe = jest.fn();
      const mockOnFamilyMemberUpdate = jest.fn(() => mockUnsubscribe);

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: mockOnFamilyMemberUpdate,
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const { unmount } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(mockOnFamilyMemberUpdate).toHaveBeenCalled();
      });

      // Unmount to trigger cleanup
      unmount();

      // Verify unsubscribe was called
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("should reload data when family member is updated", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnFamilyMemberUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: mockOnFamilyMemberUpdate,
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear call history
      jest.clearAllMocks();

      // Trigger update event
      const updatedMembers = [
        ...mockFamilyMembers,
        {
          id: "user-3",
          family_id: "family-1",
          role: "YOUNG_HERO" as const,
          name: "Charlie",
          email: "charlie@example.com",
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
      ];

      mockUserProfilesQuery.eq.mockResolvedValue({
        data: updatedMembers,
        error: null,
      });

      updateCallback!({
        action: "UPDATE",
        record: { id: "user-1", role: "GUILD_MASTER" },
      });

      // Wait for reload to complete
      await waitFor(() => {
        expect(result.current.familyMembers).toEqual(updatedMembers);
      });

      // Verify Supabase was called again
      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
    });

    it("should reload on INSERT events", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnFamilyMemberUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: mockOnFamilyMemberUpdate,
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(mockOnFamilyMemberUpdate).toHaveBeenCalled();
      });

      jest.clearAllMocks();

      // Trigger INSERT event
      updateCallback!({
        action: "INSERT",
        record: { id: "user-3", name: "New Member" },
      });

      // Verify reload was triggered
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
      });
    });

    it("should reload on DELETE events", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnFamilyMemberUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: mockOnFamilyMemberUpdate,
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(mockOnFamilyMemberUpdate).toHaveBeenCalled();
      });

      jest.clearAllMocks();

      // Trigger DELETE event
      updateCallback!({
        action: "DELETE",
        old_record: { id: "user-1" },
      });

      // Verify reload was triggered
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
      });
    });

    it("should not subscribe when profile has no family_id", async () => {
      const mockOnFamilyMemberUpdate = jest.fn(() => jest.fn());

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: mockOnFamilyMemberUpdate,
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

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

      renderHook(() => useFamilyMembers());

      await waitFor(() => {
        // Should not subscribe when no profile
        expect(mockOnFamilyMemberUpdate).not.toHaveBeenCalled();
      });
    });
  });

  describe("return value structure", () => {
    it("should return all expected properties", async () => {
      const mockUserProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockFamilyMembers,
          error: null,
        }),
      };

      const mockCharactersQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockUserProfilesQuery as any;
        }
        if (table === "characters") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mockCharactersQuery as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const { result } = renderHook(() => useFamilyMembers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify structure
      expect(result.current).toHaveProperty("familyMembers");
      expect(result.current).toHaveProperty("familyCharacters");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("reload");

      // Verify types
      expect(Array.isArray(result.current.familyMembers)).toBe(true);
      expect(Array.isArray(result.current.familyCharacters)).toBe(true);
      expect(typeof result.current.loading).toBe("boolean");
      expect(typeof result.current.reload).toBe("function");
    });
  });
});
