import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import {
  authenticateAndFetchUserProfile,
  extractBearerToken,
} from "@/lib/api-auth-helpers";
import {
  createServerSupabaseClient,
  createServiceSupabaseClient,
} from "@/lib/supabase-server";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: bossQuestId } = await params;

    const token = extractBearerToken(request);

    const supabase = createServerSupabaseClient(token);
    const serviceSupabase = createServiceSupabaseClient();

    const requesterProfile = await authenticateAndFetchUserProfile(supabase, token);

    if (requesterProfile.role !== "GUILD_MASTER") {
      throw new ForbiddenError(
        "Only Guild Masters can cancel boss quests",
        "BOSS_QUEST_CANCEL_FORBIDDEN",
      );
    }

    const { data: bossQuest, error: bossError } = await supabase
      .from("boss_battles")
      .select("id, family_id, status")
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
        "Cannot cancel boss quests outside your family",
        "BOSS_QUEST_CANCEL_FORBIDDEN",
      );
    }

    const { error: updateError } = await serviceSupabase
      .from("boss_battles")
      .update({ status: "EXPIRED" })
      .eq("id", bossQuestId);

    if (updateError) {
      throw new AppError(
        `Failed to cancel boss quest: ${updateError.message}`,
        500,
        "BOSS_QUEST_CANCEL_FAILED",
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
