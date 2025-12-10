import { NextRequest, NextResponse } from "next/server";
import {
  authenticateAndFetchUserProfile,
  authErrorResponse,
  extractBearerToken,
  isAuthError,
} from "@/lib/api-auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bossQuestId } = await params;

    const tokenOrError = extractBearerToken(request);
    if (isAuthError(tokenOrError)) {
      return authErrorResponse(tokenOrError);
    }
    const token = tokenOrError;
    const supabase = createServerSupabaseClient(token);

    const userOrError = await authenticateAndFetchUserProfile(supabase, token);
    if (isAuthError(userOrError)) {
      return authErrorResponse(userOrError);
    }

    const requesterProfile = userOrError;

    const { data: bossQuest, error: bossError } = await supabase
      .from("boss_battles")
      .select("id, family_id, status, join_window_expires_at")
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
        { error: "Cannot join boss quests outside your family" },
        { status: 403 }
      );
    }

    if (bossQuest.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Boss quest is not accepting new participants" },
        { status: 400 }
      );
    }

    const windowExpires = bossQuest.join_window_expires_at
      ? new Date(bossQuest.join_window_expires_at).getTime()
      : 0;
    if (Date.now() > windowExpires) {
      return NextResponse.json(
        { error: "Join window has closed for this boss quest" },
        { status: 400 }
      );
    }

    const { error: joinError } = await supabase
      .from("boss_battle_participants")
      .upsert(
        { boss_battle_id: bossQuestId, user_id: requesterProfile.id },
        { onConflict: "boss_battle_id,user_id", ignoreDuplicates: true }
      );

    if (joinError) {
      return NextResponse.json(
        { error: `Failed to join boss quest: ${joinError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error joining boss quest:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
