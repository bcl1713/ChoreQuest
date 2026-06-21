import { readFileSync } from "fs";
import { join } from "path";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260621000001_canonical_gold_ledger.sql"),
  "utf8",
);

describe("canonical gold ledger migration", () => {
  it("defines a first-class canonical ledger shape with explicit future-truth semantics", () => {
    expect(migration).toContain("CREATE TYPE gold_ledger_entry_type AS ENUM");
    for (const entryType of [
      "QUEST_REWARD",
      "STORE_PURCHASE",
      "REWARD_REFUND",
      "BOSS_REWARD",
      "ACHIEVEMENT_BONUS",
      "ADMIN_ADJUSTMENT",
      "CLASS_CHANGE_COST",
      "OPENING_BALANCE",
      "MIGRATION",
      "CORRECTION",
    ]) {
      expect(migration).toContain(`'${entryType}'`);
    }

    expect(migration).toContain("CREATE TABLE IF NOT EXISTS gold_ledger_entries");
    expect(migration).toMatch(/character_id UUID NOT NULL REFERENCES characters\(id\)/);
    expect(migration).toMatch(/user_id UUID NOT NULL REFERENCES user_profiles\(id\)/);
    expect(migration).toMatch(/gold_delta INTEGER NOT NULL/);
    expect(migration).toMatch(/balance_after INTEGER NOT NULL/);
    expect(migration).toMatch(/actor_user_id UUID REFERENCES user_profiles\(id\)/);
    expect(migration).toMatch(/source_type TEXT NOT NULL/);
    expect(migration).toMatch(/source_id UUID/);
    expect(migration).toMatch(/reason TEXT/);
    expect(migration).toMatch(/metadata JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
    expect(migration).toContain("honest forward truth");
    expect(migration).toContain("DROP FUNCTION IF EXISTS fn_change_character_class(UUID, TEXT)");
  });

  it("records exactly one canonical ledger row from each day-1 gold mutation helper", () => {
    for (const functionName of [
      "fn_apply_quest_reward",
      "fn_redeem_reward",
      "fn_refund_reward_gold",
      "fn_apply_boss_reward",
      "fn_unlock_achievements_and_grant_rewards",
      "fn_change_character_class",
      "fn_record_admin_gold_adjustment",
      "fn_record_opening_gold_balance",
      "fn_record_gold_migration_entry",
      "fn_record_gold_correction_entry",
    ]) {
      const functionBlock = migration.match(
        new RegExp(`CREATE OR REPLACE FUNCTION ${functionName}[\\s\\S]*?END;\\n\\$\\$`, "i"),
      )?.[0] ?? migration.match(
        new RegExp(`CREATE OR REPLACE FUNCTION ${functionName}[\\s\\S]*?LANGUAGE sql`, "i"),
      )?.[0] ?? "";

      expect(functionBlock).toContain("fn_insert_gold_ledger_entry");
      expect(functionBlock.match(/fn_insert_gold_ledger_entry/g)).toHaveLength(1);
    }
  });

  it("makes running-balance reconciliation explicit and transactionally tied to balance updates", () => {
    expect(migration).toMatch(/SELECT COALESCE\(gold, 0\)[\s\S]*FOR UPDATE/);
    expect(migration).toContain("CHECK (balance_after = balance_before + gold_delta)");
    expect(migration).toContain("UNIQUE (source_type, source_id)");
    expect(migration).toContain("ALTER TABLE gold_ledger_entries ENABLE ROW LEVEL SECURITY");
  });

  it("does not expose the class-change SECURITY DEFINER RPC directly to browser-authenticated callers", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION fn_change_character_class(UUID, TEXT) FROM PUBLIC",
    );
    expect(migration).toContain(
      "REVOKE EXECUTE ON FUNCTION fn_change_character_class(UUID, TEXT) FROM authenticated",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION fn_change_character_class(UUID, TEXT) TO service_role",
    );
    expect(migration).not.toContain(
      "GRANT EXECUTE ON FUNCTION fn_change_character_class(UUID, TEXT) TO authenticated",
    );
  });
});
