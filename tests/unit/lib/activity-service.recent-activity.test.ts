import {
  applyDefaultActivityMocks,
  createActivityService,
  mockFamilyId,
} from "./__fixtures__/activity-service.fixtures";

describe("ActivityService - recent activity", () => {
  let mockFrom: jest.Mock;
  let service: any;

  beforeEach(() => {
    ({ service, mockFrom } = createActivityService());
    applyDefaultActivityMocks(mockFrom);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should aggregate events from multiple sources", async () => {
    const result = await service.getRecentActivity(mockFamilyId);
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.filter((e: any) => e.type === "QUEST_COMPLETED"),
    ).toHaveLength(2);
    expect(
      result.filter((e: any) => e.type === "QUEST_SUBMITTED"),
    ).toHaveLength(1);
    expect(
      result.filter((e: any) => e.type === "REWARD_REDEEMED"),
    ).toHaveLength(3);
    expect(
      result.filter((e: any) => e.type === "REWARD_APPROVED"),
    ).toHaveLength(1);
    expect(result.filter((e: any) => e.type === "REWARD_DENIED")).toHaveLength(
      1,
    );
    expect(
      result.filter((e: any) => e.type === "CHARACTER_CREATED"),
    ).toHaveLength(1);
  });

  it("should sort events by timestamp (most recent first)", async () => {
    const result = await service.getRecentActivity(mockFamilyId);
    for (let i = 0; i < result.length - 1; i++) {
      const currentTime = new Date(result[i].timestamp).getTime();
      const nextTime = new Date(result[i + 1].timestamp).getTime();
      expect(currentTime).toBeGreaterThanOrEqual(nextTime);
    }
  });

  it("should respect the limit parameter", async () => {
    const result = await service.getRecentActivity(mockFamilyId, 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("should include correct fields for quest completion events", async () => {
    const result = await service.getRecentActivity(mockFamilyId);
    const questEvent = result.find(
      (e: any) => e.type === "QUEST_COMPLETED" && e.questId === "quest-1",
    );
    expect(questEvent).toMatchObject({
      id: "quest-quest-1",
      type: "QUEST_COMPLETED",
      characterName: "Alice the Knight",
      displayName: "Alice",
      userId: "user-1",
      questTitle: "Clean the kitchen",
      questId: "quest-1",
      timestamp: "2025-10-15T10:00:00Z",
    });
  });

  it("should include correct fields for quest submitted events", async () => {
    const result = await service.getRecentActivity(mockFamilyId);
    const submittedEvent = result.find(
      (e: any) => e.type === "QUEST_SUBMITTED" && e.questId === "quest-3",
    );
    expect(submittedEvent).toMatchObject({
      id: "quest-submitted-quest-3",
      type: "QUEST_SUBMITTED",
      characterName: "Alice the Knight",
      displayName: "Alice",
      userId: "user-1",
      questTitle: "Walk the dog",
      questId: "quest-3",
      timestamp: "2025-10-15T12:00:00Z",
    });
  });

  it("should include correct fields for reward redemption events", async () => {
    const result = await service.getRecentActivity(mockFamilyId);
    const redemptionEvent = result.find(
      (e: any) =>
        e.type === "REWARD_REDEEMED" && e.redemptionId === "redemption-1",
    );
    expect(redemptionEvent).toMatchObject({
      id: "redemption-redemption-1",
      type: "REWARD_REDEEMED",
      characterName: "Alice the Knight",
      displayName: "Alice",
      userId: "user-1",
      rewardName: "Ice Cream",
      redemptionId: "redemption-1",
      timestamp: "2025-10-15T11:00:00Z",
    });
  });

  it("should include correct fields for reward approved events", async () => {
    const result = await service.getRecentActivity(mockFamilyId);
    const approvedEvent = result.find(
      (e: any) =>
        e.type === "REWARD_APPROVED" && e.redemptionId === "redemption-2",
    );
    expect(approvedEvent).toMatchObject({
      id: "redemption-approved-redemption-2",
      type: "REWARD_APPROVED",
      characterName: "Bob the Mage",
      displayName: "Bob",
      userId: "user-2",
      rewardName: "Movie Night",
      redemptionId: "redemption-2",
      timestamp: "2025-10-14T12:00:00Z",
    });
  });

  it("should include correct fields for reward denied events", async () => {
    const result = await service.getRecentActivity(mockFamilyId);
    const deniedEvent = result.find(
      (e: any) =>
        e.type === "REWARD_DENIED" && e.redemptionId === "redemption-3",
    );
    expect(deniedEvent).toMatchObject({
      id: "redemption-denied-redemption-3",
      type: "REWARD_DENIED",
      characterName: "Alice the Knight",
      displayName: "Alice",
      userId: "user-1",
      rewardName: "Extra Screen Time",
      redemptionId: "redemption-3",
      timestamp: "2025-10-13T12:00:00Z",
    });
  });

  it("should include character creation events for recent characters only", async () => {
    const result = await service.getRecentActivity(mockFamilyId);
    const characterEvents = result.filter(
      (e: any) => e.type === "CHARACTER_CREATED",
    );
    expect(characterEvents).toHaveLength(1);
    expect(characterEvents[0]).toMatchObject({
      id: "character-created-user-2",
      type: "CHARACTER_CREATED",
      characterName: "Bob the Mage",
      displayName: "Bob",
      userId: "user-2",
      timestamp: "2025-11-01T10:00:00Z",
    });
  });

  it("should handle empty family with no members", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      if (table === "quest_instances") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "reward_redemptions") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });
    const result = await service.getRecentActivity(mockFamilyId);
    expect(result).toEqual([]);
  });

  it("should handle family with no activity", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockFamilyMembers,
              error: null,
            }),
          }),
        };
      }
      if (table === "quest_instances") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "reward_redemptions") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });
    const result = await service.getRecentActivity(mockFamilyId);
    expect(result.length).toBeLessThanOrEqual(mockFamilyMembers.length);
  });
});
