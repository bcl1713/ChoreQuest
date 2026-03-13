import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import {
  authenticateAndFetchUserProfile,
  authErrorResponse,
  extractBearerToken,
  isAuthError,
} from "@/lib/api-auth-helpers";
import {
  createServerSupabaseClient,
  createServiceSupabaseClient,
} from "@/lib/supabase-server";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: bossQuestId } = await params;

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
        "Cannot cancel boss quests outside your family",
        "BOSS_QUEST_CANCEL_FORBIDDEN",
      );
    }

    const { error: updateError } = await serviceSupabase
      .from("boss_battles")
      .update({ status: "EXPIRED" })
      .eq("id", bossQuestId);

    if (updateError) {
      throw new Error(`Failed to cancel boss quest: ${updateError.message}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
