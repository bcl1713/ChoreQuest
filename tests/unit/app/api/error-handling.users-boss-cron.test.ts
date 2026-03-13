import { NextRequest } from "next/server";

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  from: jest.fn(),
};

const mockGenerateRecurringQuests = jest.fn();
const mockExpireQuests = jest.fn();
process.env.CRON_SECRET = "cron-secret";

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

jest.mock("@/lib/recurring-quest-generator", () => ({
  generateRecurringQuests: (...args: unknown[]) => mockGenerateRecurringQuests(...args),
  expireQuests: (...args: unknown[]) => mockExpireQuests(...args),
}));

import { POST as promoteRoute } from "@/app/api/users/[userId]/promote/route";
import { POST as demoteRoute } from "@/app/api/users/[userId]/demote/route";
import { POST as bossQuestRoute } from "@/app/api/boss-quests/route";
import { POST as generateQuestsRoute } from "@/app/api/cron/generate-quests/route";
import { POST as expireQuestsRoute } from "@/app/api/cron/expire-quests/route";

const createRequest = (
  url: string,
  method = "POST",
  body?: unknown,
  auth = "Bearer token",
) =>
  new NextRequest(url, {
    method,
    headers: auth ? { authorization: auth, "content-type": "application/json" } : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const singleResult = (data: unknown, error: unknown = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data, error }),
  maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
});

describe("error-handling user, boss, and cron routes", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  it("promote route returns auth helper payload", async () => {
    const response = await promoteRoute(
      createRequest("http://localhost/api/users/user-2/promote", "POST", undefined, ""),
      { params: Promise.resolve({ userId: "user-2" }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Missing or invalid authorization header",
      code: "AUTH_HEADER_INVALID",
    });
  });

  it("demote route returns validation payload for self-demotion", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation(() =>
      singleResult({ role: "GUILD_MASTER", family_id: "family-1" }),
    );

    const response = await demoteRoute(
      createRequest("http://localhost/api/users/user-1/demote"),
      { params: Promise.resolve({ userId: "user-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Cannot demote yourself",
      code: "SELF_DEMOTION_FORBIDDEN",
    });
  });

  it("boss quest route returns forbidden payload for non-GM", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation(() =>
      singleResult({ role: "HERO", family_id: "family-1" }),
    );

    const response = await bossQuestRoute(
      createRequest("http://localhost/api/boss-quests", "POST", {
        name: "Dragon",
        description: "Big dragon",
        reward_gold: 10,
        reward_xp: 20,
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Only Guild Masters can create boss quests",
      code: "BOSS_QUEST_CREATE_FORBIDDEN",
    });
  });

  it("generate cron route returns standardized auth payload", async () => {
    const response = await generateQuestsRoute(
      createRequest("http://localhost/api/cron/generate-quests", "POST", undefined, "Bearer wrong"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
      code: "CRON_UNAUTHORIZED",
    });
  });

  it("expire cron route returns success payload on success", async () => {
    mockExpireQuests.mockResolvedValue({
      success: true,
      expired: 3,
      streaksBroken: 1,
      errors: [],
    });

    const response = await expireQuestsRoute(
      createRequest(
        "http://localhost/api/cron/expire-quests",
        "POST",
        undefined,
        "Bearer cron-secret",
      ),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.expired).toBe(3);
    expect(json.duration).toEqual(expect.any(Number));
  });
});
