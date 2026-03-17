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

import { POST as assignRoute } from "@/app/api/quest-instances/[id]/assign/route";
import { QuestInstanceService } from "@/lib/quest-instance-service";

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
// assign route
// ---------------------------------------------------------------------------

describe("POST /api/quest-instances/[id]/assign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with assigned quest for a valid GM request", async () => {
    setupAuth("GUILD_MASTER");
    const assignedQuest = { id: VALID_UUID, status: "PENDING" };
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce(
        singleResult({
          id: VALID_UUID,
          family_id: FAMILY_ID,
          quest_type: "FAMILY",
        }),
      );
    (QuestInstanceService as jest.Mock).mockImplementation(() => ({
      assignQuest: jest.fn().mockResolvedValue(assignedQuest),
    }));

    const res = await assignRoute(
      makeRequest("POST", { characterId: "char-1" }),
      params(VALID_UUID),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.quest).toEqual(assignedQuest);
  });

  it("returns 400 when characterId is missing from body", async () => {
    const res = await assignRoute(makeRequest("POST", {}), params(VALID_UUID));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("CHARACTER_ID_REQUIRED");
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await assignRoute(
      makeRequest("POST", { characterId: "char-1" }, null),
      params(VALID_UUID),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when requester is not a GUILD_MASTER", async () => {
    setupAuth("HERO");
    mockSupabase.from.mockReturnValueOnce(
      singleResult({ role: "HERO", family_id: FAMILY_ID }),
    );

    const res = await assignRoute(
      makeRequest("POST", { characterId: "char-1" }),
      params(VALID_UUID),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("QUEST_ASSIGN_FORBIDDEN");
  });

  it("returns 400 when quest type is not FAMILY", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce(
        singleResult({
          id: VALID_UUID,
          family_id: FAMILY_ID,
          quest_type: "INDIVIDUAL",
        }),
      );

    const res = await assignRoute(
      makeRequest("POST", { characterId: "char-1" }),
      params(VALID_UUID),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("QUEST_TYPE_INVALID");
  });

  it("returns 403 for cross-family assignment", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce(
        singleResult({
          id: VALID_UUID,
          family_id: OTHER_FAMILY_ID,
          quest_type: "FAMILY",
        }),
      );

    const res = await assignRoute(
      makeRequest("POST", { characterId: "char-1" }),
      params(VALID_UUID),
    );
    expect(res.status).toBe(403);
  });
});
