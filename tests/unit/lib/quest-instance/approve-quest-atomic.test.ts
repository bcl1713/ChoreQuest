import { approveQuest } from "@/lib/quest-instance/approve-quest";

const QUEST_ID = "11111111-1111-4111-8111-111111111111";
const CHARACTER_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "33333333-3333-4333-8333-333333333333";
const FAMILY_ID = "44444444-4444-4444-8444-444444444444";

function chainFor(value: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue(value),
    single: jest.fn().mockResolvedValue(value),
    maybeSingle: jest.fn().mockResolvedValue(value),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
  };
}

describe("approveQuest atomic gold mutation", () => {
  it("applies quest payout through a server-side atomic stats and audit RPC", async () => {
    const quest = {
      id: QUEST_ID,
      assigned_to_id: USER_ID,
      family_id: FAMILY_ID,
      status: "COMPLETED",
      completed_at: "2026-06-14T22:21:09.000Z",
      xp_reward: 10,
      gold_reward: 85,
      volunteer_bonus: 0.2,
      volunteered_by: CHARACTER_ID,
      template_id: null,
      recurrence_pattern: null,
    };
    const character = {
      id: CHARACTER_ID,
      user_id: USER_ID,
      gold: 123,
      xp: 0,
      level: 1,
      active_family_quest_id: QUEST_ID,
    };

    const transactionInsert = jest.fn().mockResolvedValue({ error: null });
    const characterUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const rpc = jest
      .fn()
      .mockResolvedValue({ data: [{ xp: 12, gold: 135, level: 1 }], error: null });

    const client = {
      rpc,
      from: jest.fn((table: string) => {
        if (table === "quest_instances") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValueOnce({ data: quest, error: null })
              .mockResolvedValueOnce({
                data: { ...quest, status: "APPROVED" },
                error: null,
              }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === "characters") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: character, error: null }),
            order: jest.fn().mockResolvedValue({ data: [character], error: null }),
            update: characterUpdate,
          };
        }
        if (table === "families") {
          return chainFor({ data: { timezone: "America/Chicago" }, error: null });
        }
        if (table === "transactions") {
          return { insert: transactionInsert };
        }
        return chainFor({ data: null, error: null });
      }),
    };

    await approveQuest(
      {
        client: client as never,
        streakService: {
          getStreak: jest.fn(),
          incrementStreak: jest.fn(),
          resetStreak: jest.fn(),
        } as never,
        progressService: { updateProgress: jest.fn().mockResolvedValue(undefined) },
      },
      QUEST_ID,
    );

    expect(rpc).toHaveBeenCalledWith("fn_apply_quest_reward", {
      p_character_id: CHARACTER_ID,
      p_quest_id: QUEST_ID,
      p_user_id: USER_ID,
      p_xp: 12,
      p_gold: 102,
    });
    expect(characterUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ gold: expect.any(Number) }),
    );
  });
});
