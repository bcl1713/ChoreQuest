/**
 * Unit tests for StatisticsService
 * Tests family statistics calculations and aggregations
 */

import { StatisticsService } from "@/lib/statistics-service";
import { supabase } from "@/lib/supabase";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("StatisticsService", () => {
  let service: StatisticsService;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockIn: jest.Mock;

  const mockFamilyId = "family-123";
  const now = new Date("2025-10-15T12:00:00Z"); // Wednesday, Oct 15, 2025

  // Mock family members with characters
  const mockFamilyMembers = [
    {
      id: "user-1",
      display_name: "Alice",
      characters: {
        name: "Alice the Knight",
        level: 5,
        xp: 1200,
        gold: 500,
      },
    },
    {
      id: "user-2",
      display_name: "Bob",
      characters: {
        name: "Bob the Mage",
        level: 3,
        xp: 600,
        gold: 300,
      },
    },
    {
      id: "user-3",
      display_name: "Carol",
      characters: {
        name: "Carol the Rogue",
        level: 4,
        xp: 900,
        gold: 450,
      },
    },
  ];

  // Mock completed quests (various dates)
  const mockCompletedQuests = [
    // This week (Oct 12-18, 2025 - starting Sunday Oct 12, current is Wed Oct 15)
    { id: "q1", status: "COMPLETED", assigned_to_id: "user-1", completed_at: "2025-10-14T10:00:00Z", approved_at: "2025-10-14T11:00:00Z" },
    { id: "q2", status: "COMPLETED", assigned_to_id: "user-1", completed_at: "2025-10-15T10:00:00Z", approved_at: "2025-10-15T11:00:00Z" },
    { id: "q3", status: "COMPLETED", assigned_to_id: "user-2", completed_at: "2025-10-14T10:00:00Z", approved_at: "2025-10-14T11:00:00Z" },

    // Last week (Oct 5-11, 2025)
    { id: "q4", status: "COMPLETED", assigned_to_id: "user-1", completed_at: "2025-10-08T10:00:00Z", approved_at: "2025-10-08T11:00:00Z" },
    { id: "q5", status: "COMPLETED", assigned_to_id: "user-3", completed_at: "2025-10-09T10:00:00Z", approved_at: "2025-10-09T11:00:00Z" },

    // This month but earlier (not this/last week - Oct 1-4, 2025)
    { id: "q6", status: "COMPLETED", assigned_to_id: "user-1", completed_at: "2025-10-02T10:00:00Z", approved_at: "2025-10-02T11:00:00Z" },
    { id: "q7", status: "COMPLETED", assigned_to_id: "user-2", completed_at: "2025-10-03T10:00:00Z", approved_at: "2025-10-03T11:00:00Z" },

    // Last month (September 2025)
    { id: "q8", status: "COMPLETED", assigned_to_id: "user-3", completed_at: "2025-09-20T10:00:00Z", approved_at: "2025-09-20T11:00:00Z" },
    { id: "q9", status: "COMPLETED", assigned_to_id: "user-3", completed_at: "2025-09-25T10:00:00Z", approved_at: "2025-09-25T11:00:00Z" },
  ];

  // Mock all quests (for completion rate)
  const mockAllQuests = [
    ...mockCompletedQuests.map(q => ({ id: q.id, status: q.status, assigned_to_id: q.assigned_to_id })),
    { id: "q10", status: "IN_PROGRESS", assigned_to_id: "user-1" }, // Alice has 1 in progress
    { id: "q11", status: "SUBMITTED", assigned_to_id: "user-2" }, // Bob has 1 submitted
  ];

  // Mock pending quests
  const mockPendingQuests = [
    { id: "q11" }, // Bob's submitted quest
  ];

  // Mock pending redemptions
  const mockPendingRedemptions = [
    { id: "r1", user_id: "user-2" },
    { id: "r2", user_id: "user-3" },
  ];

  // Mock all redemptions
  const mockAllRedemptions = [
    // This week
    { id: "r1", requested_at: "2025-10-14T10:00:00Z", user_id: "user-2" },
    { id: "r2", requested_at: "2025-10-15T10:00:00Z", user_id: "user-3" },

    // This month (but not this week)
    { id: "r3", requested_at: "2025-10-05T10:00:00Z", user_id: "user-1" },
  ];

  beforeEach(() => {
    service = new StatisticsService();

    // Reset all mocks
    mockSelect = jest.fn();
    mockEq = jest.fn();
    mockIn = jest.fn();
    mockFrom = jest.fn();

    // Mock the current date
    jest.useFakeTimers();
    jest.setSystemTime(now);

    (supabase.from as jest.Mock) = mockFrom;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("getFamilyStatistics", () => {
    beforeEach(() => {
      // Track call counts for tables that are called multiple times
      const questInstancesCalls = { count: 0 };
      const redemptionsCalls = { count: 0 };

      // Setup mock chain for all queries
      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          // user_profiles query: select().eq()
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: mockFamilyMembers, error: null })
            })
          };
        } else if (table === "quest_instances") {
          questInstancesCalls.count++;

          if (questInstancesCalls.count === 1) {
            // First call: completed quests - select().eq().eq()
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: mockCompletedQuests, error: null })
                })
              })
            };
          } else if (questInstancesCalls.count === 2) {
            // Second call: all quests - select().eq().in()
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({ data: mockAllQuests, error: null })
                })
              })
            };
          } else {
            // Third call: pending quests - select().eq().eq()
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: mockPendingQuests, error: null })
                })
              })
            };
          }
        } else if (table === "reward_redemptions") {
          redemptionsCalls.count++;

          if (redemptionsCalls.count === 1) {
            // First call: pending redemptions - select().eq().in()
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({ data: mockPendingRedemptions, error: null })
                })
              })
            };
          } else {
            // Second call: all redemptions - select().in()
            return {
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({ data: mockAllRedemptions, error: null })
              })
            };
          }
        }

        return { select: mockSelect };
      });
    });

    it("should calculate quest statistics correctly by time period", async () => {
      const result = await service.getFamilyStatistics(mockFamilyId);

      // This week: q1, q2, q3 (3 quests)
      expect(result.questsCompletedThisWeek).toBe(3);

      // Last week: q4, q5 (2 quests)
      expect(result.questsCompletedLastWeek).toBe(2);

      // This month: q1-q7 (7 quests)
      expect(result.questsCompletedThisMonth).toBe(7);

      // Last month: q8, q9 (2 quests)
      expect(result.questsCompletedLastMonth).toBe(2);
    });

    it("should calculate total family gold and XP correctly", async () => {
      const result = await service.getFamilyStatistics(mockFamilyId);

      // Total gold: 500 + 300 + 450 = 1250
      expect(result.totalGoldEarned).toBe(1250);

      // Total XP: 1200 + 600 + 900 = 2700
      expect(result.totalXpEarned).toBe(2700);
    });

    it("should calculate character progress with completion rates", async () => {
      const result = await service.getFamilyStatistics(mockFamilyId);

      expect(result.characterProgress).toHaveLength(3);

      // Alice: 4 completed + 1 in progress = 5 total, 4/5 = 80%
      const alice = result.characterProgress.find(c => c.userId === "user-1");
      expect(alice).toMatchObject({
        userId: "user-1",
        characterName: "Alice the Knight",
        displayName: "Alice",
        level: 5,
        xp: 1200,
        gold: 500,
        questsCompleted: 4,
        completionRate: 80,
      });

      // Bob: 2 completed + 1 submitted = 3 total, 2/3 = 67%
      const bob = result.characterProgress.find(c => c.userId === "user-2");
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

      // Carol: 3 completed, 3 total, 3/3 = 100%
      const carol = result.characterProgress.find(c => c.userId === "user-3");
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

      // Alice has 4 completed quests (most active)
      expect(result.mostActiveMember).toMatchObject({
        userId: "user-1",
        characterName: "Alice the Knight",
        displayName: "Alice",
        questsCompleted: 4,
      });
    });

    it("should count pending approvals correctly", async () => {
      const result = await service.getFamilyStatistics(mockFamilyId);

      expect(result.pendingQuestApprovals).toBe(1); // 1 submitted quest
      expect(result.pendingRewardRedemptions).toBe(2); // 2 pending redemptions
    });

    it("should calculate reward redemption statistics by time period", async () => {
      const result = await service.getFamilyStatistics(mockFamilyId);

      // This week: r1, r2 (2 redemptions)
      expect(result.rewardRedemptionsThisWeek).toBe(2);

      // This month: r1, r2, r3 (3 redemptions)
      expect(result.rewardRedemptionsThisMonth).toBe(3);
    });

    it("should handle family with no members gracefully", async () => {
      const questInstancesCalls = { count: 0 };
      const redemptionsCalls = { count: 0 };

      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          };
        } else if (table === "quest_instances") {
          questInstancesCalls.count++;

          if (questInstancesCalls.count === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            };
          } else if (questInstancesCalls.count === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            };
          } else {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            };
          }
        } else if (table === "reward_redemptions") {
          redemptionsCalls.count++;

          if (redemptionsCalls.count === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            };
          } else {
            return {
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({ data: [], error: null })
              })
            };
          }
        }
        return { select: mockSelect };
      });

      const result = await service.getFamilyStatistics(mockFamilyId);

      expect(result.questsCompletedThisWeek).toBe(0);
      expect(result.totalGoldEarned).toBe(0);
      expect(result.totalXpEarned).toBe(0);
      expect(result.characterProgress).toEqual([]);
      expect(result.mostActiveMember).toBeNull();
      expect(result.pendingQuestApprovals).toBe(0);
      expect(result.pendingRewardRedemptions).toBe(0);
    });

    it("should throw error when family members query fails", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          mockSelect.mockReturnValueOnce({
            eq: jest.fn().mockResolvedValueOnce({ data: null, error: { message: "Database error" } })
          });
        }
        return { select: mockSelect };
      });

      await expect(service.getFamilyStatistics(mockFamilyId)).rejects.toThrow(
        "Failed to fetch family members: Database error"
      );
    });

    it("should throw error when completed quests query fails", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          mockSelect.mockReturnValueOnce({
            eq: jest.fn().mockResolvedValueOnce({ data: mockFamilyMembers, error: null })
          });
        } else if (table === "quest_instances") {
          mockSelect.mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({ data: null, error: { message: "Quest query error" } })
            })
          });
        }
        return { select: mockSelect };
      });

      await expect(service.getFamilyStatistics(mockFamilyId)).rejects.toThrow(
        "Failed to fetch completed quests: Quest query error"
      );
    });

    it("should handle characters with no assigned quests", async () => {
      const membersWithNoQuests = [
        {
          id: "user-4",
          display_name: "Dave",
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
              eq: jest.fn().mockResolvedValue({ data: membersWithNoQuests, error: null })
            })
          };
        } else if (table === "quest_instances") {
          questInstancesCalls.count++;

          if (questInstancesCalls.count === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            };
          } else if (questInstancesCalls.count === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            };
          } else {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            };
          }
        } else if (table === "reward_redemptions") {
          redemptionsCalls.count++;

          if (redemptionsCalls.count === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            };
          } else {
            return {
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({ data: [], error: null })
              })
            };
          }
        }
        return { select: mockSelect };
      });

      const result = await service.getFamilyStatistics(mockFamilyId);

      const dave = result.characterProgress.find(c => c.userId === "user-4");
      expect(dave).toMatchObject({
        userId: "user-4",
        characterName: "Dave the Healer",
        displayName: "Dave",
        level: 1,
        xp: 0,
        gold: 0,
        questsCompleted: 0,
        completionRate: 0, // No quests = 0% completion rate
      });
    });
  });
});
