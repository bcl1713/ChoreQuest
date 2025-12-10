import { NextRequest, NextResponse } from "next/server";
import {
  authenticateAndFetchUserProfile,
  authErrorResponse,
  extractBearerToken,
  isAuthError,
} from "@/lib/api-auth-helpers";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { RewardCalculator } from "@/lib/reward-calculator";
import type { CharacterClass } from "@/lib/types/database";

type DecisionStatus = "APPROVED" | "PARTIAL" | "DENIED";

type ParticipantDecision = {
  status: DecisionStatus;
  gold?: number;
  xp?: number;
  honor?: number;
};

type AppliedDecision = {
  status: DecisionStatus;
  gold: number;
  xp: number;
  honor: number;
};

export function resolveParticipantDecision(
  participantId: string,
  decisionMap: Map<string, ParticipantDecision>,
  rewardGold: number,
  rewardXp: number,
  honorReward: number
): AppliedDecision {
  const rawDecision = decisionMap.get(participantId);
  const normalizedStatus = rawDecision?.status ? String(rawDecision.status).toUpperCase() : null;
  const decision = rawDecision
    ? {
        status:
          normalizedStatus === "PARTIAL"
            ? "PARTIAL"
            : normalizedStatus === "DENIED"
              ? "DENIED"
              : "APPROVED",
        gold: rawDecision.gold,
        xp: rawDecision.xp,
        honor: rawDecision.honor,
      }
    : { status: "APPROVED" as const, gold: rewardGold, xp: rewardXp, honor: honorReward };

  let appliedGold = rewardGold;
  let appliedXp = rewardXp;
  let appliedHonor = honorReward;

  if (decision.status === "PARTIAL") {
    appliedGold = Math.max(0, Math.floor(decision.gold ?? rewardGold));
    appliedXp = Math.max(0, Math.floor(decision.xp ?? rewardXp));
    appliedHonor = Math.max(0, Math.floor(decision.honor ?? honorReward));
  } else if (decision.status === "DENIED") {
    appliedGold = 0;
    appliedXp = 0;
    appliedHonor = 0;
  }

  return {
    status: decision.status,
    gold: appliedGold,
    xp: appliedXp,
    honor: appliedHonor,
  };
}

export function applyClassBonusIfApproved(
  decision: AppliedDecision,
  characterClass: CharacterClass | null
): AppliedDecision {
  if (decision.status !== "APPROVED") {
    return decision;
  }

  const bonus = characterClass
    ? RewardCalculator.getClassBonus(characterClass)
    : { xpBonus: 1, goldBonus: 1, honorBonus: 1, gemsBonus: 1 };

  return {
    ...decision,
    gold: Math.floor(decision.gold * bonus.goldBonus),
    xp: Math.floor(decision.xp * bonus.xpBonus),
    honor: Math.floor(decision.honor * bonus.honorBonus),
  };
}

export function buildCharacterRewardUpdate(
  character: { gold?: number | null; xp?: number | null; honor_points?: number | null; level?: number | null },
  rewards: { gold: number; xp: number; honor: number }
): { gold: number; xp: number; honor_points: number; level: number } {
  const updatedGold = (character.gold || 0) + rewards.gold;
  const updatedXp = (character.xp || 0) + rewards.xp;
  const updatedHonor = (character.honor_points || 0) + rewards.honor;
  const derivedLevel = RewardCalculator.calculateLevelFromTotalXP(updatedXp);
  const currentLevel =
    Number.isFinite(character.level) && (character.level as number) > 0
      ? Math.floor(character.level as number)
      : 1;

  return {
    gold: updatedGold,
    xp: updatedXp,
    honor_points: updatedHonor,
    level: Math.max(currentLevel, derivedLevel),
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bossQuestId } = await params;
    const body = await request.json().catch(() => ({}));
    const decisions = Array.isArray(body?.decisions) ? body.decisions : [];

    const tokenOrError = extractBearerToken(request);
    if (isAuthError(tokenOrError)) {
      return authErrorResponse(tokenOrError);
    }
    const token = tokenOrError;

    const supabase = createServerSupabaseClient(token);
    const serviceSupabase = createServiceSupabaseClient();

    const userOrError = await authenticateAndFetchUserProfile(supabase, token);
    if (isAuthError(userOrError)) {
      return authErrorResponse(userOrError);
    }
    const requesterProfile = userOrError;

    if (requesterProfile.role !== "GUILD_MASTER") {
      return NextResponse.json(
        { error: "Only Guild Masters can complete boss quests" },
        { status: 403 }
      );
    }

    const { data: bossQuest, error: bossError } = await supabase
      .from("boss_battles")
      .select("id, family_id, status, reward_gold, reward_xp, honor_reward, rewards_distributed")
      .eq("id", bossQuestId)
      .maybeSingle();

    if (bossError) {
      return NextResponse.json(
        { error: `Failed to fetch boss quest: ${bossError.message}` },
        { status: 400 }
      );
    }

    if (!bossQuest) {
      return NextResponse.json({ error: "Boss quest not found" }, { status: 404 });
    }

    if (bossQuest.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: "Cannot complete boss quests outside your family" },
        { status: 403 }
      );
    }

    if (bossQuest.rewards_distributed) {
      return NextResponse.json(
        { success: true, message: "Boss quest already completed and rewards distributed" },
        { status: 200 }
      );
    }

    const { data: participants, error: participantsError } = await serviceSupabase
      .from("boss_battle_participants")
      .select("id, user_id, participation_status, awarded_gold, awarded_xp, honor_awarded")
      .eq("boss_battle_id", bossQuestId);

    if (participantsError) {
      return NextResponse.json(
        { error: `Failed to fetch participants: ${participantsError.message}` },
        { status: 500 }
      );
    }

    const uniqueParticipantIds = Array.from(
      new Set((participants || []).map((p) => p.user_id).filter(Boolean)) as string[]
    );

    const rewardGold = bossQuest.reward_gold ?? 0;
    const rewardXp = bossQuest.reward_xp ?? 0;
    const honorReward = bossQuest.honor_reward ?? 1;

    const nowIso = new Date().toISOString();
    const decisionMap = new Map<
      string,
      { status: "APPROVED" | "PARTIAL" | "DENIED"; gold?: number; xp?: number; honor?: number }
    >();

    decisions.forEach((d: any) => {
      if (!d?.userId) return;
      const status = typeof d.status === "string" ? d.status.toUpperCase() : "";
      if (status === "APPROVED" || status === "PARTIAL" || status === "DENIED") {
        decisionMap.set(d.userId, {
          status,
          gold: typeof d.gold === "number" ? d.gold : undefined,
          xp: typeof d.xp === "number" ? d.xp : undefined,
          honor: typeof d.honor === "number" ? d.honor : undefined,
        });
      }
    });

    const rewardTotals: { participantId: string; rewards: { gold: number; xp: number; honor: number }; status: string }[] = [];

    for (const participantId of uniqueParticipantIds) {
      const { data: character } = await serviceSupabase
        .from("characters")
        .select("id, gold, xp, honor_points, class")
        .eq("user_id", participantId)
        .maybeSingle();

      const appliedDecision = applyClassBonusIfApproved(
        resolveParticipantDecision(participantId, decisionMap, rewardGold, rewardXp, honorReward),
        (character?.class as CharacterClass | null) ?? null
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

      const participantRow = (participants || []).find((p) => p.user_id === participantId);
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
          console.error("Failed to update participant approval", updateParticipantError);
        }
      }

      if (character) {
        const characterUpdate = buildCharacterRewardUpdate(character, {
          gold: appliedDecision.gold,
          xp: appliedDecision.xp,
          honor: appliedDecision.honor,
        });

        const { error: characterUpdateError } = await serviceSupabase
          .from("characters")
          .update(characterUpdate)
          .eq("id", character.id);

        if (characterUpdateError) {
          console.error("Failed to update boss quest rewards for character", character.id, characterUpdateError);
        }
      }

      const { error: transactionError } = await serviceSupabase.from("transactions").insert({
        user_id: participantId,
        type: "BOSS_VICTORY",
        xp_change: appliedDecision.xp,
        gold_change: appliedDecision.gold,
        honor_change: appliedDecision.honor,
        description: `Boss quest rewards (${appliedDecision.status})`,
        related_id: bossQuestId,
      });

      if (transactionError) {
        console.error("Failed to record boss quest transaction", transactionError);
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
      return NextResponse.json(
        { error: `Failed to mark boss quest defeated: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        participants: uniqueParticipantIds.length,
        rewards: { gold: rewardGold, xp: rewardXp, honor: honorReward },
        appliedRewards: rewardTotals,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error completing boss quest:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
