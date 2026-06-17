import { generateRecurringQuests } from "./recurring-quest-generator";
import { createMockSupabase } from "./recurring-quest-generator.fixtures";

describe("generateRecurringQuests - family and edge cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate FAMILY quest in AVAILABLE status", async () => {
    const mockSupabase = createMockSupabase();
    const mockTemplate = {
      id: "template-2",
      title: "Family Chore",
      description: "Wash dishes",
      category: "DAILY",
      difficulty: "MEDIUM",
      xp_reward: 20,
      gold_reward: 10,
      family_id: "family-1",
      is_active: true,
      is_paused: false,
      quest_type: "FAMILY",
      recurrence_pattern: "WEEKLY",
      assigned_character_ids: [],
      created_at: "2025-01-01T00:00:00Z",
    };

    let callCount = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "quest_templates") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockResolvedValue({
                  data: [mockTemplate],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "families") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: "family-1", week_start_day: 1 }],
              error: null,
            }),
          }),
        };
      }
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "gm-user-1" },
                  error: null,
                }),
              }),
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
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockResolvedValue({
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };
      }
    });

    const result = await generateRecurringQuests(mockSupabase);

    expect(result.success).toBe(true);
    expect(result.generated.individual).toBe(0);
    expect(result.generated.family).toBe(1);
    expect(result.generated.total).toBe(1);
  });

  it("should skip quest generation if already exists (idempotency)", async () => {
    const mockSupabase = createMockSupabase();
    const mockTemplate = {
      id: "template-3",
      title: "Daily Task",
      description: "Morning routine",
      category: "DAILY",
      difficulty: "EASY",
      xp_reward: 10,
      gold_reward: 5,
      family_id: "family-1",
      is_active: true,
      is_paused: false,
      quest_type: "INDIVIDUAL",
      recurrence_pattern: "DAILY",
      assigned_character_ids: ["char-1"],
      created_at: "2025-01-01T00:00:00Z",
    };

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "quest_templates") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockResolvedValue({
                  data: [mockTemplate],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "families") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: "family-1", week_start_day: 0 }],
              error: null,
            }),
          }),
        };
      }
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "gm-user-1" },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "characters") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: "char-1", user_id: "user-1" }],
              error: null,
            }),
          }),
        };
      }
      if (table === "quest_instances") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    count: 1,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
    });

    const result = await generateRecurringQuests(mockSupabase);

    expect(result.success).toBe(true);
    expect(result.generated.total).toBe(0);
  });

  it("should silently skip INDIVIDUAL templates with no assigned characters", async () => {
    const mockSupabase = createMockSupabase();
    const mockTemplate = {
      id: "template-4",
      title: "Unassigned Task",
      description: "Task with no characters assigned yet",
      category: "DAILY",
      difficulty: "EASY",
      xp_reward: 10,
      gold_reward: 5,
      family_id: "family-1",
      is_active: true,
      is_paused: false,
      quest_type: "INDIVIDUAL",
      recurrence_pattern: "DAILY",
      assigned_character_ids: [],
      created_at: "2025-01-01T00:00:00Z",
    };

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "quest_templates") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockResolvedValue({
                  data: [mockTemplate],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "families") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: "family-1", week_start_day: 0 }],
              error: null,
            }),
          }),
        };
      }
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "gm-user-1" },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
    });

    const result = await generateRecurringQuests(mockSupabase);

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.generated.individual).toBe(0);
    expect(result.generated.total).toBe(0);
  });
});
