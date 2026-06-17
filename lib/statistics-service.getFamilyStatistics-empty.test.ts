import { createStatisticsService, mockFamilyId, now } from "./statistics-service.fixtures";

describe("StatisticsService - empty states", () => {
  let service: any;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    ({ service, mockFrom } = createStatisticsService());
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("should handle family with no members gracefully", async () => {
    const questInstancesCalls = { count: 0 };
    const redemptionsCalls = { count: 0 };
    mockFrom.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      if (table === "quest_instances") {
        questInstancesCalls.count++;
        if (questInstancesCalls.count === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (questInstancesCalls.count === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "reward_redemptions") {
        redemptionsCalls.count++;
        if (redemptionsCalls.count === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      if (table === "boss_battles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "boss_battle_participants") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return { select: jest.fn() };
    });
    const result = await service.getFamilyStatistics(mockFamilyId);
    expect(result.questsCompletedThisWeek).toBe(0);
    expect(result.totalGoldEarned).toBe(0);
    expect(result.totalXpEarned).toBe(0);
    expect(result.totalGemsEarned).toBe(0);
    expect(result.totalHonorEarned).toBe(0);
    expect(result.characterProgress).toEqual([]);
    expect(result.mostActiveMember).toBeNull();
    expect(result.pendingQuestApprovals).toBe(0);
    expect(result.pendingRewardRedemptions).toBe(0);
    expect(result.bossBattleSummary).toMatchObject({
      battlesThisWeek: 0,
      battlesThisMonth: 0,
      topParticipantWeek: null,
      topParticipantMonth: null,
    });
  });

  it("should handle characters with no assigned quests", async () => {
    const membersWithNoQuests = [
      {
        id: "user-4",
        name: "Dave",
        characters: {
          name: "Dave the Healer",
          level: 1,
          xp: 0,
          gold: 0,
        },
      },
    ];
    const questInstancesCalls = { count: 0 };
    const redemptionsCalls = { count: 0 };
    mockFrom.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: membersWithNoQuests, error: null }),
          }),
        };
      }
      if (table === "quest_instances") {
        questInstancesCalls.count++;
        if (questInstancesCalls.count === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (questInstancesCalls.count === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "reward_redemptions") {
        redemptionsCalls.count++;
        if (redemptionsCalls.count === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      if (table === "boss_battles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "boss_battle_participants") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return { select: jest.fn() };
    });
    const result = await service.getFamilyStatistics(mockFamilyId);
    const dave = result.characterProgress.find((c: any) => c.userId === "user-4");
    expect(dave).toMatchObject({
      userId: "user-4",
      characterName: "Dave the Healer",
      displayName: "Dave",
      level: 1,
      xp: 0,
      gold: 0,
      questsCompleted: 0,
      completionRate: 0,
    });
  });
});
