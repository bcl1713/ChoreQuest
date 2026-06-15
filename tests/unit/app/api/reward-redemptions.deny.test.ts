const mockServerSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockServerSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/reward-redemptions/[id]/deny/route";

const VALID_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const INVALID_ID = "not-a-uuid";
const FAMILY_ID = "fam-1";
const OTHER_FAMILY_ID = "fam-other";
const GM_USER_ID = "gm-user-1";
const REDEEMER_USER_ID = "hero-user-1";

function makeRequest(auth: string | null = "Bearer token") {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (auth !== null) headers.authorization = auth;
  return new NextRequest("http://localhost/test", { method: "POST", headers });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

function setupServerAuth(role: "GUILD_MASTER" | "HERO", familyId = FAMILY_ID) {
  mockServerSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: GM_USER_ID } },
    error: null,
  });
  mockServerSupabase.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest
      .fn()
      .mockResolvedValue({ data: { id: GM_USER_ID, role, family_id: familyId }, error: null }),
  });
}

function setupServiceMocks({
  redemption = {
    id: VALID_UUID,
    user_id: REDEEMER_USER_ID,
    status: "PENDING",
    cost: 50,
  } as object | null,
  redemptionError = null as object | null,
  redeemerFamilyId = FAMILY_ID as string | null,
  rpcData = [{ id: VALID_UUID, status: "DENIED" }] as object[] | null,
  rpcError = null as { message: string } | null,
} = {}) {
  mockServiceSupabase.from.mockImplementation((table: string) => {
    if (table === "reward_redemptions") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest
          .fn()
          .mockResolvedValue({ data: redemption, error: redemptionError }),
      };
    }

    if (table === "user_profiles") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data:
            redeemerFamilyId !== null ? { family_id: redeemerFamilyId } : null,
          error: null,
        }),
      };
    }

    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  });
  mockServiceSupabase.rpc.mockResolvedValue({ data: rpcData, error: rpcError });
}

describe("POST /api/reward-redemptions/[id]/deny", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 and calls the atomic deny/refund RPC for same-family Guild Masters", async () => {
    setupServerAuth("GUILD_MASTER");
    setupServiceMocks();

    const res = await POST(makeRequest(), params(VALID_UUID));

    expect(res.status).toBe(200);
    expect(mockServiceSupabase.rpc).toHaveBeenCalledWith(
      "fn_deny_reward_redemption",
      {
        p_redemption_id: VALID_UUID,
        p_user_id: REDEEMER_USER_ID,
        p_amount: 50,
        p_denied_by: GM_USER_ID,
      },
    );
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.redemption.status).toBe("DENIED");
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await POST(makeRequest(null), params(VALID_UUID));
    expect(res.status).toBe(401);
  });

  it("returns 403 when requester is not a Guild Master", async () => {
    setupServerAuth("HERO");

    const res = await POST(makeRequest(), params(VALID_UUID));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("DENY_REDEMPTION_FORBIDDEN");
  });

  it("returns 400 when redemption ID is invalid", async () => {
    setupServerAuth("GUILD_MASTER");

    const res = await POST(makeRequest(), params(INVALID_ID));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("REDEMPTION_ID_INVALID");
  });

  it("returns 404 when redemption does not exist", async () => {
    setupServerAuth("GUILD_MASTER");
    setupServiceMocks({ redemption: null });

    const res = await POST(makeRequest(), params(VALID_UUID));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("REDEMPTION_NOT_FOUND");
  });

  it("returns 403 when redemption belongs to another family", async () => {
    setupServerAuth("GUILD_MASTER", FAMILY_ID);
    setupServiceMocks({ redeemerFamilyId: OTHER_FAMILY_ID });

    const res = await POST(makeRequest(), params(VALID_UUID));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("DENY_REDEMPTION_FORBIDDEN");
  });

  it("returns 409 when redemption is not pending", async () => {
    setupServerAuth("GUILD_MASTER");
    setupServiceMocks({
      redemption: {
        id: VALID_UUID,
        user_id: REDEEMER_USER_ID,
        status: "APPROVED",
        cost: 50,
      },
    });

    const res = await POST(makeRequest(), params(VALID_UUID));

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("REDEMPTION_NOT_PENDING");
  });
});
