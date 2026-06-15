import { approveQuest } from "../quest-instance/approve-quest";
import { StreakService } from "../streak-service";

// Mock AchievementProgressService
const mockUpdateProgress = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/achievement-progress-service", () => ({
  AchievementProgressService: jest.fn().mockImplementation(() => ({
    updateProgress: mockUpdateProgress,
  })),
}));

// Mock the service-role client used internally by reward mutations and AchievementProgressService
jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => ({
    from: jest.fn(),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

const CHARACTER_ID = "char-approve-001";
const USER_ID = "user-approve-001";
const QUEST_ID = "quest-approve-001";
const FAMILY_ID = "family-approve-001";

const baseQuest = {
  id: QUEST_ID,
  title: "Test Quest",
  description: "A test quest",
  xp_reward: 100,
  gold_reward: 50,
  difficulty: "EASY",
  category: "DAILY",
  status: "CLAIMED",
  assigned_to_id: USER_ID,
  volunteered_by: null,
  volunteer_bonus: null,
  template_id: null,
  recurrence_pattern: null,
  family_id: FAMILY_ID,
  created_by_id: "gm-001",
  streak_count: 0,
  streak_bonus: 0,
  cycle_start_date: null,
  cycle_end_date: null,
  due_date: null,
  completed_at: null,
  approved_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  quest_type: "INDIVIDUAL",
};

const baseCharacter = {
  id: CHARACTER_ID,
  user_id: USER_ID,
  name: "Hero",
  class: "KNIGHT",
  level: 1,
  xp: 0,
  gold: 0,
  gems: 0,
  honor_points: 0,
  avatar_url: null,
  active_family_quest_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const approvedQuest = { ...baseQuest, status: "APPROVED" };

function makeFromMock(overrides: Record<string, unknown> = {}) {
  return jest.fn((table: string) => {
    switch (table) {
      case "quest_instances": {
        const selectQuestMock = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: baseQuest, error: null }),
          }),
        });
        const updateQuestMock = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: approvedQuest, error: null }),
            }),
          }),
        });
        return { select: selectQuestMock, update: updateQuestMock };
      }
      case "characters": {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [baseCharacter],
                error: null,
              }),
              single: jest.fn().mockResolvedValue({
                data: baseCharacter,
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      case "families": {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { timezone: "UTC" },
                error: null,
              }),
            }),
          }),
        };
      }
      case "character_quest_streaks": {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest
                    .fn()
                    .mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
          upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      default:
        return overrides[table] ?? { select: jest.fn(), update: jest.fn() };
    }
  });
}

function makeStreakService(): StreakService {
  return {
    applyStreakBonus: jest.fn().mockResolvedValue({
      streakCount: 0,
      streakBonus: 0,
      xp: 100,
      gold: 50,
    }),
  } as unknown as StreakService;
}

describe("approveQuest - achievement progress integration (task 9.1)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls updateProgress with QUEST_APPROVED after character stats update", async () => {
    const from = makeFromMock();
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
    const deps = {
      client: { from, rpc } as never,
      streakService: makeStreakService(),
    };

    await approveQuest(deps, QUEST_ID);

    expect(mockUpdateProgress).toHaveBeenCalledWith(CHARACTER_ID, {
      type: "QUEST_APPROVED",
    });
  });

  it("does not block quest approval when updateProgress throws", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockUpdateProgress.mockRejectedValueOnce(new Error("Progress DB error"));

    const from = makeFromMock();
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
    const deps = {
      client: { from, rpc } as never,
      streakService: makeStreakService(),
    };

    const result = await approveQuest(deps, QUEST_ID);

    // Quest still approved successfully
    expect(result).toEqual(approvedQuest);
  });

  it("logs an error when updateProgress fails (non-blocking)", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockUpdateProgress.mockRejectedValueOnce(new Error("Progress error"));

    const from = makeFromMock();
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
    const deps = {
      client: { from, rpc } as never,
      streakService: makeStreakService(),
    };

    await approveQuest(deps, QUEST_ID);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Achievement progress update failed"),
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
