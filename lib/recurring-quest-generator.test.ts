/**
 * Unit Tests: Recurring Quest Generator
 *
 * Tests for quest generation and expiration logic
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { generateRecurringQuests, expireQuests } from './recurring-quest-generator';
import type { Database } from './types/database-generated';

// Mock Supabase client
const createMockSupabase = () => {
  const mockSupabase = {
    from: jest.fn(),
  } as unknown as SupabaseClient<Database>;

  return mockSupabase;
};

describe('generateRecurringQuests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success with no templates found', async () => {
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

  it('should handle database errors when fetching templates', async () => {
    const mockSupabase = createMockSupabase();

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      }),
    });

    const result = await generateRecurringQuests(mockSupabase);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Failed to fetch templates');
  });

  it('should generate INDIVIDUAL quests for assigned characters', async () => {
    const mockSupabase = createMockSupabase();
    const mockTemplate = {
      id: 'template-1',
      title: 'Daily Chore',
      description: 'Clean your room',
      category: 'DAILY',
      difficulty: 'EASY',
      xp_reward: 10,
      gold_reward: 5,
      family_id: 'family-1',
      is_active: true,
      is_paused: false,
      quest_type: 'INDIVIDUAL',
      recurrence_pattern: 'DAILY',
      assigned_character_ids: ['char-1', 'char-2'],
      created_at: '2025-01-01T00:00:00Z',
    };

    const mockCharacters = [
      { id: 'char-1', user_id: 'user-1' },
      { id: 'char-2', user_id: 'user-2' },
    ];

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'quest_templates') {
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
      } else if (table === 'families') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 'family-1', week_start_day: 0 }],
              error: null,
            }),
          }),
        };
      } else if (table === 'user_profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'gm-user-1' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      } else if (table === 'characters') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockCharacters,
              error: null,
            }),
          }),
        };
      } else if (table === 'quest_instances') {
        // Check if this is a select (idempotency check) or insert
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

  it('should generate FAMILY quest in AVAILABLE status', async () => {
    const mockSupabase = createMockSupabase();
    const mockTemplate = {
      id: 'template-2',
      title: 'Family Chore',
      description: 'Wash dishes',
      category: 'DAILY',
      difficulty: 'MEDIUM',
      xp_reward: 20,
      gold_reward: 10,
      family_id: 'family-1',
      is_active: true,
      is_paused: false,
      quest_type: 'FAMILY',
      recurrence_pattern: 'WEEKLY',
      assigned_character_ids: [],
      created_at: '2025-01-01T00:00:00Z',
    };

    let callCount = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'quest_templates') {
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
      } else if (table === 'families') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 'family-1', week_start_day: 1 }],
              error: null,
            }),
          }),
        };
      } else if (table === 'user_profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'gm-user-1' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      } else if (table === 'quest_instances') {
        callCount++;
        if (callCount === 1) {
          // Idempotency check
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
        } else {
          // Insert call
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      }
    });

    const result = await generateRecurringQuests(mockSupabase);

    expect(result.success).toBe(true);
    expect(result.generated.individual).toBe(0);
    expect(result.generated.family).toBe(1);
    expect(result.generated.total).toBe(1);
  });

  it('should skip quest generation if already exists (idempotency)', async () => {
    const mockSupabase = createMockSupabase();
    const mockTemplate = {
      id: 'template-3',
      title: 'Daily Task',
      description: 'Morning routine',
      category: 'DAILY',
      difficulty: 'EASY',
      xp_reward: 10,
      gold_reward: 5,
      family_id: 'family-1',
      is_active: true,
      is_paused: false,
      quest_type: 'INDIVIDUAL',
      recurrence_pattern: 'DAILY',
      assigned_character_ids: ['char-1'],
      created_at: '2025-01-01T00:00:00Z',
    };

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'quest_templates') {
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
      } else if (table === 'families') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 'family-1', week_start_day: 0 }],
              error: null,
            }),
          }),
        };
      } else if (table === 'user_profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'gm-user-1' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      } else if (table === 'characters') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 'char-1', user_id: 'user-1' }],
              error: null,
            }),
          }),
        };
      } else if (table === 'quest_instances') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    count: 1, // Quest already exists
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

  it('should silently skip INDIVIDUAL templates with no assigned characters', async () => {
    const mockSupabase = createMockSupabase();
    const mockTemplate = {
      id: 'template-4',
      title: 'Unassigned Task',
      description: 'Task with no characters assigned yet',
      category: 'DAILY',
      difficulty: 'EASY',
      xp_reward: 10,
      gold_reward: 5,
      family_id: 'family-1',
      is_active: true,
      is_paused: false,
      quest_type: 'INDIVIDUAL',
      recurrence_pattern: 'DAILY',
      assigned_character_ids: [], // Empty array - no characters assigned
      created_at: '2025-01-01T00:00:00Z',
    };

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'quest_templates') {
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
      } else if (table === 'families') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 'family-1', week_start_day: 0 }],
              error: null,
            }),
          }),
        };
      } else if (table === 'user_profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'gm-user-1' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
    });

    const result = await generateRecurringQuests(mockSupabase);

    // Should succeed without errors
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.generated.individual).toBe(0);
    expect(result.generated.total).toBe(0);
  });
});

describe('expireQuests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success with no expired quests', async () => {
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

  it('should mark expired quests as MISSED', async () => {
    const mockSupabase = createMockSupabase();
    const expiredQuests = [
      {
        id: 'quest-1',
        template_id: 'template-1',
        assigned_to_id: 'user-1',
        quest_type: 'INDIVIDUAL',
        status: 'PENDING',
      },
      {
        id: 'quest-2',
        template_id: 'template-2',
        assigned_to_id: null,
        quest_type: 'FAMILY',
        status: 'AVAILABLE',
      },
    ];

    let callCount = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'quest_instances') {
        callCount++;
        if (callCount === 1) {
          // Fetch expired quests
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
        } else {
          // Update to MISSED
          return {
            update: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
      } else if (table === 'quest_templates') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 'template-1', is_paused: false }],
              error: null,
            }),
          }),
        };
      } else if (table === 'characters') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'char-1' },
                error: null,
              }),
            }),
          }),
        };
      } else if (table === 'character_quest_streaks') {
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

  it('should not break streaks for paused templates', async () => {
    const mockSupabase = createMockSupabase();
    const expiredQuests = [
      {
        id: 'quest-1',
        template_id: 'template-1',
        assigned_to_id: 'user-1',
        quest_type: 'INDIVIDUAL',
        status: 'PENDING',
      },
    ];

    let callCount = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'quest_instances') {
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
        } else {
          return {
            update: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
      } else if (table === 'quest_templates') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 'template-1', is_paused: true }], // Paused template
              error: null,
            }),
          }),
        };
      }
    });

    const result = await expireQuests(mockSupabase);

    expect(result.success).toBe(true);
    expect(result.expired.total).toBe(1);
    expect(result.streaksBroken).toBe(0); // No streaks broken because template is paused
  });

  it('should handle errors when fetching expired quests', async () => {
    const mockSupabase = createMockSupabase();

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        not: jest.fn().mockReturnValue({
          lt: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      }),
    });

    const result = await expireQuests(mockSupabase);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Failed to fetch expired quests');
  });
});
