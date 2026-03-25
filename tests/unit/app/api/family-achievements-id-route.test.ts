import { NextRequest } from "next/server";

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = { from: jest.fn() };

const mockRecomputeAchievement = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

jest.mock("@/lib/family-achievement-progress-service", () => ({
  FamilyAchievementProgressService: jest.fn().mockImplementation(() => ({
    recomputeAchievement: mockRecomputeAchievement,
  })),
}));

import {
  PUT as updateFamilyAchievement,
  DELETE as deleteFamilyAchievement,
} from "@/app/api/admin/family-achievements/[id]/route";
import { POST as createFamilyAchievement } from "@/app/api/admin/family-achievements/route";

const VALID_ACH_ID = "123e4567-e89b-12d3-a456-426614174000";
const VALID_ACH_ID_2 = "123e4567-e89b-12d3-a456-426614174001";

const makeParams = (id: string) =>
  Promise.resolve({ id }) as Promise<{ id: string }>;

function createRequest(method: string, body?: unknown, auth = "Bearer token") {
  return new NextRequest("http://localhost/test", {
    method,
    headers: auth
      ? { authorization: auth, "content-type": "application/json" }
      : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function authAs(role: string, familyId: string | null = "family-001") {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-001" } },
    error: null,
  });
  mockSupabase.from.mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { role, family_id: familyId },
      error: null,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: { role, family_id: familyId },
      error: null,
    }),
  }));
}

function mockServiceWithExisting(id = VALID_ACH_ID) {
  mockServiceSupabase.from.mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: { id },
      error: null,
    }),
    single: jest.fn().mockResolvedValue({
      data: { id, name: "Updated", criteria_type: "quest_complete" },
      error: null,
    }),
  }));
}

describe("PUT /api/admin/family-achievements/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for malformed UUID", async () => {
    authAs("GUILD_MASTER");
    const response = await updateFamilyAchievement(
      createRequest("PUT", { name: "Updated" }),
      { params: makeParams("not-a-uuid") },
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("FAMILY_ACHIEVEMENT_ID_INVALID");
  });

  it("returns 403 for non-Guild-Master", async () => {
    authAs("HERO");
    const response = await updateFamilyAchievement(
      createRequest("PUT", { name: "Updated" }),
      { params: makeParams(VALID_ACH_ID) },
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 when criteria_type is unsupported", async () => {
    authAs("GUILD_MASTER");
    const response = await updateFamilyAchievement(
      createRequest("PUT", {
        name: "Valid Name",
        criteria_type: "typo_type",
      }),
      { params: makeParams(VALID_ACH_ID) },
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("FAMILY_ACHIEVEMENT_CRITERIA_TYPE_UNSUPPORTED");
  });

  it("returns 400 when name is empty string", async () => {
    authAs("GUILD_MASTER");
    const response = await updateFamilyAchievement(
      createRequest("PUT", { name: "   " }),
      { params: makeParams(VALID_ACH_ID) },
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("FAMILY_ACHIEVEMENT_NAME_REQUIRED");
  });

  it("returns 200 with a supported criteria_type", async () => {
    authAs("GUILD_MASTER");
    mockServiceWithExisting();

    const response = await updateFamilyAchievement(
      createRequest("PUT", {
        name: "Updated Achievement",
        criteria_type: "quest_complete",
      }),
      { params: makeParams(VALID_ACH_ID) },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("returns 400 when family_evaluation_mode is invalid (PUT)", async () => {
    authAs("GUILD_MASTER");
    const response = await updateFamilyAchievement(
      createRequest("PUT", {
        criteria_config: { threshold: 5, family_evaluation_mode: "ALL" },
      }),
      { params: makeParams(VALID_ACH_ID) },
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("FAMILY_ACHIEVEMENT_EVAL_MODE_INVALID");
  });
});

describe("POST /api/admin/family-achievements — eval mode validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when family_evaluation_mode is not 'sum' or 'all'", async () => {
    authAs("GUILD_MASTER");
    const response = await createFamilyAchievement(
      createRequest("POST", {
        name: "Bad Mode",
        criteria_type: "quest_complete",
        criteria_config: { threshold: 10, family_evaluation_mode: "ALL" },
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("FAMILY_ACHIEVEMENT_EVAL_MODE_INVALID");
  });
});

describe("DELETE /api/admin/family-achievements/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for malformed UUID", async () => {
    authAs("GUILD_MASTER");
    const response = await deleteFamilyAchievement(createRequest("DELETE"), {
      params: makeParams("not-a-uuid"),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("FAMILY_ACHIEVEMENT_ID_INVALID");
  });

  it("returns 403 for non-Guild-Master", async () => {
    authAs("HERO");
    const response = await deleteFamilyAchievement(createRequest("DELETE"), {
      params: makeParams(VALID_ACH_ID),
    });
    expect(response.status).toBe(403);
  });

  it("returns 200 for Guild Master", async () => {
    authAs("GUILD_MASTER");
    mockServiceSupabase.from.mockImplementation(() => ({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest
              .fn()
              .mockResolvedValue({ data: [{ id: VALID_ACH_ID }], error: null }),
          }),
        }),
      }),
    }));

    const response = await deleteFamilyAchievement(createRequest("DELETE"), {
      params: makeParams(VALID_ACH_ID),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("returns 404 when achievement does not exist", async () => {
    authAs("GUILD_MASTER");
    mockServiceSupabase.from.mockImplementation(() => ({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    }));

    const response = await deleteFamilyAchievement(createRequest("DELETE"), {
      params: makeParams(VALID_ACH_ID_2),
    });
    expect(response.status).toBe(404);
  });
});
