import { NextRequest } from "next/server";

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  from: jest.fn(),
};

const mockBackfillIfStale = jest.fn().mockResolvedValue(false);
const mockRecomputeAchievement = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

jest.mock("@/lib/family-achievement-progress-service", () => ({
  FamilyAchievementProgressService: jest.fn().mockImplementation(() => ({
    backfillIfStale: mockBackfillIfStale,
    recomputeAchievement: mockRecomputeAchievement,
  })),
}));

jest.mock("@/lib/seasons/active-season", () => ({
  getActiveSeasonForFamily: jest.fn(),
}));

import { GET as getFamilyAchievements } from "@/app/api/family-achievements/route";
import { getActiveSeasonForFamily } from "@/lib/seasons/active-season";

const mockGetActiveSeasonForFamily = getActiveSeasonForFamily as jest.Mock;

const createRequest = (method = "GET", body?: unknown, auth = "Bearer token") =>
  new NextRequest("http://localhost/test", {
    method,
    headers: auth
      ? { authorization: auth, "content-type": "application/json" }
      : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
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

function seasonProgressQuery(data: unknown, error: unknown = null) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    then: (fn: (v: unknown) => unknown) =>
      Promise.resolve({ data, error }).then(fn),
  };
  return query;
}

function authAs(role: string, familyId: string | null = "family-001") {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-001" } },
    error: null,
  });
  mockSupabase.from.mockImplementation(() =>
    chainResult({ role, family_id: familyId }),
  );
}

describe("Family achievement API routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBackfillIfStale.mockResolvedValue(false);
    mockGetActiveSeasonForFamily.mockResolvedValue({
      id: "season-current",
      family_id: "family-001",
      name: "Current Season",
      theme: null,
      starts_at: "2026-06-01T00:00:00.000Z",
      ends_at: null,
    });
  });

  describe("GET /api/family-achievements", () => {
    it("returns 401 for unauthenticated request", async () => {
      const response = await getFamilyAchievements(
        createRequest("GET", undefined, ""),
      );
      expect(response.status).toBe(401);
    });

    it("returns empty array for user with no family", async () => {
      authAs("HERO", null);
      const response = await getFamilyAchievements(createRequest());
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.achievements).toEqual([]);
    });

    it("returns achievements for authenticated user with family", async () => {
      authAs("HERO");

      const achievements = [
        {
          id: "fa-1",
          name: "Test",
          description: "Test",
          icon: null,
          category_id: null,
          xp_reward: 0,
          gold_reward: 0,
          is_hidden: false,
          criteria_type: "quest_complete",
          criteria_config: {},
          achievement_categories: null,
        },
      ];
      const progress = [
        {
          family_achievement_id: "fa-1",
          unlocked_at: null,
          progress: { current: 3, threshold: 10 },
          notified: false,
        },
      ];

      let serviceCallCount = 0;
      mockServiceSupabase.from.mockImplementation(() => {
        serviceCallCount++;
        if (serviceCallCount === 1) {
          // family_achievements query
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest
              .fn()
              .mockResolvedValue({ data: achievements, error: null }),
          };
        }
        // family_achievement_progress query
        return seasonProgressQuery(progress);
      });

      const response = await getFamilyAchievements(createRequest());
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.achievements).toHaveLength(1);
      expect(body.achievements[0].progress).toEqual({
        current: 3,
        threshold: 10,
      });
    });

    it("triggers backfill and returns fresh progress when achievements have no progress rows", async () => {
      mockBackfillIfStale.mockResolvedValueOnce(true);
      authAs("HERO");

      const achievements = [
        {
          id: "fa-1",
          name: "Test",
          description: "Test",
          icon: null,
          category_id: null,
          xp_reward: 0,
          gold_reward: 0,
          is_hidden: false,
          criteria_type: "quest_complete",
          criteria_config: {},
          achievement_categories: null,
        },
      ];
      const freshProgress = [
        {
          family_achievement_id: "fa-1",
          unlocked_at: "2024-01-15T12:00:00Z",
          progress: { current: 5, threshold: 5 },
          notified: false,
        },
      ];

      let serviceCallCount = 0;
      mockServiceSupabase.from.mockImplementation(() => {
        serviceCallCount++;
        if (serviceCallCount === 1) {
          // family_achievements query
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest
              .fn()
              .mockResolvedValue({ data: achievements, error: null }),
          };
        }
        if (serviceCallCount === 2) {
          // initial family_achievement_progress query — empty (no rows yet)
          return seasonProgressQuery([]);
        }
        // re-fetch after backfill
        return seasonProgressQuery(freshProgress);
      });

      const response = await getFamilyAchievements(createRequest());
      expect(response.status).toBe(200);
      expect(mockBackfillIfStale).toHaveBeenCalled();
      const body = await response.json();
      expect(body.achievements).toHaveLength(1);
      expect(body.achievements[0].unlocked_at).toBe("2024-01-15T12:00:00Z");
      expect(body.achievements[0].progress).toEqual({
        current: 5,
        threshold: 5,
      });
    });

    it("does not surface legacy unlocked progress when no active season exists", async () => {
      mockGetActiveSeasonForFamily.mockResolvedValueOnce(null);
      authAs("HERO");

      const achievements = [
        {
          id: "fa-legacy",
          name: "Legacy Hidden",
          description: "Should stay hidden",
          icon: "secret",
          category_id: null,
          xp_reward: 100,
          gold_reward: 50,
          is_hidden: true,
          criteria_type: "quest_complete",
          criteria_config: { threshold: 1 },
          achievement_categories: null,
        },
      ];
      const legacyProgress = [
        {
          family_achievement_id: "fa-legacy",
          unlocked_at: "2026-05-01T00:00:00.000Z",
          progress: { current: 1, threshold: 1 },
          notified: true,
        },
      ];

      let serviceCallCount = 0;
      mockServiceSupabase.from.mockImplementation(() => {
        serviceCallCount++;
        if (serviceCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest
              .fn()
              .mockResolvedValue({ data: achievements, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: legacyProgress, error: null }),
        };
      });

      const response = await getFamilyAchievements(createRequest());
      expect(response.status).toBe(200);
      expect(mockBackfillIfStale).not.toHaveBeenCalled();
      const body = await response.json();
      expect(body.achievements[0]).toEqual(
        expect.objectContaining({
          name: "???",
          unlocked_at: null,
          progress: null,
          notified: null,
        }),
      );
      expect(serviceCallCount).toBe(1);
    });
  });

});
