import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  extractBearerToken,
  authenticateAndFetchUserProfile,
  isAuthError,
  authErrorResponse,
} from "@/lib/api-auth-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params;

    // Extract Bearer token
    const tokenOrError = extractBearerToken(request);
    if (isAuthError(tokenOrError)) {
      return authErrorResponse(tokenOrError);
    }

    const token = tokenOrError;
    const supabase = createServerSupabaseClient(token);

    // Authenticate user and fetch profile
    const userOrError = await authenticateAndFetchUserProfile(supabase, token);
    if (isAuthError(userOrError)) {
      return authErrorResponse(userOrError);
    }

    const requesterProfile = userOrError;

    // Only GMs can deny quests
    if (requesterProfile.role !== "GUILD_MASTER") {
      return NextResponse.json(
        { error: "Only Guild Masters can deny quests" },
        { status: 403 }
      );
    }

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id, status, assigned_to_id")
      .eq("id", questId)
      .maybeSingle();

    if (questError) {
      return NextResponse.json(
        { error: `Failed to fetch quest: ${questError.message}` },
        { status: 400 }
      );
    }

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // Check family authorization
    if (quest.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: "Cannot deny quests outside your family" },
        { status: 403 }
      );
    }

    // Only allow denying COMPLETED quests
    if (quest.status !== "COMPLETED") {
      return NextResponse.json(
        { error: `Quest cannot be denied (status: ${quest.status}). Only COMPLETED quests can be denied.` },
        { status: 400 }
      );
    }

    // Move quest back to PENDING status
    const { error: updateError } = await supabase
      .from("quest_instances")
      .update({
        status: "PENDING",
        completed_at: null,
      })
      .eq("id", questId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update quest: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Quest denied and moved back to PENDING status" },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    console.error("Error denying quest:", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
