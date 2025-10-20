import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  extractBearerToken,
  authenticateAndFetchUserProfile,
  isAuthError,
  authErrorResponse,
} from "@/lib/api-auth-helpers";

export async function DELETE(
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

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id")
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

    if (requesterProfile.role !== "GUILD_MASTER") {
      return NextResponse.json(
        { error: "Only Guild Masters can delete quests" },
        { status: 403 }
      );
    }

    if (quest.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: "Cannot delete quests outside your family" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("quest_instances")
      .delete()
      .eq("id", questId);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete quest: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Quest cancelled successfully" },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    console.error("Error deleting quest:", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
