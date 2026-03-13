import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import {
  authenticateAndFetchUserProfile,
  authErrorResponse,
  extractBearerToken,
  isAuthError,
} from "@/lib/api-auth-helpers";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bossQuestId } = await params;
    const body = await request.json().catch(() => ({}));
    const minutes = typeof body?.minutes === "number" && body.minutes > 0 ? body.minutes : 60;

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
        "Only Guild Masters can reopen boss quests",
        "BOSS_QUEST_REOPEN_FORBIDDEN",
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
        "Cannot reopen boss quests outside your family",
        "BOSS_QUEST_REOPEN_FORBIDDEN",
      );
    }

    const newExpiry = new Date(Date.now() + minutes * 60000).toISOString();

    const { error: updateError } = await serviceSupabase
      .from("boss_battles")
      .update({ status: "ACTIVE", join_window_expires_at: newExpiry })
      .eq("id", bossQuestId);

    if (updateError) {
      throw new Error(`Failed to reopen join window: ${updateError.message}`);
    }

    return NextResponse.json({ success: true, join_window_expires_at: newExpiry }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
