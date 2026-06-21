-- Gold ledger historical remediation and reconciliation (#238).
--
-- Historical remediation strategy: ChoreQuest uses honest forward truth.
-- Canonical future gold mutations are recorded in gold_ledger_entries by the
-- mutation RPCs introduced in #237. Historical rows are reconstructed only when a source transaction has defensible provenance. This means a non-zero transaction
-- where transactions.related_id IS NOT NULL, maps to a known source table, the
-- referenced source row exists for the same user, and the source row
-- semantically matches the transaction type and gold amount.
-- When history cannot be defended, remediation uses an explicit opening-balance
-- entry for pre-ledger state or a correction entry for residual mismatch. Known
-- unsupported or ambiguous historical transaction classes are surfaced for
-- manual operator review rather than being turned into invented faux history.
--
-- Operators should run fn_dry_run_gold_ledger_reconciliation first. The dry-run
-- function reports stored character gold, ledger-derived gold, mismatch class,
-- and recommended remediation without mutating production data. Writes require
-- fn_apply_gold_ledger_remediation(..., p_approved => TRUE), which is restricted
-- to service_role and raises unless explicit approval is supplied.

CREATE OR REPLACE FUNCTION fn_gold_ledger_transaction_provenance(
  p_transaction_type transaction_type,
  p_related_id UUID
)
RETURNS TABLE (
  is_reliable BOOLEAN,
  entry_type gold_ledger_entry_type,
  source_type TEXT,
  source_id UUID,
  review_reason TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT
    CASE
      WHEN p_transaction_type IN ('QUEST_REWARD'::transaction_type, 'STORE_PURCHASE'::transaction_type, 'REWARD_REFUND'::transaction_type)
        AND p_related_id IS NOT NULL THEN TRUE
      ELSE FALSE
    END AS is_reliable,
    CASE p_transaction_type
      WHEN 'QUEST_REWARD'::transaction_type THEN 'QUEST_REWARD'::gold_ledger_entry_type
      WHEN 'STORE_PURCHASE'::transaction_type THEN 'STORE_PURCHASE'::gold_ledger_entry_type
      WHEN 'REWARD_REFUND'::transaction_type THEN 'REWARD_REFUND'::gold_ledger_entry_type
      WHEN 'BOSS_VICTORY'::transaction_type THEN 'BOSS_REWARD'::gold_ledger_entry_type
      WHEN 'BONUS_AWARD'::transaction_type THEN 'ADMIN_ADJUSTMENT'::gold_ledger_entry_type
      ELSE 'MIGRATION'::gold_ledger_entry_type
    END AS entry_type,
    CASE p_transaction_type
      WHEN 'QUEST_REWARD'::transaction_type THEN 'quest_instances'
      WHEN 'STORE_PURCHASE'::transaction_type THEN 'reward_redemptions'
      WHEN 'REWARD_REFUND'::transaction_type THEN 'reward_redemptions_refund'
      WHEN 'BOSS_VICTORY'::transaction_type THEN 'boss_battles'
      WHEN 'BONUS_AWARD'::transaction_type THEN 'transactions'
      ELSE 'transactions'
    END AS source_type,
    p_related_id AS source_id,
    CASE
      WHEN p_transaction_type IN ('QUEST_REWARD'::transaction_type, 'STORE_PURCHASE'::transaction_type, 'REWARD_REFUND'::transaction_type)
        AND p_related_id IS NOT NULL THEN NULL::TEXT
      WHEN p_related_id IS NULL THEN 'transactions.related_id IS NULL; cannot prove historical source row'
      ELSE 'transaction type requires manual operator review before historical reconstruction'
    END AS review_reason;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION fn_dry_run_gold_ledger_reconciliation(
  p_character_id UUID DEFAULT NULL
)
RETURNS TABLE (
  character_id UUID,
  user_id UUID,
  stored_gold INTEGER,
  ledger_gold INTEGER,
  gold_difference INTEGER,
  ledger_entry_count INTEGER,
  reliable_transaction_gold INTEGER,
  unreliable_transaction_gold INTEGER,
  unreliable_transaction_count INTEGER,
  reconstructed_candidate_count INTEGER,
  mismatch_class TEXT,
  recommended_remediation TEXT,
  details JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH character_scope AS (
    SELECT c.id AS character_id, c.user_id, COALESCE(c.gold, 0)::INTEGER AS stored_gold
    FROM characters c
    WHERE p_character_id IS NULL OR c.id = p_character_id
  ), ledger_totals AS (
    SELECT
      gle.character_id,
      COALESCE(SUM(gle.gold_delta), 0)::INTEGER AS ledger_gold,
      COUNT(*)::INTEGER AS ledger_entry_count
    FROM gold_ledger_entries gle
    JOIN character_scope cs ON cs.character_id = gle.character_id
    GROUP BY gle.character_id
  ), transaction_candidates AS (
    SELECT
      cs.character_id,
      t.id AS transaction_id,
      COALESCE(t.gold_change, 0)::INTEGER AS gold_delta,
      (p.is_reliable AND v.source_provenance_verified) AS is_reliable,
      p.source_type,
      p.source_id,
      CASE
        WHEN p.is_reliable AND NOT v.source_provenance_verified THEN v.source_review_reason
        ELSE p.review_reason
      END AS review_reason
    FROM character_scope cs
    JOIN transactions t ON t.user_id = cs.user_id
    CROSS JOIN LATERAL fn_gold_ledger_transaction_provenance(t.type, t.related_id) p
    CROSS JOIN LATERAL (
      SELECT
        CASE
          WHEN p.source_type = 'quest_instances' THEN EXISTS (
            SELECT 1
            FROM quest_instances qi
            WHERE qi.id = t.related_id
              AND qi.assigned_to_id = cs.user_id
              AND qi.status = 'APPROVED'
              AND COALESCE(qi.gold_reward, 0) = COALESCE(t.gold_change, 0)
          )
          WHEN p.source_type = 'reward_redemptions' AND t.type = 'STORE_PURCHASE'::transaction_type THEN EXISTS (
            SELECT 1
            FROM reward_redemptions rr
            WHERE rr.id = t.related_id
              AND rr.user_id = cs.user_id
              AND COALESCE(t.gold_change, 0) < 0
              AND COALESCE(rr.cost, 0) = ABS(COALESCE(t.gold_change, 0))
          )
          WHEN p.source_type = 'reward_redemptions_refund' AND t.type = 'REWARD_REFUND'::transaction_type THEN EXISTS (
            SELECT 1
            FROM reward_redemptions rr
            WHERE rr.id = t.related_id
              AND rr.user_id = cs.user_id
              AND rr.status = 'DENIED'
              AND COALESCE(t.gold_change, 0) > 0
              AND COALESCE(rr.cost, 0) = COALESCE(t.gold_change, 0)
          )
          ELSE FALSE
        END AS source_provenance_verified,
        CASE
          WHEN p.source_type = 'quest_instances' THEN 'quest transaction related_id does not match an approved quest for the same assigned user and gold amount'
          WHEN p.source_type IN ('reward_redemptions', 'reward_redemptions_refund') THEN 'reward transaction related_id does not match a redemption for the same user, transaction direction, status, and gold amount'
          ELSE 'transaction type requires manual operator review before historical reconstruction'
        END AS source_review_reason
    ) v
    WHERE COALESCE(t.gold_change, 0) <> 0
      AND NOT EXISTS (
        SELECT 1
        FROM gold_ledger_entries gle
        WHERE gle.character_id = cs.character_id
          AND gle.source_type = p.source_type
          AND gle.source_id IS NOT DISTINCT FROM p.source_id
      )
  ), transaction_totals AS (
    SELECT
      tc.character_id,
      COALESCE(SUM(tc.gold_delta) FILTER (WHERE tc.is_reliable), 0)::INTEGER AS reliable_transaction_gold,
      COALESCE(SUM(tc.gold_delta) FILTER (WHERE NOT tc.is_reliable), 0)::INTEGER AS unreliable_transaction_gold,
      COUNT(*) FILTER (WHERE NOT tc.is_reliable)::INTEGER AS unreliable_transaction_count,
      COUNT(*) FILTER (WHERE tc.is_reliable)::INTEGER AS reconstructed_candidate_count,
      jsonb_agg(
        jsonb_build_object(
          'transaction_id', tc.transaction_id,
          'gold_delta', tc.gold_delta,
          'source_type', tc.source_type,
          'source_id', tc.source_id,
          'review_reason', tc.review_reason
        ) ORDER BY tc.transaction_id
      ) FILTER (WHERE NOT tc.is_reliable) AS review_items
    FROM transaction_candidates tc
    GROUP BY tc.character_id
  )
  SELECT
    cs.character_id,
    cs.user_id,
    cs.stored_gold,
    COALESCE(lt.ledger_gold, 0)::INTEGER AS ledger_gold,
    (cs.stored_gold - COALESCE(lt.ledger_gold, 0))::INTEGER AS gold_difference,
    COALESCE(lt.ledger_entry_count, 0)::INTEGER AS ledger_entry_count,
    COALESCE(tt.reliable_transaction_gold, 0)::INTEGER AS reliable_transaction_gold,
    COALESCE(tt.unreliable_transaction_gold, 0)::INTEGER AS unreliable_transaction_gold,
    COALESCE(tt.unreliable_transaction_count, 0)::INTEGER AS unreliable_transaction_count,
    COALESCE(tt.reconstructed_candidate_count, 0)::INTEGER AS reconstructed_candidate_count,
    CASE
      WHEN COALESCE(tt.reconstructed_candidate_count, 0) > 0 AND COALESCE(tt.unreliable_transaction_count, 0) > 0 THEN 'HISTORICAL_RECONSTRUCTION_CANDIDATE_WITH_MANUAL_REVIEW_ITEMS'
      WHEN COALESCE(tt.reconstructed_candidate_count, 0) > 0 THEN 'HISTORICAL_RECONSTRUCTION_CANDIDATE'
      WHEN COALESCE(tt.unreliable_transaction_count, 0) > 0 THEN 'MISMATCH_WITH_MANUAL_REVIEW_ITEMS'
      WHEN cs.stored_gold = COALESCE(lt.ledger_gold, 0) THEN 'MATCH'
      WHEN COALESCE(lt.ledger_entry_count, 0) = 0 THEN 'MISSING_OPENING_BALANCE'
      ELSE 'LEDGER_STORED_BALANCE_MISMATCH'
    END AS mismatch_class,
    CASE
      WHEN COALESCE(tt.reconstructed_candidate_count, 0) > 0 AND COALESCE(tt.unreliable_transaction_count, 0) > 0 THEN 'RECONSTRUCT_RELIABLE_TRANSACTION_THEN_CORRECT_RESIDUAL_WITH_MANUAL_REVIEW_ITEMS'
      WHEN COALESCE(tt.reconstructed_candidate_count, 0) > 0 THEN 'RECONSTRUCT_RELIABLE_TRANSACTION_THEN_CORRECT_RESIDUAL'
      WHEN COALESCE(tt.unreliable_transaction_count, 0) > 0 THEN 'MANUAL_OPERATOR_REVIEW_THEN_CREATE_CORRECTION_IF_APPROVED'
      WHEN cs.stored_gold = COALESCE(lt.ledger_gold, 0) THEN 'NO_ACTION'
      WHEN COALESCE(lt.ledger_entry_count, 0) = 0 THEN 'CREATE_OPENING_BALANCE'
      ELSE 'CREATE_CORRECTION'
    END AS recommended_remediation,
    jsonb_build_object(
      'dry_run', TRUE,
      'historical_strategy', 'reconstruct reliable provenance only; use opening-balance/correction entries for undefended residuals',
      'manual_review_item_count', COALESCE(tt.unreliable_transaction_count, 0),
      'manual_review_items', COALESCE(tt.review_items, '[]'::jsonb)
    ) AS details
  FROM character_scope cs
  LEFT JOIN ledger_totals lt ON lt.character_id = cs.character_id
  LEFT JOIN transaction_totals tt ON tt.character_id = cs.character_id
  ORDER BY cs.user_id, cs.character_id;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION fn_plan_gold_ledger_remediation(
  p_character_id UUID DEFAULT NULL
)
RETURNS TABLE (
  character_id UUID,
  user_id UUID,
  action TEXT,
  entry_type gold_ledger_entry_type,
  source_transaction_id UUID,
  source_type TEXT,
  source_id UUID,
  gold_delta INTEGER,
  reason TEXT,
  metadata JSONB,
  requires_operator_review BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH character_scope AS (
    SELECT c.id AS character_id, c.user_id, COALESCE(c.gold, 0)::INTEGER AS stored_gold
    FROM characters c
    WHERE p_character_id IS NULL OR c.id = p_character_id
  ), ledger_totals AS (
    SELECT gle.character_id, COALESCE(SUM(gle.gold_delta), 0)::INTEGER AS ledger_gold, COUNT(*)::INTEGER AS ledger_entry_count
    FROM gold_ledger_entries gle
    JOIN character_scope cs ON cs.character_id = gle.character_id
    GROUP BY gle.character_id
  ), tx AS (
    SELECT
      cs.character_id,
      cs.user_id,
      t.id AS transaction_id,
      t.created_at,
      COALESCE(t.gold_change, 0)::INTEGER AS gold_delta,
      t.description,
      (p.is_reliable AND v.source_provenance_verified) AS is_reliable,
      p.entry_type,
      p.source_type,
      p.source_id,
      CASE
        WHEN p.is_reliable AND NOT v.source_provenance_verified THEN v.source_review_reason
        ELSE p.review_reason
      END AS review_reason
    FROM character_scope cs
    JOIN transactions t ON t.user_id = cs.user_id
    CROSS JOIN LATERAL fn_gold_ledger_transaction_provenance(t.type, t.related_id) p
    CROSS JOIN LATERAL (
      SELECT
        CASE
          WHEN p.source_type = 'quest_instances' THEN EXISTS (
            SELECT 1
            FROM quest_instances qi
            WHERE qi.id = t.related_id
              AND qi.assigned_to_id = cs.user_id
              AND qi.status = 'APPROVED'
              AND COALESCE(qi.gold_reward, 0) = COALESCE(t.gold_change, 0)
          )
          WHEN p.source_type = 'reward_redemptions' AND t.type = 'STORE_PURCHASE'::transaction_type THEN EXISTS (
            SELECT 1
            FROM reward_redemptions rr
            WHERE rr.id = t.related_id
              AND rr.user_id = cs.user_id
              AND COALESCE(t.gold_change, 0) < 0
              AND COALESCE(rr.cost, 0) = ABS(COALESCE(t.gold_change, 0))
          )
          WHEN p.source_type = 'reward_redemptions_refund' AND t.type = 'REWARD_REFUND'::transaction_type THEN EXISTS (
            SELECT 1
            FROM reward_redemptions rr
            WHERE rr.id = t.related_id
              AND rr.user_id = cs.user_id
              AND rr.status = 'DENIED'
              AND COALESCE(t.gold_change, 0) > 0
              AND COALESCE(rr.cost, 0) = COALESCE(t.gold_change, 0)
          )
          ELSE FALSE
        END AS source_provenance_verified,
        CASE
          WHEN p.source_type = 'quest_instances' THEN 'quest transaction related_id does not match an approved quest for the same assigned user and gold amount'
          WHEN p.source_type IN ('reward_redemptions', 'reward_redemptions_refund') THEN 'reward transaction related_id does not match a redemption for the same user, transaction direction, status, and gold amount'
          ELSE 'transaction type requires manual operator review before historical reconstruction'
        END AS source_review_reason
    ) v
    WHERE COALESCE(t.gold_change, 0) <> 0
      AND NOT EXISTS (
        SELECT 1
        FROM gold_ledger_entries gle
        WHERE gle.character_id = cs.character_id
          AND gle.source_type = p.source_type
          AND gle.source_id IS NOT DISTINCT FROM p.source_id
      )
  ), reliable AS (
    SELECT * FROM tx WHERE is_reliable
  ), reliable_totals AS (
    SELECT r.character_id, COALESCE(SUM(r.gold_delta), 0)::INTEGER AS reliable_gold
    FROM reliable r
    GROUP BY r.character_id
  ), base_rows AS (
    SELECT
      cs.character_id,
      cs.user_id,
      COALESCE(lt.ledger_gold, 0)::INTEGER AS ledger_gold,
      COALESCE(lt.ledger_entry_count, 0)::INTEGER AS ledger_entry_count,
      COALESCE(rt.reliable_gold, 0)::INTEGER AS reliable_gold,
      cs.stored_gold,
      (cs.stored_gold - COALESCE(lt.ledger_gold, 0) - COALESCE(rt.reliable_gold, 0))::INTEGER AS residual_delta
    FROM character_scope cs
    LEFT JOIN ledger_totals lt ON lt.character_id = cs.character_id
    LEFT JOIN reliable_totals rt ON rt.character_id = cs.character_id
  )
  SELECT
    r.character_id,
    r.user_id,
    'RECONSTRUCT_RELIABLE_TRANSACTION'::TEXT AS action,
    r.entry_type,
    r.transaction_id AS source_transaction_id,
    r.source_type,
    r.source_id,
    r.gold_delta,
    'Historical transaction reconstructed from defensible transaction provenance'::TEXT AS reason,
    jsonb_build_object(
      'historical_remediation', TRUE,
      'source_transaction_id', r.transaction_id,
      'source_transaction_created_at', r.created_at,
      'source_description', r.description
    ) AS metadata,
    FALSE AS requires_operator_review
  FROM reliable r

  UNION ALL

  SELECT
    br.character_id,
    br.user_id,
    CASE WHEN br.ledger_entry_count = 0 AND br.reliable_gold = 0 THEN 'CREATE_OPENING_BALANCE' ELSE 'CREATE_CORRECTION' END AS action,
    CASE WHEN br.ledger_entry_count = 0 AND br.reliable_gold = 0 THEN 'OPENING_BALANCE'::gold_ledger_entry_type ELSE 'CORRECTION'::gold_ledger_entry_type END AS entry_type,
    NULL::UUID AS source_transaction_id,
    CASE WHEN br.ledger_entry_count = 0 AND br.reliable_gold = 0 THEN 'opening_balance' ELSE 'gold_correction' END AS source_type,
    CASE WHEN br.ledger_entry_count = 0 AND br.reliable_gold = 0 THEN br.character_id ELSE NULL::UUID END AS source_id,
    br.residual_delta AS gold_delta,
    CASE WHEN br.ledger_entry_count = 0 AND br.reliable_gold = 0
      THEN 'Explicit opening-balance entry for pre-ledger gold state'
      ELSE 'Explicit correction entry for residual after reliable historical reconstruction'
    END AS reason,
    jsonb_build_object(
      'historical_remediation', TRUE,
      'stored_gold', br.stored_gold,
      'ledger_gold_before_plan', br.ledger_gold,
      'reliable_reconstruction_gold', br.reliable_gold,
      'residual_delta', br.residual_delta
    ) AS metadata,
    FALSE AS requires_operator_review
  FROM base_rows br
  WHERE br.residual_delta <> 0

  UNION ALL

  SELECT
    tx.character_id,
    tx.user_id,
    'MANUAL_OPERATOR_REVIEW'::TEXT AS action,
    'MIGRATION'::gold_ledger_entry_type AS entry_type,
    tx.transaction_id AS source_transaction_id,
    tx.source_type,
    tx.source_id,
    tx.gold_delta,
    tx.review_reason AS reason,
    jsonb_build_object(
      'historical_remediation', TRUE,
      'manual_review_required', TRUE,
      'source_transaction_id', tx.transaction_id,
      'source_transaction_created_at', tx.created_at,
      'source_description', tx.description
    ) AS metadata,
    TRUE AS requires_operator_review
  FROM tx
  WHERE NOT tx.is_reliable
  ORDER BY 1, 11, 3, 5;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION fn_insert_gold_ledger_remediation_row(
  p_character_id UUID,
  p_user_id UUID,
  p_gold_delta INTEGER,
  p_entry_type gold_ledger_entry_type,
  p_source_type TEXT,
  p_source_id UUID,
  p_actor_user_id UUID,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS gold_ledger_entries AS $$
DECLARE
  v_balance_before INTEGER;
  v_entry gold_ledger_entries%ROWTYPE;
BEGIN
  PERFORM 1 FROM characters WHERE id = p_character_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHARACTER_NOT_FOUND';
  END IF;

  SELECT COALESCE(SUM(gold_delta), 0)::INTEGER
  INTO v_balance_before
  FROM gold_ledger_entries
  WHERE character_id = p_character_id;

  INSERT INTO gold_ledger_entries (
    character_id,
    user_id,
    gold_delta,
    balance_before,
    balance_after,
    entry_type,
    source_type,
    source_id,
    actor_user_id,
    reason,
    metadata
  ) VALUES (
    p_character_id,
    p_user_id,
    COALESCE(p_gold_delta, 0),
    COALESCE(v_balance_before, 0),
    COALESCE(v_balance_before, 0) + COALESCE(p_gold_delta, 0),
    p_entry_type,
    p_source_type,
    p_source_id,
    p_actor_user_id,
    p_reason,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('remediation_inserted_at', NOW())
  )
  RETURNING * INTO v_entry;

  RETURN v_entry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_apply_gold_ledger_remediation(
  p_actor_user_id UUID,
  p_approved BOOLEAN DEFAULT FALSE,
  p_character_id UUID DEFAULT NULL
)
RETURNS TABLE (
  character_id UUID,
  user_id UUID,
  action TEXT,
  entry_id UUID,
  gold_delta INTEGER,
  remediation_status TEXT,
  details JSONB
) AS $$
DECLARE
  v_plan RECORD;
  v_entry gold_ledger_entries%ROWTYPE;
BEGIN
  IF p_approved IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'GOLD_LEDGER_REMEDIATION_REQUIRES_EXPLICIT_APPROVAL';
  END IF;

  FOR v_plan IN SELECT * FROM fn_plan_gold_ledger_remediation(p_character_id) LOOP
    IF v_plan.requires_operator_review THEN
      character_id := v_plan.character_id;
      user_id := v_plan.user_id;
      action := v_plan.action;
      entry_id := NULL;
      gold_delta := v_plan.gold_delta;
      remediation_status := 'SKIPPED_REQUIRES_MANUAL_OPERATOR_REVIEW';
      details := v_plan.metadata || jsonb_build_object('review_reason', v_plan.reason);
      RETURN NEXT;
    ELSE
      SELECT * INTO v_entry FROM fn_insert_gold_ledger_remediation_row(
        v_plan.character_id,
        v_plan.user_id,
        v_plan.gold_delta,
        v_plan.entry_type,
        v_plan.source_type,
        v_plan.source_id,
        p_actor_user_id,
        v_plan.reason,
        v_plan.metadata || jsonb_build_object('remediation_action', v_plan.action)
      );

      character_id := v_plan.character_id;
      user_id := v_plan.user_id;
      action := v_plan.action;
      entry_id := v_entry.id;
      gold_delta := v_plan.gold_delta;
      remediation_status := 'APPLIED';
      details := v_plan.metadata;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION fn_gold_ledger_transaction_provenance(transaction_type, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION fn_dry_run_gold_ledger_reconciliation(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION fn_plan_gold_ledger_remediation(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION fn_insert_gold_ledger_remediation_row(UUID, UUID, INTEGER, gold_ledger_entry_type, TEXT, UUID, UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION fn_apply_gold_ledger_remediation(UUID, BOOLEAN, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION fn_gold_ledger_transaction_provenance(transaction_type, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION fn_dry_run_gold_ledger_reconciliation(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION fn_plan_gold_ledger_remediation(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION fn_insert_gold_ledger_remediation_row(UUID, UUID, INTEGER, gold_ledger_entry_type, TEXT, UUID, UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION fn_apply_gold_ledger_remediation(UUID, BOOLEAN, UUID) TO service_role;
