import {
  VALID_UUID,
  HERO_USER_ID,
  FAMILY_ID,
  OTHER_FAMILY_ID,
  makeRequest,
  params,
  singleResult,
  makeSetupAuth,
} from "../quest-instance-helpers";

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

const setupAuth = makeSetupAuth(mockSupabase.auth.getUser);

// ---------------------------------------------------------------------------
// deny route
// ---------------------------------------------------------------------------

describe("POST /api/quest-instances/[id]/deny", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 when GM denies a COMPLETED quest", async () => {
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
            status: "COMPLETED",
            assigned_to_id: HERO_USER_ID,
          },
          error: null,
        }),
      })
      .mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

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
