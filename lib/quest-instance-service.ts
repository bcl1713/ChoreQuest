/**
 * Quest Instance Service
 * Handles family quest claiming, release, and assignment operations
 * Implements anti-hoarding logic (one family quest per hero) and volunteer bonuses
 */

import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import { QuestInstance } from "@/lib/types/database";
import { StreakService } from "@/lib/streak-service";
import type { AchievementProgressService } from "@/lib/achievement-progress-service";
import { approveQuest } from "./quest-instance/approve-quest";
import { assignQuest } from "./quest-instance/assign-quest";
import { claimQuest } from "./quest-instance/claim-quest";
import { releaseQuest } from "./quest-instance/release-quest";

export class QuestInstanceService {
  private readonly streakService: StreakService;
  private readonly progressService?: Pick<
    AchievementProgressService,
    "updateProgress"
  >;

  constructor(
    private readonly client: SupabaseClient<Database> = supabase,
    streakServiceInstance?: StreakService,
    progressServiceInstance?: Pick<
      AchievementProgressService,
      "updateProgress"
    >,
  ) {
    this.streakService =
      streakServiceInstance ?? new StreakService(this.client);
    this.progressService = progressServiceInstance;
  }

  /**
   * Claim a family quest for a hero (hero volunteers for the quest)
   * - Validates quest is AVAILABLE and FAMILY type
   * - Checks hero doesn't already have an active family quest (anti-hoarding)
   * - Sets assigned_to_id, volunteered_by, and calculates 20% volunteer_bonus
   * - Sets status to CLAIMED (indicates volunteer bonus applies)
   * - Updates character.active_family_quest_id
   * @param questId - The quest instance ID to claim
   * @param characterId - The character claiming the quest
   * @returns The claimed quest instance with CLAIMED status and volunteer bonus
   */
  async claimQuest(
    questId: string,
    characterId: string,
  ): Promise<QuestInstance> {
    return claimQuest({ client: this.client }, questId, characterId);
  }

  /**
   * Release a claimed family quest back to AVAILABLE status
   * - Can be called by the hero who claimed it or by a GM
   * - Clears assigned_to_id, volunteered_by, and volunteer_bonus
   * - Updates character.active_family_quest_id to null
   * @param questId - The quest instance ID to release
   * @param characterId - The character releasing the quest (for validation)
   * @returns The released quest instance
   */
  async releaseQuest(
    questId: string,
    characterId: string,
  ): Promise<QuestInstance> {
    return releaseQuest({ client: this.client }, questId, characterId);
  }

  /**
   * Assign a family quest to a specific hero (GM manual assignment, not volunteer)
   * - No volunteer bonus applied (only for self-claimed quests)
   * - Sets assigned_to_id and volunteered_by for tracking
   * - Sets status to PENDING (indicates no volunteer bonus applies)
   * - Updates character.active_family_quest_id
   * @param questId - The quest instance ID to assign
   * @param characterId - The character to assign the quest to
   * @param _gmId - The GM user ID performing the assignment (unused, kept for API compatibility)
   * @returns The assigned quest instance with PENDING status and no volunteer bonus
   */
  async assignQuest(
    questId: string,
    characterId: string,
    _gmId: string,
  ): Promise<QuestInstance> {
    void _gmId;
    return assignQuest({ client: this.client }, questId, characterId);
  }

  /**
   * Approve a completed quest and distribute rewards
   * - Validates quest is in a completable state (COMPLETED, IN_PROGRESS, or CLAIMED)
   * - Fetches assigned character and quest template
   * - Calculates total rewards (base + volunteer bonus + streak bonus)
   * - Updates character stats (gold, xp, level)
   * - Increments quest streak for recurring quests
   * - Sets quest status to APPROVED
   *
   * Note: CLAIMED status quests keep their volunteer bonus when approved
   * PENDING status quests have no volunteer bonus
   *
   * @param questId - The quest instance ID to approve
   * @returns The approved quest instance
   */
  async approveQuest(questId: string): Promise<QuestInstance> {
    return approveQuest(
      {
        client: this.client,
        streakService: this.streakService,
        progressService: this.progressService,
      },
      questId,
    );
  }
}

// Export a singleton instance
export const questInstanceService = new QuestInstanceService();
