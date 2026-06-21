import { AdminUserDetailService } from "./admin-user-detail-service";

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
      select: (...args: unknown[]) => (operations.push(["select", args]), query),
      eq: (...args: unknown[]) => (operations.push(["eq", args]), query),
      gte: (...args: unknown[]) => (operations.push(["gte", args]), query),
      lte: (...args: unknown[]) => (operations.push(["lte", args]), query),
      in: (...args: unknown[]) => (operations.push(["in", args]), query),
      or: (...args: unknown[]) => (operations.push(["or", args]), query),
      order: (...args: unknown[]) => (operations.push(["order", args]), query),
      limit: (...args: unknown[]) => {
        operations.push(["limit", args]);
        return Promise.resolve(result);
      },
      maybeSingle: () => {
        operations.push(["maybeSingle", []]);
        return Promise.resolve(result);
      },
      then: (resolve: (value: QueryResult) => void) => resolve(result),
    };
    calls.push({ table, operations });
    return query;
  };
  return { supabase: { from: jest.fn((table: string) => makeQuery(table)) }, calls };
}

const profileResult = {
  data: {
    id: "hero-1",
    name: "Towner",
    email: "towner@example.test",
    role: "HERO",
    family_id: "family-1",
    created_at: null,
    updated_at: null,
    characters: [{ id: "char-1", name: "Hero", class: "KNIGHT", level: 1, xp: 0, gold: 125, gems: 0, honor_points: 0, created_at: null, updated_at: null }],
  },
  error: null,
};

function ledgerRow(overrides: Record<string, unknown>) {
  return {
    id: "ledger-1",
    created_at: "2026-01-01T10:00:00Z",
    gold_delta: 100,
    balance_before: 0,
    balance_after: 100,
    entry_type: "OPENING_BALANCE",
    source_type: "gold_ledger_remediation",
    source_id: null,
    actor_user_id: null,
    reason: null,
    metadata: {},
    ...overrides,
  };
}

describe("AdminUserDetailService gold ledger", () => {
  it("maps ledger rows with running balance, actor, references, and divergence", async () => {
    const { supabase, calls } = createSupabaseStub({
      user_profiles: [profileResult, { data: [{ id: "gm-1", name: "GM", email: "gm@example.test" }], error: null }],
      quest_instances: [{ data: [], error: null }, { data: [], error: null }],
      gold_ledger_entries: [
        { data: [{ balance_after: 85 }], error: null },
        {
          data: [
            ledgerRow({ id: "ledger-3", created_at: "2026-01-03T13:00:00Z", gold_delta: -20, balance_before: 105, balance_after: 85, entry_type: "ADMIN_ADJUSTMENT", source_type: "admin_gold_adjustment", source_id: "adjustment-1", actor_user_id: "gm-1", reason: "Manual correction after duplicate award" }),
            ledgerRow({ id: "ledger-2", created_at: "2026-01-02T13:00:00Z", gold_delta: 5, balance_before: 100, balance_after: 105, entry_type: "QUEST_REWARD", source_type: "quest_instances", source_id: "quest-1", actor_user_id: null, reason: "Quest reward approved", metadata: { xp_delta: 10 } }),
            ledgerRow({ id: "ledger-1", created_at: "2026-01-01T10:00:00Z", gold_delta: 100, balance_before: 0, balance_after: 100, entry_type: "OPENING_BALANCE", source_type: "gold_ledger_remediation", source_id: null, actor_user_id: "gm-1", reason: "Opening balance from pre-ledger gold" }),
          ],
          error: null,
        },
      ],
    });

    const detail = await new AdminUserDetailService().getUserDetail(supabase as never, requester, "hero-1");

    expect(detail.goldLedger.entries.map((entry) => entry.id)).toEqual(["ledger-1", "ledger-2", "ledger-3"]);
    expect(detail.goldLedger.entries[0]).toEqual(expect.objectContaining({ eventType: "OPENING_BALANCE", direction: "credit", runningBalance: 100, actor: expect.objectContaining({ name: "GM" }), referenceLabel: "gold_ledger_remediation" }));
    expect(detail.goldLedger.entries[2]).toEqual(expect.objectContaining({ eventType: "ADMIN_ADJUSTMENT", direction: "debit", referenceLabel: "admin_gold_adjustment: adjustment-1" }));
    expect(detail.goldLedger.reconciliation).toEqual({ currentGold: 125, ledgerBalance: 85, difference: 40, diverged: true });

    const ledgerCall = calls.find((call) =>
      call.table === "gold_ledger_entries" &&
      call.operations.some((operation) => operation[0] === "select" && String(operation[1][0]).includes("gold_delta")),
    );
    expect(ledgerCall?.operations).toContainEqual(["eq", ["character_id", "char-1"]]);
    expect(ledgerCall?.operations).toContainEqual(["order", ["created_at", { ascending: false }]]);
    expect(ledgerCall?.operations).toContainEqual(["limit", [100]]);
  });

  it("applies display filters without changing authoritative reconciliation", async () => {
    const { supabase, calls } = createSupabaseStub({
      user_profiles: [profileResult, { data: [], error: null }],
      quest_instances: [{ data: [], error: null }, { data: [], error: null }],
      gold_ledger_entries: [{ data: [{ balance_after: 125 }], error: null }, { data: [], error: null }],
    });

    const detail = await new AdminUserDetailService().getUserDetail(supabase as never, requester, "hero-1", {
      ledgerStartDate: "2026-01-01",
      ledgerEndDate: "2026-01-31",
      ledgerEventType: "ADMIN_ADJUSTMENT",
    });

    expect(detail.goldLedger.entries).toEqual([]);
    expect(detail.goldLedger.reconciliation).toEqual({ currentGold: 125, ledgerBalance: 125, difference: 0, diverged: false });

    const latestBalanceCall = calls.find((call) =>
      call.table === "gold_ledger_entries" &&
      call.operations.some((operation) => operation[0] === "select" && operation[1][0] === "balance_after"),
    );
    expect(latestBalanceCall?.operations).not.toContainEqual(["gte", ["created_at", "2026-01-01T00:00:00.000Z"]]);
    expect(latestBalanceCall?.operations).not.toContainEqual(["lte", ["created_at", "2026-01-31T23:59:59.999Z"]]);
    expect(latestBalanceCall?.operations).not.toContainEqual(["eq", ["entry_type", "ADMIN_ADJUSTMENT"]]);

    const ledgerCall = calls.find((call) =>
      call.table === "gold_ledger_entries" &&
      call.operations.some((operation) => operation[0] === "select" && String(operation[1][0]).includes("gold_delta")),
    );
    expect(ledgerCall?.operations).toContainEqual(["gte", ["created_at", "2026-01-01T00:00:00.000Z"]]);
    expect(ledgerCall?.operations).toContainEqual(["lte", ["created_at", "2026-01-31T23:59:59.999Z"]]);
    expect(ledgerCall?.operations).toContainEqual(["eq", ["entry_type", "ADMIN_ADJUSTMENT"]]);
  });

  it("fetches the latest ledger history slice instead of the oldest rows for long histories", async () => {
    const { supabase, calls } = createSupabaseStub({
      user_profiles: [profileResult, { data: [], error: null }],
      quest_instances: [{ data: [], error: null }, { data: [], error: null }],
      gold_ledger_entries: [
        { data: [{ balance_after: 150 }], error: null },
        {
          data: [
            ledgerRow({ id: "ledger-150", created_at: "2026-01-03T00:00:00Z", balance_after: 150 }),
            ledgerRow({ id: "ledger-149", created_at: "2026-01-02T00:00:00Z", balance_after: 149 }),
            ledgerRow({ id: "ledger-148", created_at: "2026-01-01T00:00:00Z", balance_after: 148 }),
          ],
          error: null,
        },
      ],
    });

    const detail = await new AdminUserDetailService().getUserDetail(supabase as never, requester, "hero-1");

    const ledgerCall = calls.find((call) =>
      call.table === "gold_ledger_entries" &&
      call.operations.some((operation) => operation[0] === "select" && String(operation[1][0]).includes("gold_delta")),
    );
    expect(ledgerCall?.operations).toContainEqual(["order", ["created_at", { ascending: false }]]);
    expect(ledgerCall?.operations).toContainEqual(["limit", [100]]);
    expect(detail.goldLedger.entries.map((entry) => entry.id)).toEqual(["ledger-148", "ledger-149", "ledger-150"]);
  });
});
