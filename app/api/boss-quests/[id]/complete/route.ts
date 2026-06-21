import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import {
  authenticateAndFetchUserProfile,
  extractBearerToken,
} from "@/lib/api-auth-helpers";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  createServerSupabaseClient,
  createServiceSupabaseClient,
} from "@/lib/supabase-server";
import {
  applyClassBonusIfApproved,
  buildDecisionMap,
  resolveParticipantDecision,
} from "@/lib/boss-quest-rewards";
import { AchievementProgressService } from "@/lib/achievement-progress-service";
import type { CharacterClass } from "@/lib/types/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: bossQuestId } = await params;
    const body = await request.json().catch(() => ({}));
    const decisions = Array.isArray(body?.decisions) ? body.decisions : [];

    const token = extractBearerToken(request);

    const supabase = createServerSupabaseClient(token);
    const serviceSupabase = createServiceSupabaseClient();

    const requesterProfile = await authenticateAndFetchUserProfile(
      supabase,
      token,
    );

    if (requesterProfile.role !== "GUILD_MASTER") {
      throw new ForbiddenError(
        "Only Guild Masters can complete boss quests",
        "BOSS_QUEST_COMPLETE_FORBIDDEN",
      );
    }

    const { data: bossQuest, error: bossError } = await supabase
      .from("boss_battles")
      .select(
        "id, family_id, status, reward_gold, reward_xp, honor_reward, rewards_distributed",
      )
      .eq("id", bossQuestId)
      .maybeSingle();

    if (bossError) {
      throw new AppError(
        `Failed to fetch boss quest: ${bossError.message}`,
        500,
        "BOSS_QUEST_FETCH_FAILED",
      );
    }

    if (!bossQuest) {
      throw new NotFoundError("Boss quest not found", "BOSS_QUEST_NOT_FOUND");
    }

    if (bossQuest.family_id !== requesterProfile.family_id) {
      throw new ForbiddenError(
        "Cannot complete boss quests outside your family",
        "BOSS_QUEST_COMPLETE_FORBIDDEN",
      );
    }

    if (bossQuest.rewards_distributed) {
      return NextResponse.json(
        {
          success: true,
          message: "Boss quest already completed and rewards distributed",
        },
        { status: 200 },
      );
    }

    const { data: participants, error: participantsError } =
      await serviceSupabase
        .from("boss_battle_participants")
        .select(
          "id, user_id, participation_status, awarded_gold, awarded_xp, honor_awarded",
        )
        .eq("boss_battle_id", bossQuestId);

    if (participantsError) {
      throw new AppError(
        `Failed to fetch participants: ${participantsError.message}`,
        500,
        "BOSS_QUEST_PARTICIPANTS_FETCH_FAILED",
      );
    }

    const uniqueParticipantIds = Array.from(
      new Set(
        (participants || [])
          .map((p) => p.user_id)
          .filter((id): id is string => id !== null),
      ),
    );

    const rewardGold = bossQuest.reward_gold ?? 0;
    const rewardXp = bossQuest.reward_xp ?? 0;
    const honorReward = bossQuest.honor_reward ?? 1;

    const nowIso = new Date().toISOString();
    const decisionMap = buildDecisionMap(decisions);

    const rewardTotals: {
      participantId: string;
      rewards: { gold: number; xp: number; honor: number };
      status: string;
    }[] = [];

    for (const participantId of uniqueParticipantIds) {
      const { data: character } = await serviceSupabase
        .from("characters")
        .select("id, gold, xp, honor_points, class")
        .eq("user_id", participantId)
        .maybeSingle();

      const appliedDecision = applyClassBonusIfApproved(
        resolveParticipantDecision(
          participantId,
          decisionMap,
          rewardGold,
          rewardXp,
          honorReward,
        ),
        (character?.class as CharacterClass | null) ?? null,
      );

      rewardTotals.push({
        participantId,
        rewards: {
          gold: appliedDecision.gold,
          xp: appliedDecision.xp,
          honor: appliedDecision.honor,
        },
        status: appliedDecision.status,
      });

      const participantRow = (participants || []).find(
        (p) => p.user_id === participantId,
      );
      if (participantRow?.id) {
        const { error: updateParticipantError } = await serviceSupabase
          .from("boss_battle_participants")
          .update({
            participation_status: appliedDecision.status,
            awarded_gold: appliedDecision.gold,
            awarded_xp: appliedDecision.xp,
            honor_awarded: appliedDecision.honor,
            approved_at: nowIso,
            approved_by: requesterProfile.id,
          })
          .eq("id", participantRow.id);

        if (updateParticipantError) {
          console.error(
            "Failed to update participant approval",
            updateParticipantError,
          );
        }
      }

      if (character && participantRow?.id) {
        const { error: rewardError } = await serviceSupabase.rpc(
          "fn_apply_boss_reward",
          {
            p_character_id: character.id,
            p_user_id: participantId,
            p_boss_battle_id: bossQuestId,
            p_participant_id: participantRow.id,
            p_gold: appliedDecision.gold,
            p_xp: appliedDecision.xp,
            p_honor: appliedDecision.honor,
            p_status: appliedDecision.status,
            p_actor_user_id: requesterProfile.id,
          },
        );

        if (rewardError) {
          console.error(
            "Failed to apply canonical boss quest rewards for character",
            character.id,
            rewardError,
          );
          console.warn(
            "Skipping achievement progress update after boss completion because character rewards update failed:",
            character.id,
          );
        } else {
          try {
            const progressService = new AchievementProgressService(
              serviceSupabase,
            );
            await progressService.updateProgress(character.id, {
              type: "BOSS_COMPLETED",
            });
          } catch (progressError) {
            console.error(
              "Achievement progress update failed after boss completion (non-blocking):",
              character.id,
              progressError,
            );
          }
        }
      }
    }

    const { error: updateError } = await serviceSupabase
      .from("boss_battles")
      .update({
        status: "DEFEATED",
        rewards_distributed: true,
        defeated_at: new Date().toISOString(),
      })
      .eq("id", bossQuestId);

    if (updateError) {
      throw new AppError(
        `Failed to mark boss quest defeated: ${updateError.message}`,
        500,
        "BOSS_QUEST_COMPLETE_FAILED",
      );
    }

    return NextResponse.json(
      {
        success: true,
        participants: uniqueParticipantIds.length,
        rewards: { gold: rewardGold, xp: rewardXp, honor: honorReward },
        appliedRewards: rewardTotals,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export {
  resolveParticipantDecision,
  applyClassBonusIfApproved,
  buildCharacterRewardUpdate,
} from "@/lib/boss-quest-rewards";
