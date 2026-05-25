const mockUpdateProgress = jest.fn().mockResolvedValue(undefined);
const mockFamilyUpdateProgress = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/achievement-progress-service", () => ({
  AchievementProgressService: jest
    .fn()
    .mockImplementation(() => ({ updateProgress: mockUpdateProgress })),
}));

jest.mock("@/lib/family-achievement-progress-service", () => ({
  FamilyAchievementProgressService: jest
    .fn()
    .mockImplementation(() => ({ updateProgress: mockFamilyUpdateProgress })),
}));

const mockServerSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockServerSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/reward-redemptions/[id]/approve/route";

const VALID_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const INVALID_ID = "not-a-uuid";
const FAMILY_ID = "fam-1";
const OTHER_FAMILY_ID = "fam-other";
const GM_USER_ID = "gm-user-1";
const REDEEMER_USER_ID = "hero-user-1";
const CHARACTER_ID = "char-1";

function makeRequest(auth: string | null = "Bearer token") {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (auth !== null) headers["authorization"] = auth;
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
      .mockResolvedValue({ data: { role, family_id: familyId }, error: null }),
  });
}

function makeServiceFromMock({
  redemption = {
    id: VALID_UUID,
    user_id: REDEEMER_USER_ID,
    status: "PENDING",
  } as object | null,
  redemptionError = null as object | null,
  redeemerFamilyId = FAMILY_ID as string | null,
  updatedRedemption = { id: VALID_UUID, status: "APPROVED" } as object | null,
  updateError = null as object | null,
} = {}) {
  mockServiceSupabase.from.mockImplementation((table: string) => {
    if (table === "reward_redemptions") {
      const fetchChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest
          .fn()
          .mockResolvedValue({ data: redemption, error: redemptionError }),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedRedemption,
          error: updateError,
        }),
      };
      // make update() return a chain that supports .eq().select().single()
      fetchChain.update = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedRedemption,
              error: updateError,
            }),
          }),
        }),
      });
      return fetchChain;
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

    if (table === "characters") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest
          .fn()
          .mockResolvedValue({ data: [{ id: CHARACTER_ID }], error: null }),
      };
    }

    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  });
}

describe("POST /api/reward-redemptions/[id]/approve", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 when a GUILD_MASTER approves a same-family redemption", async () => {
    setupServerAuth("GUILD_MASTER");
    makeServiceFromMock();

    const res = await POST(makeRequest(), params(VALID_UUID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await POST(makeRequest(null), params(VALID_UUID));
    expect(res.status).toBe(401);
  });

  it("returns 403 when requester is not a GUILD_MASTER", async () => {
    setupServerAuth("HERO");

    const res = await POST(makeRequest(), params(VALID_UUID));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("APPROVE_REDEMPTION_FORBIDDEN");
  });

  it("returns 400 when redemption ID is not a valid UUID", async () => {
    setupServerAuth("GUILD_MASTER");

    const res = await POST(makeRequest(), params(INVALID_ID));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("REDEMPTION_ID_INVALID");
  });

  it("returns 404 when redemption does not exist", async () => {
    setupServerAuth("GUILD_MASTER");
    makeServiceFromMock({ redemption: null });

    const res = await POST(makeRequest(), params(VALID_UUID));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("REDEMPTION_NOT_FOUND");
  });

  it("returns 403 when redemption belongs to a different family", async () => {
    setupServerAuth("GUILD_MASTER", FAMILY_ID);
    makeServiceFromMock({ redeemerFamilyId: OTHER_FAMILY_ID });

    const res = await POST(makeRequest(), params(VALID_UUID));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("APPROVE_REDEMPTION_FORBIDDEN");
  });

  it("returns 403 when redeemer profile is not found (cross-family guard)", async () => {
    setupServerAuth("GUILD_MASTER", FAMILY_ID);
    makeServiceFromMock({ redeemerFamilyId: null });

    const res = await POST(makeRequest(), params(VALID_UUID));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("APPROVE_REDEMPTION_FORBIDDEN");
  });

  it.each(["APPROVED", "DENIED"])(
    "returns 409 when redemption status is %s",
    async (status) => {
      setupServerAuth("GUILD_MASTER");
      makeServiceFromMock({
        redemption: { id: VALID_UUID, user_id: REDEEMER_USER_ID, status },
      });

      const res = await POST(makeRequest(), params(VALID_UUID));
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe("REDEMPTION_NOT_PENDING");
    },
  );

  it("skips family check when redemption has no user_id", async () => {
    setupServerAuth("GUILD_MASTER");
    makeServiceFromMock({
      redemption: { id: VALID_UUID, user_id: null, status: "PENDING" },
    });

    const res = await POST(makeRequest(), params(VALID_UUID));
    expect(res.status).toBe(200);
  });

  it("calls FamilyAchievementProgressService directly when redeemer has no character", async () => {
    setupServerAuth("GUILD_MASTER");
    mockServiceSupabase.from.mockImplementation((table: string) => {
      if (table === "reward_redemptions") {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: VALID_UUID,
              user_id: REDEEMER_USER_ID,
              status: "PENDING",
            },
            error: null,
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: VALID_UUID, status: "APPROVED" },
                  error: null,
                }),
              }),
            }),
          }),
        };
        return chain;
      }
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest
            .fn()
            .mockResolvedValue({ data: { family_id: FAMILY_ID }, error: null }),
        };
      }
      if (table === "characters") {
        // No character for this user
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const res = await POST(makeRequest(), params(VALID_UUID));
    expect(res.status).toBe(200);
    expect(mockUpdateProgress).not.toHaveBeenCalled();
    expect(mockFamilyUpdateProgress).toHaveBeenCalledWith(FAMILY_ID, {
      type: "REWARD_APPROVED",
    });
  });
});
