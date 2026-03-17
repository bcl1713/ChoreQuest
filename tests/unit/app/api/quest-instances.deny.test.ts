import { NextRequest } from "next/server";

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
}));

jest.mock("@/lib/quest-instance-service", () => ({
  QuestInstanceService: jest.fn().mockImplementation(() => ({
    approveQuest: jest.fn(),
    assignQuest: jest.fn(),
    releaseQuest: jest.fn(),
  })),
}));

import { POST as denyRoute } from "@/app/api/quest-instances/[id]/deny/route";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const VALID_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const GM_USER_ID = "user-gm-1";
const HERO_USER_ID = "user-hero-1";
const FAMILY_ID = "fam-1";
const OTHER_FAMILY_ID = "fam-other";

const makeRequest = (
  method: string,
  body?: unknown,
  auth: string | null = `Bearer token`,
) => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (auth !== null) headers["authorization"] = auth;
  return new NextRequest("http://localhost/test", {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

const params = (id: string) => ({ params: Promise.resolve({ id }) });

/** Sets up mockSupabase.auth.getUser */
const setupAuth = (role: "GUILD_MASTER" | "HERO", familyId = FAMILY_ID) => {
  const userId = role === "GUILD_MASTER" ? GM_USER_ID : HERO_USER_ID;
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
  return { userId, role, familyId };
};

/** Returns a chainable mock for .from(...).select().eq().single() */
const singleResult = (data: unknown, error: unknown = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data, error }),
  maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
});

// ---------------------------------------------------------------------------
// deny route
// ---------------------------------------------------------------------------

describe("POST /api/quest-instances/[id]/deny", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 when GM denies a COMPLETED quest", async () => {
    setupAuth("GUILD_MASTER");
    const updateMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: VALID_UUID,
          family_id: FAMILY_ID,
          status: "COMPLETED",
          assigned_to_id: HERO_USER_ID,
        },
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    };
    // update().eq() final call resolves success
    const updateChain = {
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    };
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce(updateMock)
      .mockReturnValueOnce(updateChain);

    const res = await denyRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 403 when requester is not a GUILD_MASTER", async () => {
    setupAuth("HERO");
    mockSupabase.from.mockReturnValueOnce(
      singleResult({ role: "HERO", family_id: FAMILY_ID }),
    );

    const res = await denyRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("QUEST_DENY_FORBIDDEN");
  });

  it("returns 400 when quest status is not COMPLETED", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: VALID_UUID,
            family_id: FAMILY_ID,
            status: "PENDING",
            assigned_to_id: null,
          },
          error: null,
        }),
      });

    const res = await denyRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("QUEST_NOT_DENIABLE");
  });

  it("returns 404 when quest does not exist", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

    const res = await denyRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(404);
  });

  it("returns 403 for cross-family denial", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: VALID_UUID,
            family_id: OTHER_FAMILY_ID,
            status: "COMPLETED",
            assigned_to_id: null,
          },
          error: null,
        }),
      });

    const res = await denyRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(403);
  });
});
