import { StatisticsService } from "@/lib/statistics-service";
import { supabase } from "@/lib/supabase";

export const mockFamilyId = "family-123";
export const now = new Date("2025-10-15T12:00:00Z");

export const mockFamilyMembers = [
  {
    id: "user-1",
    name: "Alice",
    characters: {
      name: "Alice the Knight",
      level: 5,
      xp: 1200,
      gold: 500,
      gems: 50,
      honor_points: 12,
      class: "KNIGHT",
    },
  },
  {
    id: "user-2",
    name: "Bob",
    characters: {
      name: "Bob the Mage",
      level: 3,
      xp: 600,
      gold: 300,
      gems: 30,
      honor_points: 8,
      class: "MAGE",
    },
  },
  {
    id: "user-3",
    name: "Carol",
    characters: {
      name: "Carol the Rogue",
      level: 4,
      xp: 900,
      gold: 450,
      gems: 40,
      honor_points: 10,
      class: "ROGUE",
    },
  },
];

export const mockCompletedQuests = [
  {
    id: "q1",
    status: "COMPLETED",
    assigned_to_id: "user-1",
    completed_at: "2025-10-14T10:00:00Z",
    approved_at: "2025-10-14T11:00:00Z",
  },
  {
    id: "q2",
    status: "COMPLETED",
    assigned_to_id: "user-1",
    completed_at: "2025-10-15T10:00:00Z",
    approved_at: "2025-10-15T11:00:00Z",
  },
  {
    id: "q3",
    status: "COMPLETED",
    assigned_to_id: "user-2",
    completed_at: "2025-10-14T10:00:00Z",
    approved_at: "2025-10-14T11:00:00Z",
  },
  {
    id: "q4",
    status: "COMPLETED",
    assigned_to_id: "user-1",
    completed_at: "2025-10-08T10:00:00Z",
    approved_at: "2025-10-08T11:00:00Z",
  },
  {
    id: "q5",
    status: "COMPLETED",
    assigned_to_id: "user-3",
    completed_at: "2025-10-09T10:00:00Z",
    approved_at: "2025-10-09T11:00:00Z",
  },
  {
    id: "q6",
    status: "COMPLETED",
    assigned_to_id: "user-1",
    completed_at: "2025-10-02T10:00:00Z",
    approved_at: "2025-10-02T11:00:00Z",
  },
  {
    id: "q7",
    status: "COMPLETED",
    assigned_to_id: "user-2",
    completed_at: "2025-10-03T10:00:00Z",
    approved_at: "2025-10-03T11:00:00Z",
  },
  {
    id: "q8",
    status: "COMPLETED",
    assigned_to_id: "user-3",
    completed_at: "2025-09-20T10:00:00Z",
    approved_at: "2025-09-20T11:00:00Z",
  },
  {
    id: "q9",
    status: "COMPLETED",
    assigned_to_id: "user-3",
    completed_at: "2025-09-25T10:00:00Z",
    approved_at: "2025-09-25T11:00:00Z",
  },
];

export const mockAllQuests = [
  ...mockCompletedQuests.map((q) => ({
    id: q.id,
    status: q.status,
    assigned_to_id: q.assigned_to_id,
  })),
  { id: "q10", status: "IN_PROGRESS", assigned_to_id: "user-1" },
  { id: "q11", status: "SUBMITTED", assigned_to_id: "user-2" },
];

export const mockPendingQuests = [{ id: "q11" }];

export const mockPendingRedemptions = [
  { id: "r1", user_id: "user-2" },
  { id: "r2", user_id: "user-3" },
];

export const mockAllRedemptions = [
  { id: "r1", requested_at: "2025-10-14T10:00:00Z", user_id: "user-2" },
  { id: "r2", requested_at: "2025-10-15T10:00:00Z", user_id: "user-3" },
  { id: "r3", requested_at: "2025-10-05T10:00:00Z", user_id: "user-1" },
];

export const mockBossBattles = [
  {
    id: "boss-week",
    defeated_at: "2025-10-14T09:00:00Z",
    reward_gold: 60,
    reward_xp: 120,
    rewards_distributed: true,
    status: "DEFEATED",
  },
  {
    id: "boss-month",
    defeated_at: "2025-10-03T12:00:00Z",
    reward_gold: 100,
    reward_xp: 200,
    rewards_distributed: true,
    status: "DEFEATED",
  },
];

export const mockBossParticipants = [
  {
    boss_battle_id: "boss-week",
    user_id: "user-1",
    participation_status: "APPROVED",
    awarded_gold: 63,
    awarded_xp: 126,
  },
  {
    boss_battle_id: "boss-week",
    user_id: "user-2",
    participation_status: "PARTIAL",
    awarded_gold: 30,
    awarded_xp: 120,
  },
  {
    boss_battle_id: "boss-month",
    user_id: "user-2",
    participation_status: "APPROVED",
    awarded_gold: 100,
    awarded_xp: 240,
  },
];

export const createStatisticsService = () => {
  const service = new StatisticsService();
  const mockFrom = jest.fn();
  (supabase.from as jest.Mock) = mockFrom;
  return { service, mockFrom };
};

export const applyStatisticsDefaultMocks = (mockFrom: jest.Mock) => {
  const questInstancesCalls = { count: 0 };
  const redemptionsCalls = { count: 0 };
  const bossBattleCalls = { count: 0 };
  mockFrom.mockImplementation((table: string) => {
    if (table === "user_profiles") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest
            .fn()
            .mockResolvedValue({ data: mockFamilyMembers, error: null }),
        }),
      };
    }
    if (table === "quest_instances") {
      questInstancesCalls.count++;
      if (questInstancesCalls.count === 1) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockResolvedValue({ data: mockCompletedQuests, error: null }),
            }),
          }),
        };
      }
      if (questInstancesCalls.count === 2) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest
                .fn()
                .mockResolvedValue({ data: mockAllQuests, error: null }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest
              .fn()
              .mockResolvedValue({ data: mockPendingQuests, error: null }),
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
              in: jest
                .fn()
                .mockResolvedValue({
                  data: mockPendingRedemptions,
                  error: null,
                }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          in: jest
            .fn()
            .mockResolvedValue({ data: mockAllRedemptions, error: null }),
        }),
      };
    }
    if (table === "boss_battles") {
      bossBattleCalls.count++;
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest
              .fn()
              .mockResolvedValue({ data: mockBossBattles, error: null }),
          }),
        }),
      };
    }
    if (table === "boss_battle_participants" || table === "boss_participants") {
      bossBattleCalls.count++;
      return {
        select: jest.fn().mockReturnValue({
          in: jest
            .fn()
            .mockResolvedValue({ data: mockBossParticipants, error: null }),
        }),
      };
    }
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };
  });
};
