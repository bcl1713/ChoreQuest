import { ActivityService } from "@/lib/activity-service";
import { supabase } from "@/lib/supabase";

export const mockFamilyId = "family-123";

export const mockFamilyMembers = [
  {
    id: "user-1",
    name: "Alice",
    characters: {
      name: "Alice the Knight",
      level: 5,
      created_at: "2025-09-01T10:00:00Z",
    },
  },
  {
    id: "user-2",
    name: "Bob",
    characters: {
      name: "Bob the Mage",
      level: 3,
      created_at: "2025-11-01T10:00:00Z",
    },
  },
];

export const mockCompletedQuests = [
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

export const mockSubmittedQuests = [
  {
    id: "quest-3",
    title: "Walk the dog",
    assigned_to_id: "user-1",
    updated_at: "2025-10-15T12:00:00Z",
    status: "SUBMITTED",
  },
];

export const mockRedemptions = [
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

export const createActivityService = () => {
  const service = new ActivityService();
  const mockFrom = jest.fn();
  (supabase.from as jest.Mock) = mockFrom;
  return { service, mockFrom };
};

export const applyDefaultActivityMocks = (mockFrom: jest.Mock) => {
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
    }
    if (table === "quest_instances") {
      questInstancesCallCount++;
      if (questInstancesCallCount === 1) {
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
                  data: mockSubmittedQuests,
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
          in: jest
            .fn()
            .mockResolvedValue({ data: mockRedemptions, error: null }),
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
};
