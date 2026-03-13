import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  extractBearerToken,
  authenticateAndFetchUserProfile,
} from "@/lib/api-auth-helpers";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params;

    // Extract Bearer token
    const token = extractBearerToken(request);
    const supabase = createServerSupabaseClient(token);

    // Authenticate user and fetch profile
    const requesterProfile = await authenticateAndFetchUserProfile(supabase, token);

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id")
      .eq("id", questId)
      .maybeSingle();

    if (questError) {
      throw new NotFoundError(
        `Failed to fetch quest: ${questError.message}`,
        "QUEST_NOT_FOUND",
      );
    }

    if (!quest) {
      throw new NotFoundError("Quest not found", "QUEST_NOT_FOUND");
    }

    if (requesterProfile.role !== "GUILD_MASTER") {
      throw new ForbiddenError(
        "Only Guild Masters can delete quests",
        "QUEST_DELETE_FORBIDDEN",
      );
    }

    if (quest.family_id !== requesterProfile.family_id) {
      throw new ForbiddenError(
        "Cannot delete quests outside your family",
        "QUEST_DELETE_FORBIDDEN",
      );
    }

    const { error: deleteError } = await supabase
      .from("quest_instances")
      .delete()
      .eq("id", questId);

    if (deleteError) {
      throw new Error(`Failed to delete quest: ${deleteError.message}`);
    }

    return NextResponse.json(
      { success: true, message: "Quest cancelled successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
