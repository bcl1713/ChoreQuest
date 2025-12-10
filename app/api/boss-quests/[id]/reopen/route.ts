import { NextRequest, NextResponse } from "next/server";
import {
  authenticateAndFetchUserProfile,
  authErrorResponse,
  extractBearerToken,
  isAuthError,
} from "@/lib/api-auth-helpers";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";

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
      return NextResponse.json(
        { error: "Only Guild Masters can reopen boss quests" },
        { status: 403 }
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
        { status: 400 }
      );
    }

    if (!bossQuest) {
      return NextResponse.json({ error: "Boss quest not found" }, { status: 404 });
    }

    if (bossQuest.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: "Cannot reopen boss quests outside your family" },
        { status: 403 }
      );
    }

    const newExpiry = new Date(Date.now() + minutes * 60000).toISOString();

    const { error: updateError } = await serviceSupabase
      .from("boss_battles")
      .update({ status: "ACTIVE", join_window_expires_at: newExpiry })
      .eq("id", bossQuestId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to reopen join window: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, join_window_expires_at: newExpiry }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error reopening boss quest:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
