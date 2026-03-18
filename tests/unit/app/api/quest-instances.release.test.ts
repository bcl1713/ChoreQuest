import {
  VALID_UUID,
  GM_USER_ID,
  HERO_USER_ID,
  FAMILY_ID,
  OTHER_FAMILY_ID,
  makeRequest,
  params,
  singleResult,
  makeSetupAuth,
} from "./quest-instance-helpers";

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

import { POST as releaseRoute } from "@/app/api/quest-instances/[id]/release/route";
import { QuestInstanceService } from "@/lib/quest-instance-service";

const setupAuth = makeSetupAuth(mockSupabase.auth.getUser);

// ---------------------------------------------------------------------------
// release route
// ---------------------------------------------------------------------------

describe("POST /api/quest-instances/[id]/release", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeQuestResult = (overrides = {}) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: {
        id: VALID_UUID,
        family_id: FAMILY_ID,
        status: "PENDING",
        assigned_to_id: GM_USER_ID,
        quest_type: "INDIVIDUAL",
        volunteered_by: null,
        ...overrides,
      },
      error: null,
    }),
  });

  it("returns 200 when GM releases a quest in their family", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({
          role: "GUILD_MASTER",
          family_id: FAMILY_ID,
          id: GM_USER_ID,
        }),
      )
      .mockReturnValueOnce(makeQuestResult({ assigned_to_id: null }))
      .mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

    const res = await releaseRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(200);
  });

  it("returns 200 when assigned hero releases their own quest", async () => {
    setupAuth("HERO");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "HERO", family_id: FAMILY_ID, id: HERO_USER_ID }),
      )
      .mockReturnValueOnce(makeQuestResult({ assigned_to_id: HERO_USER_ID }))
      .mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

    const res = await releaseRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(200);
  });

  it("returns 403 when unauthorized user tries to release", async () => {
    setupAuth("HERO");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "HERO", family_id: FAMILY_ID, id: HERO_USER_ID }),
      )
      .mockReturnValueOnce(
        makeQuestResult({
          assigned_to_id: "other-user",
          volunteered_by: null,
        }),
      );

    const res = await releaseRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("QUEST_RELEASE_FORBIDDEN");
  });

  it("uses QuestInstanceService.releaseQuest for FAMILY quest type", async () => {
    setupAuth("GUILD_MASTER");
    const releaseQuestMock = jest.fn().mockResolvedValue(undefined);
    (QuestInstanceService as jest.Mock).mockImplementation(() => ({
      releaseQuest: releaseQuestMock,
    }));
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({
          role: "GUILD_MASTER",
          family_id: FAMILY_ID,
          id: GM_USER_ID,
        }),
      )
      .mockReturnValueOnce(
        makeQuestResult({ quest_type: "FAMILY", volunteered_by: "char-1" }),
      );

    await releaseRoute(makeRequest("POST"), params(VALID_UUID));
    expect(releaseQuestMock).toHaveBeenCalledWith(VALID_UUID, "char-1");
  });

  it("updates directly for INDIVIDUAL quest type (no service call)", async () => {
    setupAuth("HERO");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({ role: "HERO", family_id: FAMILY_ID, id: HERO_USER_ID }),
      )
      .mockReturnValueOnce(
        makeQuestResult({
          quest_type: "INDIVIDUAL",
          assigned_to_id: HERO_USER_ID,
        }),
      );
    const updateEqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn().mockReturnValue({ eq: updateEqMock });
    mockSupabase.from.mockReturnValueOnce({ update: updateMock });

    const res = await releaseRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ assigned_to_id: null, status: "AVAILABLE" }),
    );
  });

  it("returns 403 when GM releases quest from another family", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({
          role: "GUILD_MASTER",
          family_id: FAMILY_ID,
          id: GM_USER_ID,
        }),
      )
      .mockReturnValueOnce(makeQuestResult({ family_id: OTHER_FAMILY_ID }));

    const res = await releaseRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(403);
  });

  it("returns 404 when quest does not exist", async () => {
    setupAuth("GUILD_MASTER");
    mockSupabase.from
      .mockReturnValueOnce(
        singleResult({
          role: "GUILD_MASTER",
          family_id: FAMILY_ID,
          id: GM_USER_ID,
        }),
      )
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

    const res = await releaseRoute(makeRequest("POST"), params(VALID_UUID));
    expect(res.status).toBe(404);
  });
});
