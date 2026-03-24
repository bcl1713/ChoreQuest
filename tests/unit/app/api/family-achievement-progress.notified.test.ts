const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

import { NextRequest } from "next/server";
import { PATCH as patchNotified } from "@/app/api/family-achievement-progress/[id]/notified/route";

function createRequest(auth = "Bearer token") {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (auth) headers["authorization"] = auth;
  return new NextRequest("http://localhost/test", { method: "PATCH", headers });
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
  }));
}

describe("PATCH /api/family-achievement-progress/[id]/notified", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 for unauthenticated request", async () => {
    const response = await patchNotified(createRequest(""), {
      params: Promise.resolve({ id: "prog-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when progress not found", async () => {
    authAs("HERO");
    mockServiceSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    }));

    const response = await patchNotified(createRequest(), {
      params: Promise.resolve({ id: "prog-not-found" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 403 when progress belongs to a different family", async () => {
    authAs("HERO", "family-001");
    mockServiceSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: "prog-1",
          family_id: "family-other",
          unlocked_at: "2024-01-15T12:00:00Z",
        },
        error: null,
      }),
    }));

    const response = await patchNotified(createRequest(), {
      params: Promise.resolve({ id: "prog-1" }),
    });
    expect(response.status).toBe(403);
  });

  it("returns 409 when the achievement progress row is not yet unlocked", async () => {
    authAs("HERO");
    mockServiceSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: "prog-1", family_id: "family-001", unlocked_at: null },
        error: null,
      }),
    }));

    const response = await patchNotified(createRequest(), {
      params: Promise.resolve({ id: "prog-1" }),
    });
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toMatch(/not been unlocked/i);
  });

  it("returns 200 when marking an unlocked achievement as notified", async () => {
    authAs("HERO");

    let serviceCallCount = 0;
    mockServiceSupabase.from.mockImplementation(() => {
      serviceCallCount++;
      if (serviceCallCount === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: "prog-1",
              family_id: "family-001",
              unlocked_at: "2024-01-15T12:00:00Z",
            },
            error: null,
          }),
        };
      }
      return {
        upsert: jest.fn().mockResolvedValue({ error: null }),
      };
    });

    const response = await patchNotified(createRequest(), {
      params: Promise.resolve({ id: "prog-1" }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
