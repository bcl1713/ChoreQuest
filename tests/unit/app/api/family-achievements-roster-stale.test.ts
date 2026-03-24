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

const createRequest = (auth = "Bearer token") =>
  new NextRequest("http://localhost/test", {
    method: "GET",
    headers: { authorization: auth, "content-type": "application/json" },
  });

function authAs(role: string, familyId: string | null = "family-001") {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-001" } },
    error: null,
  });
  mockSupabase.from.mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest
      .fn()
      .mockResolvedValue({ data: { role, family_id: familyId }, error: null }),
    maybeSingle: jest
      .fn()
      .mockResolvedValue({ data: { role, family_id: familyId }, error: null }),
    then: (fn: (v: unknown) => unknown) =>
      Promise.resolve({
        data: { role, family_id: familyId },
        error: null,
      }).then(fn),
  }));
}

const achievement1 = {
  id: "fa-1",
  name: "All Level 5",
  description: "Everyone reaches level 5",
  icon: "star",
  category_id: null,
  xp_reward: 100,
  gold_reward: 50,
  is_hidden: false,
  criteria_type: "level_reached",
  criteria_config: { threshold: 5, family_evaluation_mode: "all" },
  achievement_categories: null,
};

const achievement2 = {
  id: "fa-2",
  name: "All Level 10",
  description: "Everyone reaches level 10",
  icon: "diamond",
  category_id: null,
  xp_reward: 200,
  gold_reward: 100,
  is_hidden: false,
  criteria_type: "level_reached",
  criteria_config: { threshold: 10, family_evaluation_mode: "all" },
  achievement_categories: null,
};

describe("Roster-change staleness — mixed member_count snapshots", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/family-achievements", () => {
    it("triggers backfill when only some rows are stale", async () => {
      authAs("HERO");

      // fa-1 is current (member_count: 3); fa-2 is stale (member_count: 2).
      // The old "first row only" check would miss fa-2 if fa-1 happened to be
      // iterated first.
      const mixedProgress = [
        {
          family_achievement_id: "fa-1",
          unlocked_at: null,
          progress: { current: 3, threshold: 5, member_count: 3 },
          notified: false,
        },
        {
          family_achievement_id: "fa-2",
          unlocked_at: "2024-01-01T00:00:00Z",
          progress: { current: 5, threshold: 5, member_count: 2 },
          notified: true,
        },
      ];

      const freshProgress = [
        {
          family_achievement_id: "fa-1",
          unlocked_at: null,
          progress: { current: 3, threshold: 5, member_count: 3 },
          notified: false,
        },
        {
          family_achievement_id: "fa-2",
          unlocked_at: null,
          progress: { current: 4, threshold: 5, member_count: 3 },
          notified: false,
        },
      ];

      let callCount = 0;
      mockServiceSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [achievement1, achievement2],
              error: null,
            }),
          };
        }
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest
              .fn()
              .mockResolvedValue({ data: mixedProgress, error: null }),
          };
        }
        if (callCount === 3) {
          // user_profiles count — family has 3 members
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: freshProgress, error: null }),
        };
      });

      const response = await getFamilyAchievements(createRequest());
      expect(response.status).toBe(200);
      expect(mockBackfillProgress).toHaveBeenCalledWith("family-001");
      const body = await response.json();
      expect(
        body.achievements.find((a: { id: string }) => a.id === "fa-2")
          .unlocked_at,
      ).toBeNull();
    });
  });

  describe("GET /api/admin/family-achievements — roster-change backfill", () => {
    const adminAchievement = {
      ...achievement1,
      achievement_categories: { name: "General" },
    };

    it("triggers backfill when stored member_count differs from current family size", async () => {
      authAs("GUILD_MASTER");

      const staleProgress = [
        {
          family_achievement_id: "fa-1",
          unlocked_at: "2024-01-01T00:00:00Z",
          progress: { current: 5, threshold: 5, member_count: 2 },
        },
      ];

      const freshProgress = [
        {
          family_achievement_id: "fa-1",
          unlocked_at: null,
          progress: { current: 4, threshold: 5, member_count: 3 },
        },
      ];

      let callCount = 0;
      mockServiceSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest
              .fn()
              .mockResolvedValue({ data: [adminAchievement], error: null }),
          };
        }
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest
              .fn()
              .mockResolvedValue({ data: staleProgress, error: null }),
          };
        }
        if (callCount === 3) {
          // user_profiles count — family has grown to 3
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
          };
        }
        if (callCount === 4) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest
              .fn()
              .mockResolvedValue({ data: freshProgress, error: null }),
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
      expect(body.achievements[0].unlocked_at).toBeNull();
    });

    it("does not backfill when member_count matches and no rows are missing", async () => {
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
              .mockResolvedValue({ data: [adminAchievement], error: null }),
          };
        }
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  family_achievement_id: "fa-1",
                  unlocked_at: null,
                  progress: { current: 3, threshold: 5, member_count: 3 },
                },
              ],
              error: null,
            }),
          };
        }
        if (callCount === 3) {
          // user_profiles count — matches stored snapshot
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
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
      expect(mockBackfillProgress).not.toHaveBeenCalled();
    });
  });
});
