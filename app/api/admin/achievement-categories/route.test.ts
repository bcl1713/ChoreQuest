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
import { GET, POST } from "./route";

function makeRequest(
  method: string,
  auth: string | null = "Bearer token",
  body?: Record<string, unknown>,
) {
  const url = new URL("http://localhost/api/admin/achievement-categories");
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

const MOCK_CATEGORIES = [
  {
    id: "cat-1",
    name: "Adventurer",
    description: "Questing achievements",
    icon: "sword",
    display_order: 1,
    achievements: [{ count: 1 }],
  },
  {
    id: "cat-2",
    name: "Wealth",
    description: "Gold achievements",
    icon: "coins",
    display_order: 2,
    achievements: [{ count: 0 }],
  },
];

function setupServiceCategories(categories = MOCK_CATEGORIES) {
  const orderFn = jest.fn().mockResolvedValue({
    data: categories,
    error: null,
  });

  mockServiceSupabase.from.mockImplementation((table: string) => {
    if (table === "achievement_categories") {
      return {
        select: jest.fn().mockReturnValue({
          order: orderFn,
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "cat-new", name: "New Category", display_order: 3 },
              error: null,
            }),
          }),
        }),
      };
    }
    return { select: jest.fn().mockReturnThis() };
  });
}

describe("GET /api/admin/achievement-categories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with categories and achievement counts", async () => {
    setupAuth();
    setupServiceCategories();

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.categories).toBeDefined();
    expect(Array.isArray(body.categories)).toBe(true);
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
});

describe("POST /api/admin/achievement-categories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a category and returns 201", async () => {
    setupAuth();
    setupServiceCategories();

    const res = await POST(
      makeRequest("POST", "Bearer token", {
        name: "New Category",
        description: "A test category",
        icon: "star",
        display_order: 3,
      }),
    );
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.category).toBeDefined();
  });

  it("returns 400 when name is missing", async () => {
    setupAuth();
    setupServiceCategories();

    const res = await POST(
      makeRequest("POST", "Bearer token", {
        description: "No name provided",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is not Guild Master", async () => {
    setupAuth("HERO");

    const res = await POST(
      makeRequest("POST", "Bearer token", { name: "Test" }),
    );
    expect(res.status).toBe(403);
  });
});
