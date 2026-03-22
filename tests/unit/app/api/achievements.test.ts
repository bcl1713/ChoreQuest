const mockServerSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockServerSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/achievements/route";

const CHARACTER_ID = "char-aaaa-bbbb-cccc-dddddddddddd";

function makeRequest(
  auth: string | null = "Bearer token",
  characterId: string | null = CHARACTER_ID,
) {
  const url = new URL("http://localhost/api/achievements");
  if (characterId) url.searchParams.set("characterId", characterId);

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (auth !== null) headers["authorization"] = auth;

  return new NextRequest(url, { method: "GET", headers });
}

function setupAuth(characterOwned = true) {
  mockServerSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mockServerSupabase.from.mockImplementation((table: string) => {
    if (table === "user_profiles") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: "HERO", family_id: "fam-1" },
          error: null,
        }),
      };
    }
    if (table === "characters") {
      const maybeSingle = jest.fn().mockResolvedValue({
        data: characterOwned ? { id: CHARACTER_ID } : null,
        error: null,
      });
      const eq2 = jest.fn().mockReturnValue({ maybeSingle });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      return { select: jest.fn().mockReturnValue({ eq: eq1 }) };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  });
}

const MOCK_CATEGORIES = [
  {
    id: "cat-1",
    name: "Adventurer",
    description: "Questing",
    icon: "sword",
    display_order: 1,
  },
  {
    id: "cat-2",
    name: "Wealth",
    description: "Gold",
    icon: "coins",
    display_order: 2,
  },
];

const MOCK_ACHIEVEMENTS = [
  {
    id: "ach-1",
    name: "First Quest",
    description: "Complete your first quest",
    icon: "sword",
    category_id: "cat-1",
    xp_reward: 50,
    gold_reward: 10,
    is_hidden: false,
    criteria_type: "quest_complete",
  },
  {
    id: "ach-2",
    name: "Rich Adventurer",
    description: "Earn 1000 gold",
    icon: "coins",
    category_id: "cat-2",
    xp_reward: 100,
    gold_reward: 25,
    is_hidden: false,
    criteria_type: "gold_earned",
  },
  {
    id: "ach-3",
    name: "Secret Find",
    description: "Find the hidden treasure",
    icon: "eye-off",
    category_id: "cat-1",
    xp_reward: 200,
    gold_reward: 50,
    is_hidden: true,
    criteria_type: "quest_complete",
  },
];

const MOCK_PROGRESS = [
  {
    id: "ca-1",
    achievement_id: "ach-1",
    unlocked_at: "2026-03-20T10:00:00Z",
    progress: { current: 1, threshold: 1 },
  },
  {
    id: "ca-2",
    achievement_id: "ach-2",
    unlocked_at: null,
    progress: { current: 500, threshold: 1000 },
  },
];

function setupServiceQueries(
  categories = MOCK_CATEGORIES,
  achievements = MOCK_ACHIEVEMENTS,
  progress = MOCK_PROGRESS,
) {
  const orderFn = jest
    .fn()
    .mockResolvedValue({ data: categories, error: null });
  const selectCategories = jest.fn().mockReturnValue({ order: orderFn });

  const orderAchFn = jest
    .fn()
    .mockResolvedValue({ data: achievements, error: null });
  const selectAchievements = jest.fn().mockReturnValue({ order: orderAchFn });

  const eqFn = jest.fn().mockResolvedValue({ data: progress, error: null });
  const selectProgress = jest.fn().mockReturnValue({ eq: eqFn });

  mockServiceSupabase.from.mockImplementation((table: string) => {
    if (table === "achievement_categories") {
      return { select: selectCategories };
    }
    if (table === "achievements") {
      return { select: selectAchievements };
    }
    if (table === "character_achievements") {
      return { select: selectProgress };
    }
    return { select: jest.fn().mockReturnThis() };
  });
}

describe("GET /api/achievements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with achievements grouped by category and progress merged", async () => {
    setupAuth();
    setupServiceQueries();

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.categories).toHaveLength(2);

    // Category 1 has 2 achievements (including hidden)
    const cat1 = body.categories[0];
    expect(cat1.name).toBe("Adventurer");
    expect(cat1.achievements).toHaveLength(2);

    // First achievement is unlocked
    const ach1 = cat1.achievements.find(
      (a: { id: string }) => a.id === "ach-1",
    );
    expect(ach1.unlocked_at).toBe("2026-03-20T10:00:00Z");
    expect(ach1.progress).toEqual({ current: 1, threshold: 1 });

    // Hidden achievement has no progress
    const ach3 = cat1.achievements.find(
      (a: { id: string }) => a.id === "ach-3",
    );
    expect(ach3.is_hidden).toBe(true);
    expect(ach3.unlocked_at).toBeNull();
    expect(ach3.progress).toBeNull();

    // Category 2 has 1 achievement with partial progress
    const cat2 = body.categories[1];
    expect(cat2.name).toBe("Wealth");
    expect(cat2.achievements).toHaveLength(1);
    const ach2 = cat2.achievements[0];
    expect(ach2.unlocked_at).toBeNull();
    expect(ach2.progress).toEqual({ current: 500, threshold: 1000 });
  });

  it("returns 401 when no Authorization header is present", async () => {
    const res = await GET(makeRequest(null));
    expect(res.status).toBe(401);
  });

  it("returns 401 when auth token is invalid", async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });
    mockServerSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns achievements with null progress when character has no progress records", async () => {
    setupAuth();
    setupServiceQueries(MOCK_CATEGORIES, MOCK_ACHIEVEMENTS, []);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    const allAchievements = body.categories.flatMap(
      (c: AchievementCategory) => c.achievements,
    );
    for (const ach of allAchievements) {
      expect(ach.unlocked_at).toBeNull();
      expect(ach.progress).toBeNull();
    }
  });

  it("returns 400 when characterId is missing", async () => {
    setupAuth();

    const res = await GET(makeRequest("Bearer token", null));
    expect(res.status).toBe(400);
  });

  it("returns 403 when character does not belong to the authenticated user", async () => {
    setupAuth(false);

    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });
});

type AchievementCategory = {
  achievements: { unlocked_at: string | null; progress: unknown }[];
};
