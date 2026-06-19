import {
  VALID_UUID,
  INVALID_ID,
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

import { POST as approveRoute } from "@/app/api/quest-instances/[id]/approve/route";
import { QuestInstanceService } from "@/lib/quest-instance-service";

const setupAuth = makeSetupAuth(mockSupabase.auth.getUser);

// ---------------------------------------------------------------------------
// approve route
// ---------------------------------------------------------------------------

describe("POST /api/quest-instances/[id]/approve", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with approved quest for a valid GM request", async () => {
    setupAuth("GUILD_MASTER");
    const approvedQuest = { id: VALID_UUID, status: "APPROVED" };
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce(
        singleResult({ id: VALID_UUID, family_id: FAMILY_ID }),
      );
    (QuestInstanceService as jest.Mock).mockImplementation(() => ({
      approveQuest: jest.fn().mockResolvedValue(approvedQuest),
    }));

    const res = await approveRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.quest).toEqual(approvedQuest);
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await approveRoute(
      makeRequest("POST", undefined, null),
      params(VALID_UUID),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("AUTH_HEADER_INVALID");
  });

  it("returns 403 when requester is not a GUILD_MASTER", async () => {
    setupAuth("HERO");
    mockSupabase.from.mockReturnValueOnce(
      singleResult({ role: "HERO", family_id: FAMILY_ID }),
    );

    const res = await approveRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("QUEST_APPROVE_FORBIDDEN");
  });

  it("returns 400 when quest ID is not a valid UUID", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from.mockReturnValueOnce(
      singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
    );

    const res = await approveRoute(makeRequest("POST"), params(INVALID_ID));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("QUEST_ID_INVALID");
  });

  it("returns 404 when quest does not exist", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce(singleResult(null));

    const res = await approveRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("QUEST_NOT_FOUND");
  });

  it("returns 403 when quest belongs to a different family", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "GUILD_MASTER", family_id: FAMILY_ID }),
      )
      .mockReturnValueOnce(
        singleResult({ id: VALID_UUID, family_id: OTHER_FAMILY_ID }),
      );

    const res = await approveRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(403);
  });
});
