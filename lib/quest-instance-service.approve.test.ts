import { QuestInstanceService } from "./quest-instance-service";
import { StreakService } from "./streak-service";
import { supabase } from "./supabase";
import { createServiceSupabaseClient } from "@/lib/supabase-server";

jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(),
}));

const mockCreateServiceSupabaseClient =
  createServiceSupabaseClient as jest.MockedFunction<
    typeof createServiceSupabaseClient
  >;

describe("QuestInstanceService - approveQuest", () => {
  it("throws app error when quest fetch fails", async () => {
    const fromMock = jest.fn((table: string) => {
      if (table === "quest_instances") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database offline" },
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const questService = new QuestInstanceService(
      { from: fromMock } as unknown as typeof supabase,
      {} as StreakService,
    );

    await expect(
      questService.approveQuest("quest-approve-123"),
    ).rejects.toThrow("Failed to fetch quest: Database offline");
  });

  it("applies volunteer and streak bonuses and updates metadata", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const questId = "quest-approve-123";
    const templateId = "template-approve-456";
    const characterId = "character-approve-789";
    const userId = "user-approve-001";

    const questRecord = {
      id: questId,
      title: "Daily Practice",
      description: "Practice instrument for 30 minutes",
      xp_reward: 100,
      gold_reward: 60,
      difficulty: "MEDIUM",
      category: "DAILY",
      status: "CLAIMED",
      assigned_to_id: userId,
      created_by_id: "gm-approve-002",
      family_id: "family-approve-003",
      template_id: templateId,
      recurrence_pattern: "DAILY",
      volunteer_bonus: 0.2,
      volunteered_by: characterId,
      streak_count: 0,
      streak_bonus: 0,
      cycle_start_date: null,
      cycle_end_date: null,
      due_date: null,
      completed_at: null,
      approved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      quest_type: "FAMILY",
    };

    const characterRecord = {
      id: characterId,
      user_id: userId,
      name: "Hero",
      class: "KNIGHT",
      level: 1,
      xp: 0,
      gold: 0,
      gems: 0,
      honor_points: 0,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active_family_quest_id: questId,
    };

    const templateRecord = {
      id: templateId,
      title: "Daily Practice Template",
      description: "Recurring practice session",
      xp_reward: 100,
      gold_reward: 60,
      difficulty: "MEDIUM",
      category: "DAILY",
      family_id: "family-approve-003",
      is_active: true,
      is_paused: false,
      quest_type: "FAMILY",
      recurrence_pattern: "DAILY",
      assigned_character_ids: [],
      class_bonuses: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedQuestRecord = {
      ...questRecord,
      status: "APPROVED",
      completed_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      streak_count: 3,
      streak_bonus: 0.05,
    };

    const questSelectSingle = jest
      .fn()
      .mockResolvedValue({ data: questRecord, error: null });
    const questSelectBuilder = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: questSelectSingle,
        }),
      }),
    };

    const questUpdateBuilder = {
      update: jest.fn().mockImplementation((payload) => ({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                ...updatedQuestRecord,
                ...payload,
              },
              error: null,
            }),
          }),
        }),
      })),
    };

    const characterSelectSingle = jest
      .fn()
      .mockResolvedValue({ data: characterRecord, error: null });
    const characterSelectBuilder = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: characterSelectSingle,
        }),
      }),
    };

    const characterUpdateEq = jest.fn().mockResolvedValue({ error: null });
    const characterUpdateBuilder = {
      update: jest.fn().mockImplementation((payload) => ({
        eq: jest.fn().mockReturnValue(characterUpdateEq),
        payload,
      })),
    };

    const templateMaybeSingle = jest
      .fn()
      .mockResolvedValue({ data: templateRecord, error: null });
    const templateBuilder = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: templateMaybeSingle,
        }),
      }),
    };

    const familyMaybeSingle = jest.fn().mockResolvedValue({
      data: { timezone: "America/Chicago" },
      error: null,
    });
    const familyBuilder = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: familyMaybeSingle,
        }),
      }),
    };

    const questInstanceBuilders = [questSelectBuilder, questUpdateBuilder];
    const characterBuilders = [characterSelectBuilder, characterUpdateBuilder];

    const fromMock = jest.fn((table: string) => {
      if (table === "quest_instances") {
        const builder = questInstanceBuilders.shift();
        if (!builder) throw new Error("Unexpected quest_instances call");
        return builder;
      }
      if (table === "characters") {
        const builder = characterBuilders.shift();
        if (!builder) throw new Error("Unexpected characters call");
        return builder;
      }
      if (table === "quest_templates") {
        return templateBuilder;
      }
      if (table === "families") {
        return familyBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const userScopedRpcMock = jest.fn();
    const serviceScopedRpcMock = jest
      .fn()
      .mockResolvedValue({ data: null, error: null });
    mockCreateServiceSupabaseClient.mockReturnValue({
      from: jest.fn(),
      rpc: serviceScopedRpcMock,
    } as never);
    const supabaseStub = { from: fromMock, rpc: userScopedRpcMock };

    const streakServiceMock = {
      getStreak: jest.fn().mockResolvedValue({
        id: "streak-1",
        character_id: characterId,
        template_id: templateId,
        current_streak: 2,
        longest_streak: 5,
        last_completed_date: new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      incrementStreak: jest.fn().mockResolvedValue({
        current_streak: 3,
      }),
      resetStreak: jest.fn().mockResolvedValue({
        current_streak: 0,
      }),
    };

    const questService = new QuestInstanceService(
      supabaseStub as unknown as typeof supabase,
      streakServiceMock as unknown as StreakService,
    );

    const result = await questService.approveQuest(questId);

    expect(result.status).toBe("APPROVED");
    expect(streakServiceMock.getStreak).toHaveBeenCalledWith(
      characterId,
      templateId,
    );
    expect(streakServiceMock.incrementStreak).toHaveBeenCalled();
    expect(streakServiceMock.resetStreak).not.toHaveBeenCalled();

    expect(userScopedRpcMock).not.toHaveBeenCalled();
    expect(serviceScopedRpcMock).toHaveBeenCalledWith("fn_apply_quest_reward", {
      p_character_id: characterId,
      p_quest_id: questId,
      p_user_id: userId,
      p_xp: 120,
      p_gold: 72,
    });
    expect(characterUpdateBuilder.update).not.toHaveBeenCalled();

    const [questUpdatePayload] = questUpdateBuilder.update.mock.calls[0];
    expect(questUpdatePayload.status).toBe("APPROVED");
    expect(questUpdatePayload.streak_count).toBe(3);
    expect(questUpdatePayload.streak_bonus).toBe(0);
    expect(questUpdatePayload.completed_at).toEqual(expect.any(String));
    expect(questUpdatePayload.approved_at).toEqual(expect.any(String));
  });
});
