import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { QuestInstanceService } from "@/lib/quest-instance-service";
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

    const body = await request.json().catch(() => ({}));
    const characterId = body?.characterId as string | undefined;

    // Authenticate user and fetch profile
    const userOrError = await authenticateAndFetchUserProfile(supabase, token);
    if (isAuthError(userOrError)) {
      return authErrorResponse(userOrError);
    }

    const requesterProfile = userOrError;

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id, status, assigned_to_id, quest_type, volunteered_by")
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

    // Check authorization: GM or hero who claimed the quest or is assigned to it
    const isGM = requesterProfile.role === "GUILD_MASTER";
    const isQuestAssignedToUser = quest.assigned_to_id === requesterProfile.id;
    const isQuestClaimer = characterId && quest.volunteered_by === characterId;

    if (!isGM && !isQuestAssignedToUser && !isQuestClaimer) {
      return NextResponse.json(
        { error: "You can only release your own quests" },
        { status: 403 }
      );
    }

    // Check family authorization for GMs
    if (isGM && quest.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: "Cannot release quests outside your family" },
        { status: 403 }
      );
    }

    // For family quests, use the service to properly handle character updates
    if (quest.quest_type === "FAMILY") {
      const questService = new QuestInstanceService(supabase);
      // Use characterId if provided, otherwise try to find the character via volunteered_by
      const charIdToRelease = characterId || quest.volunteered_by;
      if (charIdToRelease) {
        await questService.releaseQuest(questId, charIdToRelease);
      } else {
        // Fallback: just unassign if we can't find character
        const { error: updateError } = await supabase
          .from("quest_instances")
          .update({
            assigned_to_id: null,
            volunteered_by: null,
            volunteer_bonus: null,
            status: "AVAILABLE",
          })
          .eq("id", questId);

        if (updateError) {
          return NextResponse.json(
            { error: `Failed to update quest: ${updateError.message}` },
            { status: 500 }
          );
        }
      }
    } else {
      // For individual quests, just unassign
      const updateData: Record<string, null | string> = {
        assigned_to_id: null,
        status: "AVAILABLE",
      };
      const { error: updateError } = await supabase
        .from("quest_instances")
        .update(updateData)
        .eq("id", questId);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to update quest: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: "Quest released back to available pool" },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    console.error("Error releasing quest:", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
