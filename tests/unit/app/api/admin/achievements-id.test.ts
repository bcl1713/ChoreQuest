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
import { PATCH } from "@/app/api/admin/achievements/[id]/route";

function makeRequest(
  method: string,
  auth: string | null = "Bearer token",
  body?: Record<string, unknown>,
) {
  const url = new URL("http://localhost/api/admin/achievements/id");
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

function setupAuth(role: string = "GUILD_MASTER", familyId: string = "fam-1") {
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
          data: { role, family_id: familyId },
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

function setupServiceForPatch(
  achievementFamilyId: string = "fam-1",
  mockDeleteCharAchievements?: jest.Mock,
) {
  const deleteMock =
    mockDeleteCharAchievements ?? jest.fn().mockResolvedValue({ error: null });
  mockServiceSupabase.from.mockImplementation((table: string) => {
    if (table === "achievements") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: "ach-1",
                name: "First Quest",
                family_id: achievementFamilyId,
              },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "ach-1", name: "Updated" },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "character_achievements") {
      return {
        delete: jest.fn().mockReturnValue({
          eq: deleteMock,
        }),
      };
    }
    return { select: jest.fn().mockReturnThis() };
  });
}

describe("PATCH /api/admin/achievements/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates an achievement and returns 200", async () => {
    setupAuth();
    setupServiceForPatch();

    const req = makeRequest("PATCH", "Bearer token", { name: "Updated" });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "ach-1" }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 403 when user is not Guild Master", async () => {
    setupAuth("HERO");

    const req = makeRequest("PATCH", "Bearer token", { name: "Updated" });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "ach-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 403 when achievement belongs to a different family", async () => {
    setupAuth("GUILD_MASTER", "fam-1");
    setupServiceForPatch("other-fam");

    const req = makeRequest("PATCH", "Bearer token", { name: "Updated" });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "ach-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when achievement does not exist", async () => {
    setupAuth();
    mockServiceSupabase.from.mockImplementation((table: string) => {
      if (table === "achievements") {
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

  it("updates hidden flag successfully", async () => {
    setupAuth();
    setupServiceForPatch();

    const req = makeRequest("PATCH", "Bearer token", { is_hidden: true });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "ach-1" }),
    });
    expect(res.status).toBe(200);
  });

  it("deletes character_achievements rows when criteria_type changes", async () => {
    setupAuth();
    const deleteEq = jest.fn().mockResolvedValue({ error: null });
    setupServiceForPatch("fam-1", deleteEq);

    const req = makeRequest("PATCH", "Bearer token", {
      criteria_type: "chore_complete",
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "ach-1" }),
    });
    expect(res.status).toBe(200);
    expect(deleteEq).toHaveBeenCalledWith("achievement_id", "ach-1");
  });

  it("deletes character_achievements rows when criteria_config changes", async () => {
    setupAuth();
    const deleteEq = jest.fn().mockResolvedValue({ error: null });
    setupServiceForPatch("fam-1", deleteEq);

    const req = makeRequest("PATCH", "Bearer token", {
      criteria_config: { count: 5 },
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "ach-1" }),
    });
    expect(res.status).toBe(200);
    expect(deleteEq).toHaveBeenCalledWith("achievement_id", "ach-1");
  });

  it("does not delete character_achievements rows when only non-criteria fields change", async () => {
    setupAuth();
    const deleteEq = jest.fn().mockResolvedValue({ error: null });
    setupServiceForPatch("fam-1", deleteEq);

    const req = makeRequest("PATCH", "Bearer token", {
      name: "New Name",
      is_hidden: true,
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "ach-1" }),
    });
    expect(res.status).toBe(200);
    expect(deleteEq).not.toHaveBeenCalled();
  });
});
