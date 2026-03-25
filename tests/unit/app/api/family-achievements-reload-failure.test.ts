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

const hiddenAchievement = {
  id: "fa-hidden",
  name: "Secret Quest",
  description: "A secret",
  icon: "star",
  category_id: null,
  xp_reward: 100,
  gold_reward: 50,
  is_hidden: true,
  criteria_type: "level_reached",
  criteria_config: { threshold: 5, family_evaluation_mode: "all" },
  achievement_categories: null,
};

// Pre-backfill progress shows the hidden achievement as unlocked (stale).
const staleProgress = [
  {
    family_achievement_id: "fa-hidden",
    unlocked_at: "2024-01-01T00:00:00Z",
    progress: { current: 5, threshold: 5, member_count: 2 },
    notified: false,
  },
];

describe("POST-backfill reload failure — fail-closed redaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBackfillIfStale.mockResolvedValue(false);
  });

  it("redacts hidden achievements when the post-backfill progress reload fails", async () => {
    mockBackfillIfStale.mockResolvedValueOnce(true);
    authAs("HERO");

    let callCount = 0;
    mockServiceSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest
            .fn()
            .mockResolvedValue({ data: [hiddenAchievement], error: null }),
        };
      }
      if (callCount === 2) {
        // Initial progress fetch — stale, shows unlocked_at set
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: staleProgress, error: null }),
        };
      }
      // Third call: post-backfill reload fails with a DB error
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockResolvedValue({ data: null, error: { message: "DB error" } }),
      };
    });

    const response = await getFamilyAchievements(createRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    const hidden = body.achievements.find(
      (a: { id: string }) => a.id === "fa-hidden",
    );
    // Must be redacted despite stale unlocked_at — the backfill may have
    // cleared it but we cannot confirm without a fresh read.
    expect(hidden.name).toBe("???");
    expect(hidden.unlocked_at).toBeNull();
    expect(hidden.xp_reward).toBeNull();
  });
});
