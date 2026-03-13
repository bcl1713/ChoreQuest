import { NextRequest } from "next/server";
import { ConflictError } from "@/lib/errors";

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
}));

jest.mock("@/lib/quest-instance-service", () => ({
  QuestInstanceService: jest.fn().mockImplementation(() => ({
    claimQuest: jest.fn(),
    approveQuest: jest.fn(),
  })),
}));

import { POST as claimQuestRoute } from "@/app/api/quests/[id]/claim/route";
import { POST as approveQuestRoute } from "@/app/api/quest-instances/[id]/approve/route";
import { POST as assignQuestRoute } from "@/app/api/quest-instances/[id]/assign/route";
import { POST as releaseQuestRoute } from "@/app/api/quests/[id]/release/route";
import { QuestInstanceService } from "@/lib/quest-instance-service";

const createRequest = (method = "POST", body?: unknown, auth = "Bearer token") =>
  new NextRequest("http://localhost/test", {
    method,
    headers: auth ? { authorization: auth, "content-type": "application/json" } : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const singleResult = (data: unknown, error: unknown = null) =>
  ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data, error }), maybeSingle: jest.fn().mockResolvedValue({ data, error }), limit: jest.fn().mockReturnThis() });

describe("error-handling quest routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("claim route returns auth error shape", async () => {
    const response = await claimQuestRoute(createRequest("POST", undefined, ""), {
      params: Promise.resolve({ id: "quest-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Missing or invalid authorization header",
      code: "AUTH_HEADER_INVALID",
    });
  });

  it("claim route returns conflict error shape from service", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from
      .mockImplementationOnce(() => singleResult({ family_id: "family-1", role: "HERO" }))
      .mockImplementationOnce(() => singleResult({ id: "quest-1", family_id: "family-1" }))
      .mockImplementationOnce(() => singleResult({ id: "char-1" }));
    (QuestInstanceService as jest.Mock).mockImplementation(() => ({
      claimQuest: jest.fn().mockRejectedValue(
        new ConflictError("Hero already has an active family quest", "ACTIVE_FAMILY_QUEST_EXISTS"),
      ),
    }));

    const response = await claimQuestRoute(createRequest(), {
      params: Promise.resolve({ id: "quest-1" }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Hero already has an active family quest",
      code: "ACTIVE_FAMILY_QUEST_EXISTS",
    });
  });

  it("approve route returns forbidden error shape", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementationOnce(() => singleResult({ role: "HERO", family_id: "family-1" }));

    const response = await approveQuestRoute(createRequest(), {
      params: Promise.resolve({ id: "quest-1" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Only Guild Masters can approve quests",
      code: "QUEST_APPROVE_FORBIDDEN",
    });
  });

  it("assign route returns validation error shape", async () => {
    const response = await assignQuestRoute(createRequest("POST", {}), {
      params: Promise.resolve({ id: "quest-1" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Character ID is required",
      code: "CHARACTER_ID_REQUIRED",
    });
  });

  it("release route returns auth error shape", async () => {
    const response = await releaseQuestRoute(createRequest("POST", undefined, ""), {
      params: Promise.resolve({ id: "quest-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Missing or invalid authorization header",
      code: "AUTH_HEADER_INVALID",
    });
  });
});
