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
import {
  PATCH,
  DELETE,
} from "@/app/api/admin/achievement-categories/[id]/route";

function makeRequest(
  method: string,
  auth: string | null = "Bearer token",
  body?: Record<string, unknown>,
) {
  const url = new URL("http://localhost/api/admin/achievement-categories/id");
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (auth !== null) headers["authorization"] = auth;

  return new NextRequest(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function setupAuth(role: string = "GUILD_MASTER") {
  mockServerSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mockServerSupabase.from.mockImplementation((table: string) => {
    if (table === "user_profiles") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role, family_id: "fam-1" },
          error: null,
        }),
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  });
}

function setupServiceForPatch() {
  mockServiceSupabase.from.mockImplementation((table: string) => {
    if (table === "achievement_categories") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: "cat-1", name: "Adventurer" },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "cat-1", name: "Updated" },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    return { select: jest.fn().mockReturnThis() };
  });
}

describe("PATCH /api/admin/achievement-categories/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates a category and returns 200", async () => {
    setupAuth();
    setupServiceForPatch();

    const req = makeRequest("PATCH", "Bearer token", { name: "Updated" });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "cat-1" }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 403 when user is not Guild Master", async () => {
    setupAuth("HERO");

    const req = makeRequest("PATCH", "Bearer token", { name: "Updated" });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "cat-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when category does not exist", async () => {
    setupAuth();
    mockServiceSupabase.from.mockImplementation((table: string) => {
      if (table === "achievement_categories") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return { select: jest.fn().mockReturnThis() };
    });

    const req = makeRequest("PATCH", "Bearer token", { name: "Updated" });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 when name is empty string", async () => {
    setupAuth();
    setupServiceForPatch();

    const req = makeRequest("PATCH", "Bearer token", { name: "" });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "cat-1" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/admin/achievement-categories/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes a category with no achievements", async () => {
    setupAuth();
    mockServiceSupabase.from.mockImplementation((table: string) => {
      if (table === "achievement_categories") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: "cat-1" },
                error: null,
              }),
            }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === "achievements") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        };
      }
      return { select: jest.fn().mockReturnThis() };
    });

    const req = makeRequest("DELETE");
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "cat-1" }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 409 when category has achievements", async () => {
    setupAuth();
    mockServiceSupabase.from.mockImplementation((table: string) => {
      if (table === "achievement_categories") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: "cat-1" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "achievements") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
          }),
        };
      }
      return { select: jest.fn().mockReturnThis() };
    });

    const req = makeRequest("DELETE");
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "cat-1" }),
    });
    expect(res.status).toBe(409);
  });

  it("returns 403 when user is not Guild Master", async () => {
    setupAuth("HERO");

    const req = makeRequest("DELETE");
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "cat-1" }),
    });
    expect(res.status).toBe(403);
  });
});
