import { NextRequest } from "next/server";

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  from: jest.fn(),
};

const mockBackfillProgress = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

jest.mock("@/lib/family-achievement-progress-service", () => ({
  FamilyAchievementProgressService: jest.fn().mockImplementation(() => ({
    backfillProgress: mockBackfillProgress,
  })),
}));

import { GET as getFamilyAchievements } from "@/app/api/family-achievements/route";
import { GET as getAdminFamilyAchievements } from "@/app/api/admin/family-achievements/route";

const createRequest = (method = "GET", auth = "Bearer token") =>
  new NextRequest("http://localhost/test", {
    method,
    headers: auth
      ? { authorization: auth, "content-type": "application/json" }
      : undefined,
  });

const chainResult = (data: unknown, error: unknown = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data, error }),
  maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  then: (fn: (v: unknown) => unknown) =>
    Promise.resolve({ data, error }).then(fn),
});

function authAs(role: string, familyId: string | null = "family-001") {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-001" } },
    error: null,
  });
  mockSupabase.from.mockImplementation(() =>
    chainResult({ role, family_id: familyId }),
  );
}

const hiddenAchievements = [
  {
    id: "fa-hidden",
    name: "Secret Club",
    description: "You found it",
    icon: "trophy",
    category_id: null,
    xp_reward: 500,
    gold_reward: 100,
    is_hidden: true,
    criteria_type: "quest_complete",
    criteria_config: {},
    achievement_categories: null,
  },
  {
    id: "fa-visible",
    name: "Open Badge",
    description: "Everyone sees this",
    icon: "star",
    category_id: null,
    xp_reward: 50,
    gold_reward: 10,
    is_hidden: false,
    criteria_type: "quest_complete",
    criteria_config: {},
    achievement_categories: null,
  },
  {
    id: "fa-hidden-unlocked",
    name: "Unlocked Secret",
    description: "You earned it",
    icon: "gem",
    category_id: null,
    xp_reward: 200,
    gold_reward: 50,
    is_hidden: true,
    criteria_type: "quest_complete",
    criteria_config: {},
    achievement_categories: null,
  },
];

const mixedProgress = [
  {
    family_achievement_id: "fa-visible",
    unlocked_at: null,
    progress: { current: 2, threshold: 5 },
    notified: false,
  },
  {
    family_achievement_id: "fa-hidden-unlocked",
    unlocked_at: "2024-06-01T00:00:00Z",
    progress: { current: 5, threshold: 5 },
    notified: true,
  },
];

describe("Family achievements — hidden redaction & admin backfill", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/family-achievements — hidden achievement redaction", () => {
    it("redacts name/description/icon/rewards for hidden locked achievements", async () => {
      authAs("HERO");

      let serviceCallCount = 0;
      mockServiceSupabase.from.mockImplementation(() => {
        serviceCallCount++;
        if (serviceCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest
              .fn()
              .mockResolvedValue({ data: hiddenAchievements, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mixedProgress, error: null }),
        };
      });

      const response = await getFamilyAchievements(createRequest());
      expect(response.status).toBe(200);
      const body = await response.json();

      const hidden = body.achievements.find(
        (a: { id: string }) => a.id === "fa-hidden",
      );
      expect(hidden.name).toBe("???");
      expect(hidden.description).toBe("???");
      expect(hidden.icon).toBeNull();
      expect(hidden.xp_reward).toBeNull();
      expect(hidden.gold_reward).toBeNull();

      const visible = body.achievements.find(
        (a: { id: string }) => a.id === "fa-visible",
      );
      expect(visible.name).toBe("Open Badge");
      expect(visible.icon).toBe("star");
      expect(visible.xp_reward).toBe(50);

      const unlockedHidden = body.achievements.find(
        (a: { id: string }) => a.id === "fa-hidden-unlocked",
      );
      expect(unlockedHidden.name).toBe("Unlocked Secret");
      expect(unlockedHidden.icon).toBe("gem");
      expect(unlockedHidden.xp_reward).toBe(200);
    });
  });

  describe("GET /api/admin/family-achievements — backfill missing progress", () => {
    const adminAchievements = [
      {
        id: "fa-new",
        name: "Brand New",
        description: "Just created",
        icon: null,
        category_id: null,
        xp_reward: 0,
        gold_reward: 0,
        is_hidden: false,
        criteria_type: "quest_complete",
        criteria_config: {},
        achievement_categories: { name: "General" },
      },
    ];

    it("returns 403 for non-Guild-Master", async () => {
      authAs("HERO");
      const response = await getAdminFamilyAchievements(createRequest());
      expect(response.status).toBe(403);
    });

    it("does not backfill when all achievements already have progress rows", async () => {
      authAs("GUILD_MASTER");

      let callCount = 0;
      mockServiceSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest
              .fn()
              .mockResolvedValue({ data: adminAchievements, error: null }),
          };
        }
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  family_achievement_id: "fa-new",
                  unlocked_at: null,
                  progress: { current: 0, threshold: 5 },
                },
              ],
              error: null,
            }),
          };
        }
        // categories
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      await getAdminFamilyAchievements(createRequest());
      expect(mockBackfillProgress).not.toHaveBeenCalled();
    });

    it("triggers backfill when a newly-created achievement has no progress row", async () => {
      authAs("GUILD_MASTER");

      const freshProgress = [
        {
          family_achievement_id: "fa-new",
          unlocked_at: null,
          progress: { current: 0, threshold: 5 },
        },
      ];

      let callCount = 0;
      mockServiceSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // family_achievements
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest
              .fn()
              .mockResolvedValue({ data: adminAchievements, error: null }),
          };
        }
        if (callCount === 2) {
          // initial progress — empty
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (callCount === 3) {
          // re-fetch after backfill
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: freshProgress,
              error: null,
            }),
          };
        }
        // categories
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const response = await getAdminFamilyAchievements(createRequest());
      expect(response.status).toBe(200);
      expect(mockBackfillProgress).toHaveBeenCalledWith("family-001");
      const body = await response.json();
      expect(body.achievements[0].progress).toEqual({
        current: 0,
        threshold: 5,
      });
    });
  });
});
