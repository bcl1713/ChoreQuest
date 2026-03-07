import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json(
        { error: "Only Guild Masters can cancel boss quests" },
        { status: 403 },
      );
    }

    const { data: bossQuest, error: bossError } = await supabase
      .from("boss_battles")
      .select("id, family_id, status")
      .eq("id", bossQuestId)
      .maybeSingle();

    if (bossError) {
      return NextResponse.json(
        { error: `Failed to fetch boss quest: ${bossError.message}` },
        { status: 400 },
      );
    }

    if (!bossQuest) {
      return NextResponse.json(
        { error: "Boss quest not found" },
        { status: 404 },
      );
    }

    if (bossQuest.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: "Cannot cancel boss quests outside your family" },
        { status: 403 },
      );
    }

    const { error: updateError } = await serviceSupabase
      .from("boss_battles")
      .update({ status: "EXPIRED" })
      .eq("id", bossQuestId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to cancel boss quest: ${updateError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Error canceling boss quest:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
