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

  // Fix P1: guard with appliedLevel so a concurrent advance is not reversed.
  if (levelApplied && prevLevel !== null && appliedLevel !== null) {
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

  // Fix P1: revert rewards before clearing unlocked_at.
  // If stats revert fails, leave unlocked_at set so the achievement is not
  // treated as unlockable again — the character keeps the rewards they already
  // have rather than being allowed to receive them a second time.
  let statsReverted = true;
  if (statsApplied && capturedNewStats) {
    const { error: statsRevertErr } = await writeClient
      .from("characters")
      .update({
        xp: capturedNewStats.xp - totalXp,
        gold: capturedNewStats.gold - totalGold,
      })
      .eq("id", characterId)
      .eq("xp", capturedNewStats.xp)
      .eq("gold", capturedNewStats.gold);
    if (statsRevertErr) {
      statsReverted = false;
      console.error(
        "Critical: failed to revert stats after reward failure:",
        statsRevertErr,
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

  // Fix P2: rows that existed before get upserted with their prior progress;
  // rows that are brand-new (not in prevCascadeSnapshot) get deleted so no
  // phantom achievement rows remain after a failed cascade rollback.
  if (cascadeRows.length > 0) {
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
