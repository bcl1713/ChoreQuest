import { renderHook, waitFor } from "@testing-library/react";
import { useFamilyMembers } from "./useFamilyMembers";
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

describe("useFamilyMembers - return shape", () => {
  it("should return all expected properties", async () => {
    const profilesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockFamilyMembers, error: null }),
    };
    const charactersQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: mockCharacters, error: null }),
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

    expect(result.current).toHaveProperty("familyMembers");
    expect(result.current).toHaveProperty("familyCharacters");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("reload");
    expect(Array.isArray(result.current.familyMembers)).toBe(true);
    expect(Array.isArray(result.current.familyCharacters)).toBe(true);
    expect(typeof result.current.loading).toBe("boolean");
    expect(typeof result.current.reload).toBe("function");
  });
});
