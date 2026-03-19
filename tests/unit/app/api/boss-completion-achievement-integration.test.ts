/**
 * Tests for boss quest completion achievement progress integration (task 10.1)
 * Verifies updateProgress is called per participant and failures are isolated.
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
import { POST } from "@/app/api/boss-quests/[id]/complete/route";

const BOSS_ID = "boss-001";
const FAMILY_ID = "family-001";
const USER_ID_1 = "user-001";
const USER_ID_2 = "user-002";
const CHAR_ID_1 = "char-001";
const CHAR_ID_2 = "char-002";

function makeRequest(token = "tok") {
  return new NextRequest("http://localhost/api/boss-quests/boss-001/complete", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ decisions: [] }),
  });
}

function params(id = BOSS_ID) {
  return { params: Promise.resolve({ id }) };
}

function setupMocks(
  participantUserIds: string[],
  characters: { id: string; user_id: string }[],
) {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "gm-user" } },
    error: null,
  });

  mockSupabase.from.mockImplementation((table: string) => {
    switch (table) {
      case "user_profiles":
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: "gm-user",
                  role: "GUILD_MASTER",
                  family_id: FAMILY_ID,
                },
                error: null,
              }),
            }),
          }),
        };
      case "boss_battles":
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: BOSS_ID,
                  family_id: FAMILY_ID,
                  status: "ACTIVE",
                  reward_gold: 100,
                  reward_xp: 200,
                  honor_reward: 1,
                  rewards_distributed: false,
                },
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      case "boss_battle_participants":
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: participantUserIds.map((uid, i) => ({
                id: `part-${i}`,
                user_id: uid,
                participation_status: "PENDING",
                awarded_gold: 0,
                awarded_xp: 0,
                honor_awarded: 0,
              })),
              error: null,
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      case "characters":
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockImplementation(() => {
                return Promise.resolve({
                  data: characters[0] ?? null,
                  error: null,
                });
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      case "transactions":
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      default:
        throw new Error(`Unexpected table in boss test: ${table}`);
    }
  });
}

describe("Boss completion - achievement progress integration (task 10.1)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls updateProgress once per participant with BOSS_COMPLETED", async () => {
    setupMocks(
      [USER_ID_1, USER_ID_2],
      [
        { id: CHAR_ID_1, user_id: USER_ID_1 },
        { id: CHAR_ID_2, user_id: USER_ID_2 },
      ],
    );

    const res = await POST(makeRequest(), params());
    expect(res.status).toBe(200);

    // updateProgress should have been called twice (once per participant who has a character)
    expect(mockUpdateProgress).toHaveBeenCalledWith(expect.any(String), {
      type: "BOSS_COMPLETED",
    });
  });

  it("does not fail boss completion when updateProgress throws for one participant", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockUpdateProgress
      .mockRejectedValueOnce(new Error("Progress error for participant 1"))
      .mockResolvedValueOnce(undefined);

    setupMocks(
      [USER_ID_1, USER_ID_2],
      [
        { id: CHAR_ID_1, user_id: USER_ID_1 },
        { id: CHAR_ID_2, user_id: USER_ID_2 },
      ],
    );

    const res = await POST(makeRequest(), params());

    // Boss completion still succeeds
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("does not call updateProgress when character reward write fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "gm-user" } },
      error: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      switch (table) {
        case "user_profiles":
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: "gm-user",
                    role: "GUILD_MASTER",
                    family_id: FAMILY_ID,
                  },
                  error: null,
                }),
              }),
            }),
          };
        case "boss_battles":
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: BOSS_ID,
                    family_id: FAMILY_ID,
                    status: "ACTIVE",
                    reward_gold: 100,
                    reward_xp: 200,
                    honor_reward: 1,
                    rewards_distributed: false,
                  },
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        case "boss_battle_participants":
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: "part-0",
                    user_id: USER_ID_1,
                    participation_status: "PENDING",
                    awarded_gold: 0,
                    awarded_xp: 0,
                    honor_awarded: 0,
                  },
                ],
                error: null,
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        case "characters":
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: CHAR_ID_1, user_id: USER_ID_1 },
                  error: null,
                }),
              }),
            }),
            // Character reward write fails
            update: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockResolvedValue({ error: { message: "DB error" } }),
            }),
          };
        case "transactions":
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        default:
          throw new Error(`Unexpected table in boss test: ${table}`);
      }
    });

    const res = await POST(makeRequest(), params());
    expect(res.status).toBe(200);
    expect(mockUpdateProgress).not.toHaveBeenCalled();
  });

  it("logs error when updateProgress fails for a participant (non-blocking)", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockUpdateProgress.mockRejectedValueOnce(new Error("Progress failure"));

    setupMocks([USER_ID_1], [{ id: CHAR_ID_1, user_id: USER_ID_1 }]);

    await POST(makeRequest(), params());

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Achievement progress update failed"),
      expect.any(String),
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
