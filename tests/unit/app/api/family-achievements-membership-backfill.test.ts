import { NextRequest } from "next/server";

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  from: jest.fn(),
};

const mockBackfillIfStale = jest.fn().mockResolvedValue(false);

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

jest.mock("@/lib/family-achievement-progress-service", () => ({
  FamilyAchievementProgressService: jest.fn().mockImplementation(() => ({
    backfillIfStale: mockBackfillIfStale,
  })),
}));

import { GET as getFamilyAchievements } from "@/app/api/family-achievements/route";

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

const achievement = {
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

const hiddenAchievement = {
  id: "fa-hidden",
  name: "Secret Achievement",
  description: "Hidden details",
  icon: "secret",
  category_id: null,
  xp_reward: 500,
  gold_reward: 250,
  is_hidden: true,
  criteria_type: "level_reached",
  criteria_config: { threshold: 5, family_evaluation_mode: "all" },
  achievement_categories: null,
};

describe("GET /api/family-achievements — membership-change backfill", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBackfillIfStale.mockResolvedValue(false);
  });

  it("triggers backfill when stored member_count differs from current family size", async () => {
    mockBackfillIfStale.mockResolvedValueOnce(true);
    authAs("HERO");

    // Progress stored when family had 2 members; family now has 3.
    const staleProgress = [
      {
        family_achievement_id: "fa-1",
        unlocked_at: "2024-01-01T00:00:00Z",
        progress: { current: 5, threshold: 5, member_count: 2 },
        notified: true,
      },
    ];

    // After recompute the new member hasn't reached level 5 — re-locked.
    const freshProgress = [
      {
        family_achievement_id: "fa-1",
        unlocked_at: null,
        progress: { current: 4, threshold: 5, member_count: 3 },
        notified: false,
      },
    ];

    let serviceCallCount = 0;
    mockServiceSupabase.from.mockImplementation(() => {
      serviceCallCount++;
      if (serviceCallCount === 1) {
        // family_achievements
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest
            .fn()
            .mockResolvedValue({ data: [achievement], error: null }),
        };
      }
      if (serviceCallCount === 2) {
        // initial family_achievement_progress fetch
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: staleProgress, error: null }),
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
    expect(mockBackfillIfStale).toHaveBeenCalled();
    const body = await response.json();
    expect(body.achievements[0].unlocked_at).toBeNull();
    // member_count must be stripped from the public progress payload
    expect(body.achievements[0].progress).toEqual({ current: 4, threshold: 5 });
  });

  it("does not trigger backfill when stored member_count matches current family size", async () => {
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
            .mockResolvedValue({ data: [achievement], error: null }),
        };
      }
      if (serviceCallCount === 2) {
        // progress stored with member_count: 3, family still has 3 members
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                family_achievement_id: "fa-1",
                unlocked_at: null,
                progress: { current: 3, threshold: 5, member_count: 3 },
                notified: false,
              },
            ],
            error: null,
          }),
        };
      }
    });

    const response = await getFamilyAchievements(createRequest());
    expect(response.status).toBe(200);
    expect(mockBackfillIfStale).toHaveBeenCalled();
  });

  it("does not query user_profiles when no progress rows carry a member_count", async () => {
    authAs("HERO");

    // Legacy rows written before the member_count field was added.
    const legacyProgress = [
      {
        family_achievement_id: "fa-1",
        unlocked_at: null,
        progress: { current: 3, threshold: 5 }, // no member_count
        notified: false,
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
            .mockResolvedValue({ data: [achievement], error: null }),
        };
      }
      // Only two calls should happen — no user_profiles count query.
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: legacyProgress, error: null }),
      };
    });

    const response = await getFamilyAchievements(createRequest());
    expect(response.status).toBe(200);
    // Only achievements + progress queries fired; no re-fetch.
    expect(serviceCallCount).toBe(2);
  });

  it("redacts hidden achievements when backfill throws (fail closed)", async () => {
    mockBackfillIfStale.mockRejectedValueOnce(new Error("DB connection error"));
    authAs("HERO");

    // Stale progress row claims the hidden achievement is unlocked.
    const staleProgress = [
      {
        family_achievement_id: "fa-hidden",
        unlocked_at: "2024-01-01T00:00:00Z",
        progress: { current: 5, threshold: 5, member_count: 2 },
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
            .mockResolvedValue({ data: [hiddenAchievement], error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: staleProgress, error: null }),
      };
    });

    const response = await getFamilyAchievements(createRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    const ach = body.achievements[0];
    // Stale unlock must not bleed through — hidden achievement stays redacted.
    expect(ach.name).toBe("???");
    expect(ach.description).toBe("???");
    expect(ach.icon).toBeNull();
    expect(ach.xp_reward).toBeNull();
    expect(ach.gold_reward).toBeNull();
    expect(ach.unlocked_at).toBeNull();
    expect(ach.progress).toBeNull();
  });
});
