const mockServerSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  rpc: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockServerSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/reward-redemptions/route";

const USER_ID = "33333333-3333-4333-8333-333333333333";
const REWARD_ID = "55555555-5555-4555-8555-555555555555";

function makeRequest(body: object, auth: string | null = "Bearer token") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (auth) headers.authorization = auth;
  return new NextRequest("http://localhost/api/reward-redemptions", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function setupAuth() {
  mockServerSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });
  mockServerSupabase.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: USER_ID, role: "HERO", family_id: "fam-1" },
      error: null,
    }),
  });
}

describe("POST /api/reward-redemptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redeems through a server-side DB RPC instead of accepting cached client gold", async () => {
    setupAuth();
    const redemption = { id: "redemption-1", reward_id: REWARD_ID, user_id: USER_ID };
    mockServiceSupabase.rpc.mockResolvedValue({ data: [redemption], error: null });

    const res = await POST(
      makeRequest({ rewardId: REWARD_ID, cachedGold: 123, cost: 100 }),
    );

    expect(res.status).toBe(201);
    expect(mockServiceSupabase.rpc).toHaveBeenCalledWith("fn_redeem_reward", {
      p_user_id: USER_ID,
      p_reward_id: REWARD_ID,
    });
    const body = await res.json();
    expect(body.redemption).toEqual(redemption);
  });

  it("maps insufficient server-side gold to a conflict response", async () => {
    setupAuth();
    mockServiceSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: "INSUFFICIENT_GOLD" },
    });

    const res = await POST(makeRequest({ rewardId: REWARD_ID }));

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("INSUFFICIENT_GOLD");
  });
});
