import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import {
  authenticateAndFetchUserProfile,
  extractBearerToken,
} from "@/lib/api-auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bossQuestId } = await params;

    const token = extractBearerToken(request);
    const supabase = createServerSupabaseClient(token);

    const requesterProfile = await authenticateAndFetchUserProfile(supabase, token);

    const { data: bossQuest, error: bossError } = await supabase
      .from("boss_battles")
      .select("id, family_id, status, join_window_expires_at")
      .eq("id", bossQuestId)
      .maybeSingle();

    if (bossError) {
      throw new NotFoundError(
        `Failed to fetch boss quest: ${bossError.message}`,
        "BOSS_QUEST_NOT_FOUND",
      );
    }

    if (!bossQuest) {
      throw new NotFoundError("Boss quest not found", "BOSS_QUEST_NOT_FOUND");
    }

    if (bossQuest.family_id !== requesterProfile.family_id) {
      throw new ForbiddenError(
        "Cannot join boss quests outside your family",
        "BOSS_QUEST_JOIN_FORBIDDEN",
      );
    }

    if (bossQuest.status !== "ACTIVE") {
      throw new ValidationError(
        "Boss quest is not accepting new participants",
        "BOSS_QUEST_NOT_JOINABLE",
      );
    }

    const windowExpires = bossQuest.join_window_expires_at
      ? new Date(bossQuest.join_window_expires_at).getTime()
      : 0;
    if (Date.now() > windowExpires) {
      throw new ValidationError(
        "Join window has closed for this boss quest",
        "BOSS_QUEST_JOIN_WINDOW_CLOSED",
      );
    }

    const { error: joinError } = await supabase
      .from("boss_battle_participants")
      .upsert(
        { boss_battle_id: bossQuestId, user_id: requesterProfile.id },
        { onConflict: "boss_battle_id,user_id", ignoreDuplicates: true }
      );

    if (joinError) {
      throw new Error(`Failed to join boss quest: ${joinError.message}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
