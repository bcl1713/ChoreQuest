import { readFileSync } from "fs";
import { join } from "path";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260621000002_gold_ledger_remediation.sql"),
  "utf8",
);

function functionBlock(name: string): string {
  return migration.match(
    new RegExp(`CREATE OR REPLACE FUNCTION ${name}[\\s\\S]*?END;\\n\\$\\$`, "i"),
  )?.[0] ?? "";
}

describe("gold ledger remediation migration", () => {
  it("documents honest historical remediation strategy in database comments", () => {
    expect(migration).toContain("Historical remediation strategy");
    expect(migration).toContain("reconstructed only when a source transaction has defensible provenance");
    expect(migration).toContain("opening-balance");
    expect(migration).toContain("correction");
    expect(migration).toContain("manual operator review");
  });

  it("exposes dry-run reconciliation without mutating ledger rows", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION fn_dry_run_gold_ledger_reconciliation");
    expect(migration).toMatch(/RETURNS TABLE[\s\S]*stored_gold INTEGER[\s\S]*ledger_gold INTEGER[\s\S]*gold_difference INTEGER/);
    expect(migration).toContain("mismatch_class TEXT");
    expect(migration).toContain("recommended_remediation TEXT");
    expect(functionBlock("fn_dry_run_gold_ledger_reconciliation")).not.toContain("INSERT INTO gold_ledger_entries");
    expect(migration).toContain("unreliable_transaction_count INTEGER");
    expect(migration).toContain("manual_review_item_count");
    expect(functionBlock("fn_dry_run_gold_ledger_reconciliation")).toMatch(
      /WHEN COALESCE\(tt\.reconstructed_candidate_count, 0\) > 0 THEN 'HISTORICAL_RECONSTRUCTION_CANDIDATE'[\s\S]*WHEN cs\.stored_gold = COALESCE\(lt\.ledger_gold, 0\) THEN 'MATCH'/,
    );
  });

  it("plans provenance-bound transaction reconstruction separately from opening and correction entries", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION fn_plan_gold_ledger_remediation");
    for (const path of [
      "RECONSTRUCT_RELIABLE_TRANSACTION",
      "CREATE_OPENING_BALANCE",
      "CREATE_CORRECTION",
      "MANUAL_OPERATOR_REVIEW",
    ]) {
      expect(migration).toContain(path);
    }
    expect(migration).toContain("quest_instances");
    expect(migration).toContain("reward_redemptions");
    expect(migration).not.toContain("reward_redemptions_refund");
    expect(migration).toContain("transactions.related_id IS NOT NULL");
    expect(migration).toContain("qi.assigned_to_id = cs.user_id");
    expect(migration).toContain("qi.status = 'APPROVED'");
    expect(migration).toContain("rr.user_id = cs.user_id");
    expect(migration).toContain("rr.status = 'DENIED'");
    expect(migration).toContain("t.type = 'STORE_PURCHASE'::transaction_type");
    expect(migration).toContain("t.type = 'REWARD_REFUND'::transaction_type");
    expect(migration).toContain("source_provenance_verified");
  });

  it("requires source rows to semantically match transaction type, user, and gold amount", () => {
    const dryRun = functionBlock("fn_dry_run_gold_ledger_reconciliation");
    const plan = functionBlock("fn_plan_gold_ledger_remediation");

    for (const block of [dryRun, plan]) {
      expect(block).toContain("qi.assigned_to_id = cs.user_id");
      expect(block).toContain("qi.status = 'APPROVED'");
      expect(block).toContain("COALESCE(qi.gold_reward, 0) = COALESCE(t.gold_change, 0)");
      expect(block).toContain("rr.user_id = cs.user_id");
      expect(block).toContain("t.type = 'STORE_PURCHASE'::transaction_type");
      expect(block).toContain("t.type = 'REWARD_REFUND'::transaction_type");
      expect(block).toContain("COALESCE(t.gold_change, 0) < 0");
      expect(block).toContain("COALESCE(t.gold_change, 0) > 0");
      expect(block).toContain("rr.status = 'DENIED'");
    }
  });

  it("uses planned review-item count, not net gold, when dry-run predicts manual review", () => {
    const dryRun = functionBlock("fn_dry_run_gold_ledger_reconciliation");

    expect(dryRun).toContain("unreliable_transaction_count");
    expect(dryRun).toContain("COUNT(*) FILTER (WHERE NOT tc.is_reliable)::INTEGER AS unreliable_transaction_count");
    expect(dryRun).toMatch(
      /WHEN COALESCE\(tt\.reconstructed_candidate_count, 0\) > 0 AND COALESCE\(tt\.unreliable_transaction_count, 0\) > 0 THEN 'HISTORICAL_RECONSTRUCTION_CANDIDATE_WITH_MANUAL_REVIEW_ITEMS'[\s\S]*WHEN COALESCE\(tt\.reconstructed_candidate_count, 0\) > 0 THEN 'HISTORICAL_RECONSTRUCTION_CANDIDATE'[\s\S]*WHEN COALESCE\(tt\.unreliable_transaction_count, 0\) > 0 THEN 'MISMATCH_WITH_MANUAL_REVIEW_ITEMS'/,
    );
    expect(dryRun).toContain("RECONSTRUCT_RELIABLE_TRANSACTION_THEN_CORRECT_RESIDUAL_WITH_MANUAL_REVIEW_ITEMS");
    expect(dryRun).not.toContain("WHEN COALESCE(tt.unreliable_transaction_gold, 0) <> 0 THEN 'MISMATCH_WITH_MANUAL_REVIEW_ITEMS'");
  });


  it("gates production-affecting remediation behind explicit approval", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION fn_apply_gold_ledger_remediation");
    expect(migration).toContain("p_approved BOOLEAN DEFAULT FALSE");
    expect(migration).toContain("IF p_approved IS DISTINCT FROM TRUE THEN");
    expect(migration).toContain("RAISE EXCEPTION 'GOLD_LEDGER_REMEDIATION_REQUIRES_EXPLICIT_APPROVAL'");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION fn_apply_gold_ledger_remediation(UUID, BOOLEAN, UUID) TO service_role");
    expect(migration).not.toContain("GRANT EXECUTE ON FUNCTION fn_apply_gold_ledger_remediation(UUID, BOOLEAN, UUID) TO authenticated");
  });
});
