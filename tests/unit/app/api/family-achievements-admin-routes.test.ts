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

import { POST as createFamilyAchievement } from "@/app/api/admin/family-achievements/route";
import { getActiveSeasonForFamily } from "@/lib/seasons/active-season";

const mockGetActiveSeasonForFamily = getActiveSeasonForFamily as jest.Mock;

const createRequest = (method = "POST", body?: unknown, auth = "Bearer token") =>
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

describe("POST /api/admin/family-achievements", () => {
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
