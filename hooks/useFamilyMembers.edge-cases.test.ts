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
];

const createUserProfilesQuery = (data: Tables<"user_profiles">[] | null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ data, error: null }),
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

describe("useFamilyMembers - edge cases", () => {
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
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("should handle null data responses from Supabase", async () => {
    const profilesQuery = createUserProfilesQuery(null);
     
    mockSupabase.from.mockReturnValue(profilesQuery as any);

    const { result } = renderHook(() => useFamilyMembers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.familyMembers).toEqual([]);
    expect(result.current.familyCharacters).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should handle null character data responses", async () => {
    const profilesQuery = createUserProfilesQuery(mockFamilyMembers);
    const charactersQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "user_profiles") {
         
        return profilesQuery as any;
      }
      if (table === "characters") {
         
        return charactersQuery as any;
      }
       
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
