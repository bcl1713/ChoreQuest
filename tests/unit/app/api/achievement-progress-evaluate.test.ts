/**
 * Tests for /api/achievement-progress/evaluate internal route (task 11.2)
 */
const mockUpdateProgress = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/achievement-progress-service", () => ({
  AchievementProgressService: jest
    .fn()
    .mockImplementation(() => ({ updateProgress: mockUpdateProgress })),
}));

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  createServiceSupabaseClient: jest.fn(() => mockSupabase),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/achievement-progress/evaluate/route";

const USER_ID = "user-001";
const CHAR_ID = "char-001";

function makeRequest(
  body: Record<string, unknown>,
  token: string | null = "valid-token",
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token !== null) {
    headers.Authorization = `Bearer ${token}`;
  }
  return new NextRequest("http://localhost/api/achievement-progress/evaluate", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function setupAuth(role = "GUILD_MASTER") {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "user_profiles") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: USER_ID, role, family_id: "fam-001" },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "characters") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: CHAR_ID },
              error: null,
            }),
          }),
        }),
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  });
}

describe("POST /api/achievement-progress/evaluate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 and calls updateProgress on valid REWARD_APPROVED request", async () => {
    setupAuth("GUILD_MASTER");

    const res = await POST(
      makeRequest({ eventType: "REWARD_APPROVED", userId: USER_ID }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUpdateProgress).toHaveBeenCalledWith(CHAR_ID, {
      type: "REWARD_APPROVED",
    });
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await POST(
      makeRequest({ eventType: "REWARD_APPROVED", userId: USER_ID }, null),
    );

    expect(res.status).toBe(401);
  });

  it("returns 400 when eventType is not REWARD_APPROVED", async () => {
    setupAuth();

    const res = await POST(
      makeRequest({ eventType: "QUEST_APPROVED", userId: USER_ID }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("UNSUPPORTED_EVENT_TYPE");
  });

  it("returns 400 when eventType is missing", async () => {
    setupAuth();

    const res = await POST(makeRequest({ userId: USER_ID }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when character is not found for user", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: USER_ID,
                  role: "GUILD_MASTER",
                  family_id: "fam-001",
                },
                error: null,
              }),
              // Used by cross-user family check (maybeSingle)
              maybeSingle: jest.fn().mockResolvedValue({
                data: { family_id: "fam-001" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "characters") {
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
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await POST(
      makeRequest({ eventType: "REWARD_APPROVED", userId: "no-char-user" }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("CHARACTER_NOT_FOUND");
  });

  it("returns 403 when a non-GUILD_MASTER targets another user", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: USER_ID, role: "MEMBER", family_id: "fam-001" },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await POST(
      makeRequest({ eventType: "REWARD_APPROVED", userId: "other-user" }),
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("ACHIEVEMENT_UPDATE_FORBIDDEN");
  });

  it("returns 403 when GUILD_MASTER targets a user from a different family", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: USER_ID,
                  role: "GUILD_MASTER",
                  family_id: "fam-001",
                },
                error: null,
              }),
              maybeSingle: jest.fn().mockResolvedValue({
                data: { family_id: "fam-999" },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await POST(
      makeRequest({
        eventType: "REWARD_APPROVED",
        userId: "other-family-user",
      }),
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("ACHIEVEMENT_UPDATE_FORBIDDEN");
  });

  it("returns 500 when updateProgress throws", async () => {
    setupAuth("GUILD_MASTER");
    mockUpdateProgress.mockRejectedValueOnce(new Error("DB failure"));

    const res = await POST(
      makeRequest({ eventType: "REWARD_APPROVED", userId: USER_ID }),
    );

    expect(res.status).toBe(500);
  });

  it("resolves to requester user when userId is omitted from body", async () => {
    setupAuth("GUILD_MASTER");

    const res = await POST(makeRequest({ eventType: "REWARD_APPROVED" }));

    expect(res.status).toBe(200);
    expect(mockUpdateProgress).toHaveBeenCalledWith(CHAR_ID, {
      type: "REWARD_APPROVED",
    });
  });
});
