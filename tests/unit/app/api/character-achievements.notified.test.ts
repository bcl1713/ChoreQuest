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
import { PATCH } from "@/app/api/character-achievements/[id]/notified/route";

const VALID_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function makeRequest(auth: string | null = "Bearer token") {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (auth !== null) headers["authorization"] = auth;
  return new NextRequest("http://localhost/test", {
    method: "PATCH",
    headers,
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

function setupAuth() {
  mockServerSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mockServerSupabase.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { role: "HERO", family_id: "fam-1" },
      error: null,
    }),
  });
}

function setupServiceRecord(
  exists: boolean,
  familyId: string | null = "fam-1",
) {
  const maybeSingleResult = exists
    ? {
        data: {
          id: VALID_UUID,
          characters: familyId ? { family_id: familyId } : null,
        },
        error: null,
      }
    : { data: null, error: null };

  const updateChain = {
    eq: jest.fn().mockResolvedValue({ error: null }),
  };

  mockServiceSupabase.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(maybeSingleResult),
    update: jest.fn().mockReturnValue(updateChain),
  });
}

describe("PATCH /api/character-achievements/[id]/notified", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 and marks notified when authenticated and record exists", async () => {
    setupAuth();
    setupServiceRecord(true);

    const res = await PATCH(makeRequest(), params(VALID_UUID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 401 when no Authorization header is present", async () => {
    const res = await PATCH(makeRequest(null), params(VALID_UUID));
    expect(res.status).toBe(401);
  });

  it("returns 401 when auth token is invalid", async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });
    // No profile fetch needed since auth fails first
    mockServerSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const res = await PATCH(makeRequest(), params(VALID_UUID));
    expect(res.status).toBe(401);
  });

  it("returns 404 when the character achievement record does not exist", async () => {
    setupAuth();
    setupServiceRecord(false);

    const res = await PATCH(makeRequest(), params("non-existent-id"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it("returns 403 when the character achievement belongs to a different family", async () => {
    setupAuth(); // requesterProfile.family_id = "fam-1"
    setupServiceRecord(true, "fam-other");

    const res = await PATCH(makeRequest(), params(VALID_UUID));
    expect(res.status).toBe(403);
  });

  it("returns 403 when the character achievement has no associated character", async () => {
    setupAuth();
    setupServiceRecord(true, null);

    const res = await PATCH(makeRequest(), params(VALID_UUID));
    expect(res.status).toBe(403);
  });
});
