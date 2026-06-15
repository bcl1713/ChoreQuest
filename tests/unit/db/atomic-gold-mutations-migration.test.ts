import { readFileSync } from "fs";
import { join } from "path";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260615000001_atomic_gold_mutations.sql"),
  "utf8",
);

describe("atomic gold mutation SQL", () => {
  it("keeps reward redemption debit, redemption row, and audit row in one DB function", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION fn_redeem_reward");
    expect(migration).toMatch(/UPDATE characters\s+SET gold = COALESCE\(characters\.gold, 0\) - COALESCE\(v_reward\.cost, 0\)/);
    expect(migration).toContain("AND COALESCE(characters.gold, 0) >= COALESCE(v_reward.cost, 0)");
    expect(migration).toContain("INSERT INTO reward_redemptions");
    expect(migration).toContain("'STORE_PURCHASE'::transaction_type");
    expect(migration).toContain("RAISE EXCEPTION 'INSUFFICIENT_GOLD'");
  });

  it("keeps quest reward increments and audit row in one DB function", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION fn_apply_quest_reward");
    expect(migration).toMatch(/gold = COALESCE\(characters\.gold, 0\) \+ COALESCE\(p_gold, 0\)/);
    expect(migration).toContain("active_family_quest_id = NULL");
    expect(migration).toContain("AND user_id = p_user_id");
    expect(migration).toContain("'QUEST_REWARD'::transaction_type");
    expect(migration).toContain("p_quest_id");
  });

  it("keeps denied-redemption status and refund audit in one DB function", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION fn_deny_reward_redemption");
    expect(migration).toContain("status = 'DENIED'");
    expect(migration).toContain("AND status = 'PENDING'");
    expect(migration).toContain("PERFORM fn_refund_reward_gold(p_user_id, p_amount, p_redemption_id)");
    expect(migration).toContain("'REWARD_REFUND'::transaction_type");
  });

  it("preserves the Towner incident sequence by composing relative deltas", () => {
    const staleClientBalance = 123;
    const questPayout = 102;
    const rewardCost = 100;

    // The incident ended at 23 because the stale client overwrote gold with
    // 123 - 100. Atomic DB-side deltas must compose to 123 + 102 - 100.
    expect(staleClientBalance + questPayout - rewardCost).toBe(125);
    expect(migration).toMatch(/gold = COALESCE\(characters\.gold, 0\) \+ COALESCE\(p_gold, 0\)/);
    expect(migration).toMatch(/gold = COALESCE\(characters\.gold, 0\) - COALESCE\(v_reward\.cost, 0\)/);
    expect(migration).not.toContain("gold = p_gold");
    expect(migration).not.toContain("gold = v_reward.cost");
  });
});
