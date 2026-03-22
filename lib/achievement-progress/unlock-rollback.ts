import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type { AchievementProgressValue } from "./types";

type CascadeRow = {
  character_id: string;
  achievement_id: string;
  progress: AchievementProgressValue;
};

export type RollbackState = {
  levelApplied: boolean;
  prevLevel: number | null;
  /** Fix P1: the level value we wrote; guards against clobbering concurrent advances. */
  appliedLevel: number | null;
  statsApplied: boolean;
  /** Fix P1: post-increment stats snapshot for the conditional SET rollback. */
  capturedNewStats: { xp: number; gold: number } | null;
  totalXp: number;
  totalGold: number;
  lockedIds: string[];
  cascadeRows: CascadeRow[];
  /** Fix P2: pre-upsert snapshot so rollback restores prior values, not null. */
  prevCascadeSnapshot: Array<{ achievement_id: string; progress: unknown }>;
};

export async function performRollback(
  writeClient: SupabaseClient<Database>,
  characterId: string,
  state: RollbackState,
): Promise<void> {
  const {
    levelApplied,
    prevLevel,
    appliedLevel,
    statsApplied,
    capturedNewStats,
    totalXp,
    totalGold,
    lockedIds,
    cascadeRows,
    prevCascadeSnapshot,
  } = state;

  // Revert stats first. If stats revert fails (concurrent write changed xp/gold),
  // we intentionally keep the rewards AND the level — reverting only the level
  // would leave the character with high XP/gold at a low level, which is
  // inconsistent. We also leave unlocked_at set so the achievement cannot be
  // re-triggered for a duplicate reward payout.
  let statsReverted = true;
  if (statsApplied && capturedNewStats) {
    const { data: revertedRows, error: statsRevertErr } = await writeClient
      .from("characters")
      .update({
        xp: capturedNewStats.xp - totalXp,
        gold: capturedNewStats.gold - totalGold,
      })
      .eq("id", characterId)
      .eq("xp", capturedNewStats.xp)
      .eq("gold", capturedNewStats.gold)
      .select("id");
    if (statsRevertErr) {
      statsReverted = false;
      console.error(
        "Critical: failed to revert stats after reward failure:",
        statsRevertErr,
      );
    } else if (!revertedRows || revertedRows.length === 0) {
      // PostgREST returns error: null even when zero rows matched the
      // conditional UPDATE. A zero-row result means a concurrent write changed
      // xp or gold, so the compensation was a no-op. Treat this as a failed
      // rollback to avoid clearing unlocked_at (which would let the same
      // achievement pay out again).
      statsReverted = false;
      console.error(
        "Critical: stats revert matched zero rows (concurrent update); treating as failed rollback",
      );
    }
  }

  // Only revert level after stats are successfully reverted. If stats rollback
  // was skipped (concurrent write), the character keeps rewards + level to stay
  // consistent. The appliedLevel guard prevents clobbering a concurrent advance.
  if (
    statsReverted &&
    levelApplied &&
    prevLevel !== null &&
    appliedLevel !== null
  ) {
    const { error: lvlRevertErr } = await writeClient
      .from("characters")
      .update({ level: prevLevel })
      .eq("id", characterId)
      .eq("level", appliedLevel); // no-op if level changed again
    if (lvlRevertErr) {
      console.error(
        "Critical: failed to revert level after reward failure:",
        lvlRevertErr,
      );
    }
  }

  // Only clear unlocked_at after rewards are successfully reverted.
  if (statsReverted && lockedIds.length > 0) {
    const { error: revertError } = await writeClient
      .from("character_achievements")
      .update({ unlocked_at: null })
      .eq("character_id", characterId)
      .in("achievement_id", lockedIds);
    if (revertError) {
      console.error(
        "Critical: failed to revert unlock after reward failure:",
        revertError,
      );
    }
  }

  // Cascade progress rollback: only revert when stats were successfully rolled
  // back. When stats rollback failed, the character keeps their rewards and
  // unlocked achievements, so cascade progress (xp_earned, level_reached,
  // compound) must also be preserved to stay consistent with the actual
  // character state.
  if (statsReverted && cascadeRows.length > 0) {
    const snapshotIds = new Set(
      prevCascadeSnapshot.map((p) => p.achievement_id),
    );
    const newIds = cascadeRows
      .filter((r) => !snapshotIds.has(r.achievement_id))
      .map((r) => r.achievement_id);
    const restoreRows = cascadeRows
      .filter((r) => snapshotIds.has(r.achievement_id))
      .map((r) => {
        const prior = prevCascadeSnapshot.find(
          (p) => p.achievement_id === r.achievement_id,
        )!;
        return {
          character_id: characterId,
          achievement_id: r.achievement_id,
          progress: prior.progress as AchievementProgressValue,
        };
      });

    if (restoreRows.length > 0) {
      const { error: cascadeRevertErr } = await writeClient
        .from("character_achievements")
        .upsert(restoreRows, { onConflict: "character_id,achievement_id" });
      if (cascadeRevertErr) {
        console.error(
          "Critical: failed to revert cascade progress after failure:",
          cascadeRevertErr,
        );
      }
    }

    if (newIds.length > 0) {
      const { error: cascadeDeleteErr } = await writeClient
        .from("character_achievements")
        .delete()
        .eq("character_id", characterId)
        .in("achievement_id", newIds);
      if (cascadeDeleteErr) {
        console.error(
          "Critical: failed to delete phantom cascade rows after failure:",
          cascadeDeleteErr,
        );
      }
    }
  }
}
