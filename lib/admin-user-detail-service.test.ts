import { AdminUserDetailService } from "./admin-user-detail-service";
import { ForbiddenError, NotFoundError } from "./errors";

const requester = {
  id: "gm-1",
  role: "GUILD_MASTER" as const,
  family_id: "family-1",
};

type QueryResult = { data: unknown; error: unknown };

function createSupabaseStub(results: Record<string, QueryResult | QueryResult[]>) {
  const calls: Array<{ table: string; operations: Array<[string, unknown[]]> }> = [];
  const callCounts: Record<string, number> = {};

  const nextResult = (table: string): QueryResult => {
    const result = results[table];
    if (Array.isArray(result)) {
      const index = callCounts[table] ?? 0;
      callCounts[table] = index + 1;
      return result[index] ?? result[result.length - 1];
    }
    return result ?? { data: null, error: null };
  };

  const makeQuery = (table: string) => {
    const result = nextResult(table);
    const operations: Array<[string, unknown[]]> = [];
    const query: Record<string, unknown> = {
      select: (...args: unknown[]) => {
        operations.push(["select", args]);
        return query;
      },
      eq: (...args: unknown[]) => {
        operations.push(["eq", args]);
        return query;
      },
      gte: (...args: unknown[]) => {
        operations.push(["gte", args]);
        return query;
      },
      lte: (...args: unknown[]) => {
        operations.push(["lte", args]);
        return query;
      },
      in: (...args: unknown[]) => {
        operations.push(["in", args]);
        return query;
      },
      or: (...args: unknown[]) => {
        operations.push(["or", args]);
        return query;
      },
      order: (...args: unknown[]) => {
        operations.push(["order", args]);
        return query;
      },
      limit: (...args: unknown[]) => {
        operations.push(["limit", args]);
        return Promise.resolve(result);
      },
      maybeSingle: () => {
        operations.push(["maybeSingle", []]);
        return Promise.resolve(result);
      },
      then: (resolve: (value: QueryResult) => void) => {
        resolve(result);
      },
    };
    calls.push({ table, operations });
    return query;
  };

  return {
    supabase: { from: jest.fn((table: string) => makeQuery(table)) },
    calls,
  };
}

describe("AdminUserDetailService", () => {
  it("returns same-family profile, character stats, quest counts, and bounded recent approved quests", async () => {
    const { supabase, calls } = createSupabaseStub({
      user_profiles: {
        data: {
          id: "hero-1",
          name: "Towner",
          email: "towner@example.test",
          role: "HERO",
          family_id: "family-1",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
          characters: [
            {
              id: "char-1",
              name: "Towner the Brave",
              class: "KNIGHT",
              level: 7,
              xp: 340,
              gold: 125,
              gems: 4,
              honor_points: 9,
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-01-02T00:00:00Z",
            },
          ],
        },
        error: null,
      },
      gold_ledger_entries: { data: [], error: null },
      quest_instances: [
        {
          data: [
            { id: "quest-1", title: "Unload dishwasher", status: "APPROVED", due_date: "2026-01-03T00:00:00Z", completed_at: "2026-01-02T12:00:00Z", approved_at: "2026-01-02T13:00:00Z", gold_reward: 5, xp_reward: 10 },
            { id: "quest-2", title: "Practice piano", status: "COMPLETED", due_date: null, completed_at: "2026-01-04T12:00:00Z", approved_at: null, gold_reward: 10, xp_reward: 15 },
            { id: "quest-3", title: "Take trash out", status: "IN_PROGRESS", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-4", title: "Read", status: "CLAIMED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-5", title: "Old missed", status: "MISSED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-6", title: "Old approved", status: "APPROVED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-7", title: "Old approved 2", status: "APPROVED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-8", title: "Old approved 3", status: "APPROVED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-9", title: "Older approved outside recent", status: "APPROVED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
          ],
          error: null,
        },
        {
          data: [
            { id: "quest-1", title: "Unload dishwasher", status: "APPROVED", due_date: "2026-01-03T00:00:00Z", completed_at: "2026-01-02T12:00:00Z", approved_at: "2026-01-02T13:00:00Z", gold_reward: 5, xp_reward: 10 },
            { id: "quest-2", title: "Practice piano", status: "COMPLETED", due_date: null, completed_at: "2026-01-04T12:00:00Z", approved_at: null, gold_reward: 10, xp_reward: 15 },
            { id: "quest-3", title: "Take trash out", status: "IN_PROGRESS", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-4", title: "Read", status: "CLAIMED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-5", title: "Old missed", status: "MISSED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-6", title: "Old approved", status: "APPROVED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-7", title: "Old approved 2", status: "APPROVED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-8", title: "Old approved 3", status: "APPROVED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
            { id: "quest-9", title: "Older approved outside recent", status: "APPROVED", due_date: null, completed_at: null, approved_at: null, gold_reward: 3, xp_reward: 6 },
          ],
          error: null,
        },
      ],
    });

    const detail = await new AdminUserDetailService().getUserDetail(
      supabase as never,
      requester,
      "hero-1",
    );

    expect(detail.user).toEqual(
      expect.objectContaining({ id: "hero-1", name: "Towner", role: "HERO" }),
    );
    expect(detail.character).toEqual(
      expect.objectContaining({
        id: "char-1",
        name: "Towner the Brave",
        class: "KNIGHT",
        level: 7,
        xp: 340,
        gold: 125,
        gems: 4,
        honor: 9,
      }),
    );
    expect(detail.questSummary).toEqual({
      active: 2,
      pendingApproval: 1,
      approved: 5,
      missed: 1,
      total: 9,
    });
    expect(detail.recentQuests).toHaveLength(5);
    expect(detail.recentQuests.map((quest) => quest.status)).toEqual([
      "APPROVED",
      "APPROVED",
      "APPROVED",
      "APPROVED",
      "APPROVED",
    ]);
    expect(detail.recentQuests[0]).toEqual(
      expect.objectContaining({ title: "Unload dishwasher", status: "APPROVED" }),
    );
    expect(detail.goldLedger.entries).toEqual([]);

    const recentQuestCall = calls[2];
    expect(recentQuestCall.table).toBe("quest_instances");
    expect(recentQuestCall.operations).toContainEqual(["eq", ["status", "APPROVED"]]);
    expect(recentQuestCall.operations).toContainEqual(["limit", [8]]);
  });

  it("hides cross-family users behind not found", async () => {
    const { supabase } = createSupabaseStub({
      user_profiles: {
        data: {
          id: "hero-2",
          name: "Other Hero",
          email: "other@example.test",
          role: "HERO",
          family_id: "other-family",
          created_at: null,
          updated_at: null,
          characters: [],
        },
        error: null,
      },
      quest_instances: { data: [], error: null },
    });

    await expect(
      new AdminUserDetailService().getUserDetail(
        supabase as never,
        requester,
        "hero-2",
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("allows a same-family user with no character data", async () => {
    const { supabase } = createSupabaseStub({
      user_profiles: {
        data: {
          id: "hero-3",
          name: "Characterless Hero",
          email: "new@example.test",
          role: "YOUNG_HERO",
          family_id: "family-1",
          created_at: null,
          updated_at: null,
          characters: [],
        },
        error: null,
      },
      quest_instances: { data: [], error: null },
    });

    const detail = await new AdminUserDetailService().getUserDetail(
      supabase as never,
      requester,
      "hero-3",
    );

    expect(detail.character).toBeNull();
    expect(detail.questSummary).toEqual({
      active: 0,
      pendingApproval: 0,
      approved: 0,
      missed: 0,
      total: 0,
    });
    expect(detail.recentQuests).toEqual([]);
  });

  it("rejects non-Guild-Master requesters before looking up the target", async () => {
    const { supabase } = createSupabaseStub({});

    await expect(
      new AdminUserDetailService().getUserDetail(
        supabase as never,
        { id: "hero", role: "HERO", family_id: "family-1" },
        "hero-1",
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
