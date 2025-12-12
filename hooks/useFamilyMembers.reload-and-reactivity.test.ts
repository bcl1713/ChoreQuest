import { renderHook, waitFor } from "@testing-library/react";
import { useFamilyMembers } from "./useFamilyMembers";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import type { Tables } from "@/lib/types/database";

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
];

const createUserProfilesQuery = (data: Tables<"user_profiles">[] | null, error: Error | null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ data, error }),
});

const createCharactersQuery = (data: Tables<"characters">[] | null, error: Error | null) => ({
  select: jest.fn().mockReturnThis(),
  in: jest.fn().mockResolvedValue({ data, error }),
});

const mockSupabaseTables = (
  profilesQuery: ReturnType<typeof createUserProfilesQuery>,
  charactersQuery?: ReturnType<typeof createCharactersQuery>,
) => {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "user_profiles") {
       
      return profilesQuery as any;
    }
    if (table === "characters" && charactersQuery) {
       
      return charactersQuery as any;
    }
     
    return {} as any;
  });
};

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

describe("useFamilyMembers - reloads and reactivity", () => {
  it("should reload data when reload is called", async () => {
    const profilesQuery = createUserProfilesQuery(mockFamilyMembers, null);
    const charactersQuery = createCharactersQuery(mockCharacters, null);
    mockSupabaseTables(profilesQuery, charactersQuery);

    const { result } = renderHook(() => useFamilyMembers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    jest.clearAllMocks();

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

    profilesQuery.eq.mockResolvedValue({ data: updatedMembers, error: null });

    await result.current.reload();

    await waitFor(() => {
      expect(result.current.familyMembers).toEqual(updatedMembers);
    });
    expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
  });

  it("should handle errors during reload", async () => {
    const profilesQuery = createUserProfilesQuery(mockFamilyMembers, null);
    const charactersQuery = createCharactersQuery(mockCharacters, null);
    mockSupabaseTables(profilesQuery, charactersQuery);

    const { result } = renderHook(() => useFamilyMembers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    profilesQuery.eq.mockResolvedValue({ data: null, error: new Error("Reload failed") });

    await result.current.reload();

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch family members: Reload failed");
    });
  });

  it("should reload when family_id changes", async () => {
    const profilesQuery = createUserProfilesQuery(mockFamilyMembers, null);
    const charactersQuery = createCharactersQuery(mockCharacters, null);
    mockSupabaseTables(profilesQuery, charactersQuery);

    const { result, rerender } = renderHook(() => useFamilyMembers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newFamilyMembers = [mockFamilyMembers[0]];
    profilesQuery.eq.mockResolvedValue({ data: newFamilyMembers, error: null });

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
      expect(result.current.familyMembers).toEqual(newFamilyMembers);
    });
  });
});
