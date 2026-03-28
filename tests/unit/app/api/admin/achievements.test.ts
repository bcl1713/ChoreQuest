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
import { GET, POST } from "@/app/api/admin/achievements/route";

function makeRequest(
  method: string,
  auth: string | null = "Bearer token",
  body?: Record<string, unknown>,
) {
  const url = new URL("http://localhost/api/admin/achievements");
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

const MOCK_ACHIEVEMENTS = [
  {
    id: "ach-1",
    name: "First Quest",
    description: "Complete your first quest",
    icon: "sword",
    category_id: "cat-1",
    xp_reward: 50,
    gold_reward: 10,
    is_hidden: false,
    criteria_type: "quest_complete",
    criteria_config: {},
    family_id: "fam-1",
    achievement_categories: { name: "Adventurer" },
  },
];

const MOCK_CATEGORIES = [
  { id: "cat-1", name: "Adventurer" },
  { id: "cat-2", name: "Wealth" },
];

function setupServiceAchievements() {
  mockServiceSupabase.from.mockImplementation((table: string) => {
    if (table === "achievements") {
      return {
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: MOCK_ACHIEVEMENTS,
              error: null,
            }),
          }),
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: MOCK_ACHIEVEMENTS[0],
              error: null,
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "ach-new", ...MOCK_ACHIEVEMENTS[0] },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...MOCK_ACHIEVEMENTS[0], name: "Updated" },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "achievement_categories") {
      return {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: MOCK_CATEGORIES,
            error: null,
          }),
        }),
      };
    }
    return { select: jest.fn().mockReturnThis() };
  });
}

describe("GET /api/admin/achievements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with achievements and categories", async () => {
    setupAuth();
    setupServiceAchievements();

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.achievements).toBeDefined();
    expect(body.categories).toBeDefined();
  });

  it("returns 401 when authorization header missing", async () => {
    const res = await GET(makeRequest("GET", null));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not Guild Master", async () => {
    setupAuth("HERO");

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(403);
  });

  it("filters achievements to the requester's family and global achievements", async () => {
    setupAuth();
    let capturedOrArg: string | undefined;
    mockServiceSupabase.from.mockImplementation((table: string) => {
      if (table === "achievements") {
        return {
          select: jest.fn().mockReturnValue({
            or: jest.fn().mockImplementation((arg: string) => {
              capturedOrArg = arg;
              return {
                order: jest.fn().mockResolvedValue({
                  data: MOCK_ACHIEVEMENTS,
                  error: null,
                }),
              };
            }),
          }),
        };
      }
      if (table === "achievement_categories") {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: MOCK_CATEGORIES,
              error: null,
            }),
          }),
        };
      }
      return { select: jest.fn().mockReturnThis() };
    });

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    expect(capturedOrArg).toBe("family_id.eq.fam-1,family_id.is.null");
  });
});

describe("POST /api/admin/achievements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an achievement and returns 201", async () => {
    setupAuth();
    setupServiceAchievements();

    const res = await POST(
      makeRequest("POST", "Bearer token", {
        name: "New Achievement",
        description: "A test achievement",
        category_id: "cat-1",
        criteria_type: "quest_complete",
        criteria_config: { count: 1 },
      }),
    );
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.achievement).toBeDefined();
  });

  it("returns 400 when name is missing", async () => {
    setupAuth();
    setupServiceAchievements();

    const res = await POST(
      makeRequest("POST", "Bearer token", {
        category_id: "cat-1",
        criteria_type: "quest_complete",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when category_id is missing", async () => {
    setupAuth();
    setupServiceAchievements();

    const res = await POST(
      makeRequest("POST", "Bearer token", {
        name: "Test",
        criteria_type: "quest_complete",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when criteria_type is missing", async () => {
    setupAuth();
    setupServiceAchievements();

    const res = await POST(
      makeRequest("POST", "Bearer token", {
        name: "Test",
        category_id: "cat-1",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is not Guild Master", async () => {
    setupAuth("HERO");

    const res = await POST(
      makeRequest("POST", "Bearer token", {
        name: "Test",
        category_id: "cat-1",
        criteria_type: "quest_complete",
      }),
    );
    expect(res.status).toBe(403);
  });
});
