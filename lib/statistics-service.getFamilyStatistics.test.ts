import {
  applyStatisticsDefaultMocks,
  createStatisticsService,
  mockFamilyId,
  now,
} from "./statistics-service.fixtures";

describe("StatisticsService - getFamilyStatistics", () => {
  let service: any;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    ({ service, mockFrom } = createStatisticsService());
    applyStatisticsDefaultMocks(mockFrom);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("should calculate quest statistics correctly by time period", async () => {
    const result = await service.getFamilyStatistics(mockFamilyId);
    expect(result.questsCompletedThisWeek).toBe(3);
    expect(result.questsCompletedLastWeek).toBe(2);
    expect(result.questsCompletedThisMonth).toBe(7);
    expect(result.questsCompletedLastMonth).toBe(2);
  });

  it("should calculate total family gold and XP correctly", async () => {
    const result = await service.getFamilyStatistics(mockFamilyId);
    expect(result.totalGoldEarned).toBe(1250);
    expect(result.totalXpEarned).toBe(2700);
    expect(result.totalGemsEarned).toBe(120);
    expect(result.totalHonorEarned).toBe(30);
  });

  it("should calculate character progress with completion rates", async () => {
    const result = await service.getFamilyStatistics(mockFamilyId);
    expect(result.characterProgress).toHaveLength(3);
    const alice = result.characterProgress.find(
      (c: any) => c.userId === "user-1",
    );
    expect(alice).toMatchObject({
      userId: "user-1",
      characterName: "Alice the Knight",
      displayName: "Alice",
      level: 5,
      xp: 1200,
      gold: 500,
      gems: 50,
      honor: 12,
      questsCompleted: 4,
      completionRate: 80,
    });
    const bob = result.characterProgress.find(
      (c: any) => c.userId === "user-2",
    );
    expect(bob).toMatchObject({
      userId: "user-2",
      characterName: "Bob the Mage",
      displayName: "Bob",
      level: 3,
      xp: 600,
      gold: 300,
      questsCompleted: 2,
      completionRate: 67,
    });
    const carol = result.characterProgress.find(
      (c: any) => c.userId === "user-3",
    );
    expect(carol).toMatchObject({
      userId: "user-3",
      characterName: "Carol the Rogue",
      displayName: "Carol",
      level: 4,
      xp: 900,
      gold: 450,
      questsCompleted: 3,
      completionRate: 100,
    });
  });

  it("should identify the most active member", async () => {
    const result = await service.getFamilyStatistics(mockFamilyId);
    expect(result.mostActiveMember).toMatchObject({
      userId: "user-1",
      characterName: "Alice the Knight",
      displayName: "Alice",
      questsCompleted: 4,
    });
  });

  it("should count pending approvals correctly", async () => {
    const result = await service.getFamilyStatistics(mockFamilyId);
    expect(result.pendingQuestApprovals).toBe(1);
    expect(result.pendingRewardRedemptions).toBe(2);
  });

  it("should calculate reward redemption statistics by time period", async () => {
    const result = await service.getFamilyStatistics(mockFamilyId);
    expect(result.rewardRedemptionsThisWeek).toBe(2);
    expect(result.rewardRedemptionsThisMonth).toBe(3);
  });

  it("should calculate boss battle summary with weighted participation", async () => {
    const result = await service.getFamilyStatistics(mockFamilyId);
    expect(result.bossBattleSummary.battlesThisWeek).toBe(1);
    expect(result.bossBattleSummary.battlesThisMonth).toBe(2);
    expect(result.bossBattleSummary.topParticipantWeek).toMatchObject({
      userId: "user-1",
      displayName: "Alice",
      participationScore: 1,
    });
    expect(result.bossBattleSummary.topParticipantMonth?.userId).toBe("user-2");
    expect(
      result.bossBattleSummary.topParticipantMonth?.participationScore,
    ).toBeCloseTo(1.67, 2);
  });
});
