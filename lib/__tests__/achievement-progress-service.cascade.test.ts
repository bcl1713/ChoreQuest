/**
 * Tests for cascade fix (P1: revert, P2: persist, P3: xp_earned evaluation)
 * Validates that the cascade logic doesn't break existing tests.
 */

import { AchievementProgressService } from "../achievement-progress-service";
import {
  makeReadClient,
  makeDataResult,
} from "./achievement-progress-service.fixtures";
import type { MockChain } from "./achievement-progress-service.fixtures";
import { makeWriteMocks, CHAR_ID, USER_ID } from "./unlock-evaluation-fixtures";

const mockWriteClient = { from: jest.fn(), rpc: jest.fn() };
jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

const QUEST = {
  id: "ach-quest",
  criteria_type: "quest_complete",
  criteria_config: { threshold: 5 },
  xp_reward: 60,
  gold_reward: 0,
};

const LEVEL = {
  id: "ach-level",
  criteria_type: "level_reached",
  criteria_config: { threshold: 2 },
  xp_reward: 0,
  gold_reward: 0,
};

function makeQuestChain(count: number): MockChain {
  return {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ count, error: null }),
      }),
    }),
  };
}

function makeCharChain(stats: { xp: number; gold: number; level: number }) {
  let n = 0;
  return {
    select: jest.fn().mockImplementation(() => {
      n++;
      return {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: n === 1 ? { user_id: USER_ID, user_profiles: null } : stats,
            error: null,
          }),
        }),
      };
    }),
  };
}

describe("AchievementProgressService - cascade integration", () => {
  afterEach(() => jest.clearAllMocks());

  it("handles level-up cascade without error", async () => {
    const write = makeWriteMocks({
      unlockedIds: [QUEST.id],
      rpcReturn: { xp: 100, gold: 0, level: 1 },
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

    write.selectAfterIs
      .mockResolvedValueOnce({
        data: [{ achievement_id: QUEST.id }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ achievement_id: LEVEL.id }],
        error: null,
      });

    let n = 0;
    const charAchChain = {
      select: jest.fn().mockImplementation(() => {
        n++;
        if (n === 1) {
          return {
            eq: jest.fn().mockResolvedValue({
              data: [
                { achievement_id: QUEST.id },
                { achievement_id: LEVEL.id },
              ],
              error: null,
            }),
          };
        }
        return {
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [
                { achievement_id: QUEST.id, unlocked_at: null },
                { achievement_id: LEVEL.id, unlocked_at: null },
              ],
              error: null,
            }),
          }),
        };
      }),
    };

    const origImpl = write.from.getMockImplementation()!;
    write.from.mockImplementation((table: string) => {
      if (table === "character_achievements") {
        return {
          upsert: write.upsert,
          update: write.charAchUpdate,
          select: charAchChain.select,
        };
      }
      return origImpl(table);
    });

    const readClient = makeReadClient({
      characters: makeCharChain({
        xp: 40,
        gold: 0,
        level: 1,
      }) as unknown as MockChain,
      achievements: makeDataResult([QUEST, LEVEL]) as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: makeQuestChain(5),
    });

    const svc = new AchievementProgressService(readClient as never);
    // P2: Cascade should complete without throwing
    await expect(
      svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" }),
    ).resolves.toBeUndefined();
  });
});
