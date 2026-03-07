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

const defaultRealtimeMock = () => ({
  onFamilyMemberUpdate: jest.fn(() => jest.fn()),
  onQuestUpdate: jest.fn(() => jest.fn()),
  onRewardUpdate: jest.fn(() => jest.fn()),
  onRedemptionUpdate: jest.fn(() => jest.fn()),
  onBossQuestUpdate: jest.fn(() => jest.fn()),
  onBossParticipantUpdate: jest.fn(() => jest.fn()),
});
const mockRealtimeWith = (overrides = {}) => {
  mockUseRealtime.mockReturnValue({ ...defaultRealtimeMock(), ...overrides });
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

const createUserProfilesQuery = (data: Tables<"user_profiles">[]) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ data, error: null }),
});

const createCharactersQuery = (data: Tables<"characters">[] | null) => ({
  select: jest.fn().mockReturnThis(),
  in: jest.fn().mockResolvedValue({ data, error: null }),
});

const mockSupabaseTables = (
  profilesQuery: ReturnType<typeof createUserProfilesQuery>,
  charactersQuery: ReturnType<typeof createCharactersQuery>,
) => {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "user_profiles") {
      return profilesQuery as any;
    }
    if (table === "characters") {
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
  mockRealtimeWith();
});

describe("useFamilyMembers - realtime and shape", () => {
  it("should subscribe to family member updates", async () => {
    const mockUnsubscribe = jest.fn();
    const mockOnFamilyMemberUpdate = jest.fn(() => mockUnsubscribe);

    mockRealtimeWith({ onFamilyMemberUpdate: mockOnFamilyMemberUpdate });

    const profilesQuery = createUserProfilesQuery(mockFamilyMembers);
    const charactersQuery = createCharactersQuery(mockCharacters);
    mockSupabaseTables(profilesQuery, charactersQuery);

    const { unmount } = renderHook(() => useFamilyMembers());

    await waitFor(() => {
      expect(mockOnFamilyMemberUpdate).toHaveBeenCalled();
    });

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("should reload data when family member is updated", async () => {
    let updateCallback: (event: any) => void;
    const mockOnFamilyMemberUpdate = jest.fn((callback) => {
      updateCallback = callback;
      return jest.fn();
    });

    mockRealtimeWith({ onFamilyMemberUpdate: mockOnFamilyMemberUpdate });

    const profilesQuery = createUserProfilesQuery(mockFamilyMembers);
    const charactersQuery = createCharactersQuery(mockCharacters);
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

    updateCallback!({
      action: "UPDATE",
      record: { id: "user-1", role: "GUILD_MASTER" },
    });

    await waitFor(() => {
      expect(result.current.familyMembers).toEqual(updatedMembers);
    });
    expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
  });

  it("should reload on INSERT events", async () => {
    let updateCallback: (event: any) => void;
    const mockOnFamilyMemberUpdate = jest.fn((callback) => {
      updateCallback = callback;
      return jest.fn();
    });

    mockRealtimeWith({ onFamilyMemberUpdate: mockOnFamilyMemberUpdate });

    const profilesQuery = createUserProfilesQuery(mockFamilyMembers);
    const charactersQuery = createCharactersQuery(mockCharacters);
    mockSupabaseTables(profilesQuery, charactersQuery);

    renderHook(() => useFamilyMembers());

    await waitFor(() => {
      expect(mockOnFamilyMemberUpdate).toHaveBeenCalled();
    });

    jest.clearAllMocks();

    updateCallback!({
      action: "INSERT",
      record: { id: "user-3", name: "New Member" },
    });

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
    });
  });

  it("should reload on DELETE events", async () => {
    let updateCallback: (event: any) => void;
    const mockOnFamilyMemberUpdate = jest.fn((callback) => {
      updateCallback = callback;
      return jest.fn();
    });

    mockRealtimeWith({ onFamilyMemberUpdate: mockOnFamilyMemberUpdate });

    const profilesQuery = createUserProfilesQuery(mockFamilyMembers);
    const charactersQuery = createCharactersQuery(mockCharacters);
    mockSupabaseTables(profilesQuery, charactersQuery);

    renderHook(() => useFamilyMembers());

    await waitFor(() => {
      expect(mockOnFamilyMemberUpdate).toHaveBeenCalled();
    });

    jest.clearAllMocks();

    updateCallback!({
      action: "DELETE",
      old_record: { id: "user-1" },
    });

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
    });
  });

  it("should not subscribe when profile has no family_id", async () => {
    const mockOnFamilyMemberUpdate = jest.fn(() => jest.fn());

    mockRealtimeWith({ onFamilyMemberUpdate: mockOnFamilyMemberUpdate });

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
      expect(mockOnFamilyMemberUpdate).not.toHaveBeenCalled();
    });
  });
});
