import {
  applyDefaultActivityMocks,
  createActivityService,
  mockFamilyId,
  mockFamilyMembers,
  mockCompletedQuests,
} from "./activity-service.fixtures";

describe("ActivityService - recent activity errors", () => {
  let service: any;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    ({ service, mockFrom } = createActivityService());
    applyDefaultActivityMocks(mockFrom);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error when family members query fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
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
    await expect(service.getRecentActivity(mockFamilyId)).rejects.toThrow(
      "Failed to fetch family members: Database error",
    );
  });

  it("should throw error when completed quests query fails", async () => {
    let callCount = 0;
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
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: null,
                      error: { message: "Quest query error" },
                    }),
                  }),
                }),
              }),
            }),
          };
        }
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });
    await expect(service.getRecentActivity(mockFamilyId)).rejects.toThrow(
      "Failed to fetch completed quests: Quest query error",
    );
  });

  it("should throw error when submitted quests query fails", async () => {
    let callCount = 0;
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
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: mockCompletedQuests,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Submitted quest query error" },
                  }),
                }),
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
    await expect(service.getRecentActivity(mockFamilyId)).rejects.toThrow(
      "Failed to fetch submitted quests: Submitted quest query error",
    );
  });

  it("should throw error when redemptions query fails", async () => {
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
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "reward_redemptions") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Redemption query error" },
            }),
          }),
        };
      }
      if (table === "boss_battles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "transactions") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
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
    await expect(service.getRecentActivity(mockFamilyId)).rejects.toThrow(
      "Failed to fetch redemptions: Redemption query error",
    );
  });
});
