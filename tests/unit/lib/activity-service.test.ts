/**
 * Unit tests for ActivityService
 * Tests activity event fetching and aggregation
 */

import { ActivityService } from "@/lib/activity-service";
import { supabase } from "@/lib/supabase";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("ActivityService", () => {
  let service: ActivityService;
  let mockFrom: jest.Mock;

  const mockFamilyId = "family-123";

  // Mock family members with characters
  const mockFamilyMembers = [
    {
      id: "user-1",
      display_name: "Alice",
      characters: {
        name: "Alice the Knight",
        level: 5,
        created_at: "2025-09-01T10:00:00Z",
      },
    },
    {
      id: "user-2",
      display_name: "Bob",
      characters: {
        name: "Bob the Mage",
        level: 3,
        created_at: "2025-10-01T10:00:00Z", // Recent character (within 30 days)
      },
    },
  ];

  // Mock completed quests
  const mockCompletedQuests = [
    {
      id: "quest-1",
      title: "Clean the kitchen",
      assigned_to_id: "user-1",
      completed_at: "2025-10-15T10:00:00Z",
      status: "COMPLETED",
    },
    {
      id: "quest-2",
      title: "Do homework",
      assigned_to_id: "user-2",
      completed_at: "2025-10-14T10:00:00Z",
      status: "COMPLETED",
    },
  ];

  // Mock submitted quests (pending approval)
  const mockSubmittedQuests = [
    {
      id: "quest-3",
      title: "Walk the dog",
      assigned_to_id: "user-1",
      updated_at: "2025-10-15T12:00:00Z",
      status: "SUBMITTED",
    },
  ];

  // Mock reward redemptions
  const mockRedemptions = [
    {
      id: "redemption-1",
      user_id: "user-1",
      reward_name: "Ice Cream",
      status: "PENDING",
      requested_at: "2025-10-15T11:00:00Z",
      approved_at: null,
    },
    {
      id: "redemption-2",
      user_id: "user-2",
      reward_name: "Movie Night",
      status: "APPROVED",
      requested_at: "2025-10-14T11:00:00Z",
      approved_at: "2025-10-14T12:00:00Z",
    },
    {
      id: "redemption-3",
      user_id: "user-1",
      reward_name: "Extra Screen Time",
      status: "DENIED",
      requested_at: "2025-10-13T11:00:00Z",
      approved_at: "2025-10-13T12:00:00Z",
    },
  ];

  beforeEach(() => {
    service = new ActivityService();
    mockFrom = jest.fn();
    (supabase.from as jest.Mock) = mockFrom;

    // Setup default mock implementation
    setupDefaultMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function setupDefaultMocks() {
    let questInstancesCallCount = 0;

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
      } else if (table === "quest_instances") {
        questInstancesCallCount++;

        if (questInstancesCallCount === 1) {
          // First call: completed quests
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
        } else {
          // Second call: submitted quests
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: mockSubmittedQuests,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
      } else if (table === "reward_redemptions") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: mockRedemptions,
                  error: null,
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
  }

  describe("getRecentActivity", () => {
    it("should aggregate events from multiple sources", async () => {
      const result = await service.getRecentActivity(mockFamilyId);

      // Should have events from:
      // - 2 completed quests
      // - 1 submitted quest
      // - 3 redemption requests
      // - 2 redemption approvals/denials (redemption-2 approved, redemption-3 denied)
      // - 1 character created (Bob, within 30 days)
      expect(result.length).toBeGreaterThan(0);

      // Check for quest completion events
      const questCompletedEvents = result.filter(
        (e) => e.type === "QUEST_COMPLETED"
      );
      expect(questCompletedEvents).toHaveLength(2);

      // Check for quest submitted events
      const questSubmittedEvents = result.filter(
        (e) => e.type === "QUEST_SUBMITTED"
      );
      expect(questSubmittedEvents).toHaveLength(1);

      // Check for reward redeemed events
      const rewardRedeemedEvents = result.filter(
        (e) => e.type === "REWARD_REDEEMED"
      );
      expect(rewardRedeemedEvents).toHaveLength(3);

      // Check for reward approved events
      const rewardApprovedEvents = result.filter(
        (e) => e.type === "REWARD_APPROVED"
      );
      expect(rewardApprovedEvents).toHaveLength(1);

      // Check for reward denied events
      const rewardDeniedEvents = result.filter(
        (e) => e.type === "REWARD_DENIED"
      );
      expect(rewardDeniedEvents).toHaveLength(1);

      // Check for character created events (only Bob is recent)
      const characterCreatedEvents = result.filter(
        (e) => e.type === "CHARACTER_CREATED"
      );
      expect(characterCreatedEvents).toHaveLength(1);
    });

    it("should sort events by timestamp (most recent first)", async () => {
      const result = await service.getRecentActivity(mockFamilyId);

      // Verify descending order
      for (let i = 0; i < result.length - 1; i++) {
        const currentTime = new Date(result[i].timestamp).getTime();
        const nextTime = new Date(result[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
    });

    it("should respect the limit parameter", async () => {
      const limit = 5;
      const result = await service.getRecentActivity(mockFamilyId, limit);

      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it("should include correct fields for quest completion events", async () => {
      const result = await service.getRecentActivity(mockFamilyId);

      const questEvent = result.find(
        (e) => e.type === "QUEST_COMPLETED" && e.questId === "quest-1"
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
        (e) => e.type === "QUEST_SUBMITTED" && e.questId === "quest-3"
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
        (e) => e.type === "REWARD_REDEEMED" && e.redemptionId === "redemption-1"
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
        (e) => e.type === "REWARD_APPROVED" && e.redemptionId === "redemption-2"
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
        (e) => e.type === "REWARD_DENIED" && e.redemptionId === "redemption-3"
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
        (e) => e.type === "CHARACTER_CREATED"
      );

      // Only Bob's character is recent (Oct 1, within 30 days)
      expect(characterEvents).toHaveLength(1);
      expect(characterEvents[0]).toMatchObject({
        id: "character-created-user-2",
        type: "CHARACTER_CREATED",
        characterName: "Bob the Mage",
        displayName: "Bob",
        userId: "user-2",
        timestamp: "2025-10-01T10:00:00Z",
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
        } else if (table === "quest_instances") {
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
        } else if (table === "reward_redemptions") {
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
        } else if (table === "quest_instances") {
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
        } else if (table === "reward_redemptions") {
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

      // Should only have character created events (if any are recent)
      expect(result.length).toBeLessThanOrEqual(mockFamilyMembers.length);
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
        "Failed to fetch family members: Database error"
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
        } else if (table === "quest_instances") {
          callCount++;
          if (callCount === 1) {
            // First call to quest_instances fails
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
        "Failed to fetch completed quests: Quest query error"
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
        } else if (table === "quest_instances") {
          callCount++;
          if (callCount === 1) {
            // First call succeeds (completed quests)
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
          } else {
            // Second call fails (submitted quests)
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
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      await expect(service.getRecentActivity(mockFamilyId)).rejects.toThrow(
        "Failed to fetch submitted quests: Submitted quest query error"
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
        } else if (table === "quest_instances") {
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
        } else if (table === "reward_redemptions") {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Redemption query error" },
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
        "Failed to fetch redemptions: Redemption query error"
      );
    });
  });
});
