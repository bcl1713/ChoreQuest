import {
  VALID_UUID,
  FAMILY_ID,
  OTHER_FAMILY_ID,
  makeRequest,
  params,
  singleResult,
  makeSetupAuth,
} from "../quest-instance-helpers";

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
}));

jest.mock("@/lib/quest-instance-service", () => ({
  QuestInstanceService: jest.fn().mockImplementation(() => ({
    approveQuest: jest.fn(),
    assignQuest: jest.fn(),
    releaseQuest: jest.fn(),
  })),
}));

import { POST as assignRoute } from "@/app/api/quest-instances/[id]/assign/route";
import { QuestInstanceService } from "@/lib/quest-instance-service";

const setupAuth = makeSetupAuth(mockSupabase.auth.getUser);

// ---------------------------------------------------------------------------
// assign route
// ---------------------------------------------------------------------------

describe("POST /api/quest-instances/[id]/assign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with assigned quest for a valid GM request", async () => {
    setupAuth("GUILD_MASTER");
    const assignedQuest = { id: VALID_UUID, status: "PENDING" };
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce(
        singleResult({
          id: VALID_UUID,
          family_id: FAMILY_ID,
          quest_type: "FAMILY",
        }),
      );
    (QuestInstanceService as jest.Mock).mockImplementation(() => ({
      assignQuest: jest.fn().mockResolvedValue(assignedQuest),
    }));

    const res = await assignRoute(
      makeRequest("POST", { characterId: "char-1" }),
      params(VALID_UUID),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.quest).toEqual(assignedQuest);
  });

  it("returns 400 when characterId is missing from body", async () => {
    const res = await assignRoute(makeRequest("POST", {}), params(VALID_UUID));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("CHARACTER_ID_REQUIRED");
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await assignRoute(
      makeRequest("POST", { characterId: "char-1" }, null),
      params(VALID_UUID),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when requester is not a GUILD_MASTER", async () => {
    setupAuth("HERO");
    mockSupabase.from.mockReturnValueOnce(
      singleResult({ role: "HERO", family_id: FAMILY_ID }),
    );

    const res = await assignRoute(
      makeRequest("POST", { characterId: "char-1" }),
      params(VALID_UUID),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("QUEST_ASSIGN_FORBIDDEN");
  });

  it("returns 400 when quest type is not FAMILY", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce(
        singleResult({
          id: VALID_UUID,
          family_id: FAMILY_ID,
          quest_type: "INDIVIDUAL",
        }),
      );

    const res = await assignRoute(
      makeRequest("POST", { characterId: "char-1" }),
      params(VALID_UUID),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("QUEST_TYPE_INVALID");
  });

  it("returns 403 for cross-family assignment", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce(
        singleResult({
          id: VALID_UUID,
          family_id: OTHER_FAMILY_ID,
          quest_type: "FAMILY",
        }),
      );

    const res = await assignRoute(
      makeRequest("POST", { characterId: "char-1" }),
      params(VALID_UUID),
    );
    expect(res.status).toBe(403);
  });
});
