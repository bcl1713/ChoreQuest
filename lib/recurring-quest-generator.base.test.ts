import { generateRecurringQuests } from "./recurring-quest-generator";
import { createMockSupabase } from "./recurring-quest-generator.fixtures";

describe("generateRecurringQuests - base behaviors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success with no templates found", async () => {
    const mockSupabase = createMockSupabase();

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    });

    const result = await generateRecurringQuests(mockSupabase);

    expect(result.success).toBe(true);
    expect(result.generated.total).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it("should handle database errors when fetching templates", async () => {
    const mockSupabase = createMockSupabase();

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database connection failed" },
            }),
          }),
        }),
      }),
    });

    const result = await generateRecurringQuests(mockSupabase);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Failed to fetch templates");
  });

  it("should generate INDIVIDUAL quests for assigned characters", async () => {
    const mockSupabase = createMockSupabase();
    const mockTemplate = {
      id: "template-1",
      title: "Daily Chore",
      description: "Clean your room",
      category: "DAILY",
      difficulty: "EASY",
      xp_reward: 10,
      gold_reward: 5,
      family_id: "family-1",
      is_active: true,
      is_paused: false,
      quest_type: "INDIVIDUAL",
      recurrence_pattern: "DAILY",
      assigned_character_ids: ["char-1", "char-2"],
      created_at: "2025-01-01T00:00:00Z",
    };

    const mockCharacters = [
      { id: "char-1", user_id: "user-1" },
      { id: "char-2", user_id: "user-2" },
    ];

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
              data: mockCharacters,
              error: null,
            }),
          }),
        };
      }
      if (table === "quest_instances") {
        const mockChain = {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({
            error: null,
          }),
        };
        return mockChain;
      }
      return {};
    });

    const result = await generateRecurringQuests(mockSupabase);

    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
    expect(result.generated.individual).toBe(2);
    expect(result.generated.family).toBe(0);
    expect(result.generated.total).toBe(2);
  });
});
