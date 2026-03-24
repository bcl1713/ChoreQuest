import { NextRequest } from "next/server";

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  from: jest.fn(),
};

const mockBackfillProgress = jest.fn().mockResolvedValue(undefined);
const mockRecomputeAchievement = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

jest.mock("@/lib/family-achievement-progress-service", () => ({
  FamilyAchievementProgressService: jest.fn().mockImplementation(() => ({
    backfillProgress: mockBackfillProgress,
    recomputeAchievement: mockRecomputeAchievement,
  })),
}));

import { GET as getFamilyAchievements } from "@/app/api/family-achievements/route";
import { POST as createFamilyAchievement } from "@/app/api/admin/family-achievements/route";

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
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: progress, error: null }),
        };
      });

      const response = await getFamilyAchievements(createRequest());
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.achievements).toHaveLength(1);
      expect(body.achievements[0].progress).toEqual({
        current: 3,
        threshold: 10,
      });
      expect(mockBackfillProgress).not.toHaveBeenCalled();
    });

    it("triggers backfill and returns fresh progress when achievements have no progress rows", async () => {
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
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        // re-fetch after backfill
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: freshProgress, error: null }),
        };
      });

      const response = await getFamilyAchievements(createRequest());
      expect(response.status).toBe(200);
      expect(mockBackfillProgress).toHaveBeenCalledWith("family-001");
      const body = await response.json();
      expect(body.achievements).toHaveLength(1);
      expect(body.achievements[0].unlocked_at).toBe("2024-01-15T12:00:00Z");
      expect(body.achievements[0].progress).toEqual({
        current: 5,
        threshold: 5,
      });
    });
  });

  describe("POST /api/admin/family-achievements", () => {
    it("returns 403 for non-Guild-Master", async () => {
      authAs("HERO");
      const response = await createFamilyAchievement(
        createRequest("POST", {
          name: "Test",
          criteria_type: "quest_complete",
        }),
      );
      expect(response.status).toBe(403);
    });

    it("returns 201 for Guild Master with valid data", async () => {
      authAs("GUILD_MASTER");

      mockServiceSupabase.from.mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "fa-new", name: "New Achievement" },
              error: null,
            }),
          }),
        }),
      }));

      const response = await createFamilyAchievement(
        createRequest("POST", {
          name: "New Achievement",
          criteria_type: "quest_complete",
          criteria_config: { threshold: 10 },
        }),
      );
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it("seeds progress via recomputeAchievement after successful creation", async () => {
      authAs("GUILD_MASTER");

      mockServiceSupabase.from.mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "fa-seeded", name: "Seeded Achievement" },
              error: null,
            }),
          }),
        }),
      }));

      const response = await createFamilyAchievement(
        createRequest("POST", {
          name: "Seeded Achievement",
          criteria_type: "quest_complete",
          criteria_config: { threshold: 10 },
        }),
      );
      expect(response.status).toBe(201);
      expect(mockRecomputeAchievement).toHaveBeenCalledWith(
        "family-001",
        "fa-seeded",
      );
    });

    it("returns 400 when name is missing", async () => {
      authAs("GUILD_MASTER");
      const response = await createFamilyAchievement(
        createRequest("POST", { criteria_type: "quest_complete" }),
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 when criteria_type is unsupported", async () => {
      authAs("GUILD_MASTER");
      const response = await createFamilyAchievement(
        createRequest("POST", {
          name: "Bad Achievement",
          criteria_type: "not_a_real_type",
        }),
      );
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.code).toBe("FAMILY_ACHIEVEMENT_CRITERIA_TYPE_UNSUPPORTED");
    });
  });
});
