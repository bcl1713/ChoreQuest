import { expireQuests } from "../recurring-quest-generator";
import { createMockSupabase } from "./recurring-quest-generator.fixtures";

describe("expireQuests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success with no expired quests", async () => {
    const mockSupabase = createMockSupabase();

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        not: jest.fn().mockReturnValue({
          lt: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    });

    const result = await expireQuests(mockSupabase);

    expect(result.success).toBe(true);
    expect(result.expired.total).toBe(0);
    expect(result.streaksBroken).toBe(0);
  });

  it("should mark expired quests as MISSED", async () => {
    const mockSupabase = createMockSupabase();
    const expiredQuests = [
      {
        id: "quest-1",
        template_id: "template-1",
        assigned_to_id: "user-1",
        quest_type: "INDIVIDUAL",
        status: "PENDING",
      },
      {
        id: "quest-2",
        template_id: "template-2",
        assigned_to_id: null,
        quest_type: "FAMILY",
        status: "AVAILABLE",
      },
    ];

    let callCount = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "quest_instances") {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({
                    data: expiredQuests,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          update: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      }
      if (table === "quest_templates") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: "template-1", is_paused: false }],
              error: null,
            }),
          }),
        };
      }
      if (table === "characters") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "char-1" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "character_quest_streaks") {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        };
      }
    });

    const result = await expireQuests(mockSupabase);

    expect(result.success).toBe(true);
    expect(result.expired.individual).toBe(1);
    expect(result.expired.family).toBe(1);
    expect(result.expired.total).toBe(2);
    expect(result.streaksBroken).toBe(1);
  });

  it("should clear active family quest assignments for expired family quests with heroes", async () => {
    const mockSupabase = createMockSupabase();
    const expiredQuests = [
      {
        id: "family-quest-1",
        template_id: null,
        assigned_to_id: "user-1",
        quest_type: "FAMILY" as const,
        status: "PENDING",
      },
    ];

    const charactersInMock = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    const charactersUpdateMock = jest.fn().mockReturnValue({
      in: charactersInMock,
    });

    let questInstancesCall = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "quest_instances") {
        questInstancesCall++;
        if (questInstancesCall === 1) {
          return {
            select: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({
                    data: expiredQuests,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          update: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      }

      if (table === "quest_templates") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      }

      if (table === "characters") {
        return {
          update: charactersUpdateMock,
        };
      }

      return {};
    });

    const result = await expireQuests(mockSupabase);

    expect(result.success).toBe(true);
    expect(charactersUpdateMock).toHaveBeenCalledWith({
      active_family_quest_id: null,
    });
    expect(charactersInMock).toHaveBeenCalledWith("active_family_quest_id", [
      "family-quest-1",
    ]);
  });

  it("should not break streaks for paused templates", async () => {
    const mockSupabase = createMockSupabase();
    const expiredQuests = [
      {
        id: "quest-1",
        template_id: "template-1",
        assigned_to_id: "user-1",
        quest_type: "INDIVIDUAL",
        status: "PENDING",
      },
    ];

    let callCount = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "quest_instances") {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({
                    data: expiredQuests,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          update: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      }
      if (table === "quest_templates") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: "template-1", is_paused: true }],
              error: null,
            }),
          }),
        };
      }
    });

    const result = await expireQuests(mockSupabase);

    expect(result.success).toBe(true);
    expect(result.expired.total).toBe(1);
    expect(result.streaksBroken).toBe(0);
  });

  it("should handle errors when fetching expired quests", async () => {
    const mockSupabase = createMockSupabase();

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        not: jest.fn().mockReturnValue({
          lt: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      }),
    });

    const result = await expireQuests(mockSupabase);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Failed to fetch expired quests");
  });
});
