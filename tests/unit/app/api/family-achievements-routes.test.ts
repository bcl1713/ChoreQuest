import { NextRequest } from "next/server";

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

import { GET as getFamilyAchievements } from "@/app/api/family-achievements/route";
import { POST as createFamilyAchievement } from "@/app/api/admin/family-achievements/route";
import { PATCH as patchNotified } from "@/app/api/family-achievement-progress/[id]/notified/route";

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

    it("returns 400 when name is missing", async () => {
      authAs("GUILD_MASTER");
      const response = await createFamilyAchievement(
        createRequest("POST", { criteria_type: "quest_complete" }),
      );
      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/family-achievement-progress/[id]/notified", () => {
    it("returns 401 for unauthenticated request", async () => {
      const response = await patchNotified(
        createRequest("PATCH", undefined, ""),
        { params: Promise.resolve({ id: "prog-1" }) },
      );
      expect(response.status).toBe(401);
    });

    it("returns 404 when progress not found", async () => {
      authAs("HERO");
      mockServiceSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }));

      const response = await patchNotified(createRequest("PATCH"), {
        params: Promise.resolve({ id: "prog-not-found" }),
      });
      expect(response.status).toBe(404);
    });

    it("returns 200 when marking as notified", async () => {
      authAs("HERO");

      let serviceCallCount = 0;
      mockServiceSupabase.from.mockImplementation(() => {
        serviceCallCount++;
        if (serviceCallCount === 1) {
          // Lookup
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: "prog-1", family_id: "family-001" },
              error: null,
            }),
          };
        }
        // Update
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      const response = await patchNotified(createRequest("PATCH"), {
        params: Promise.resolve({ id: "prog-1" }),
      });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });
});
