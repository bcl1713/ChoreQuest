import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { QuestInstanceService } from "@/lib/quest-instance-service";
import {
  extractBearerToken,
  authenticateAndFetchUserProfile,
} from "@/lib/api-auth-helpers";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params;

    // Extract Bearer token
    const token = extractBearerToken(request);
    const supabase = createServerSupabaseClient(token);

    const body = await request.json().catch(() => ({}));
    const characterId = body?.characterId as string | undefined;

    // Authenticate user and fetch profile
    const requesterProfile = await authenticateAndFetchUserProfile(supabase, token);

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id, status, assigned_to_id, quest_type, volunteered_by")
      .eq("id", questId)
      .maybeSingle();

    if (questError) {
      throw new AppError(
        `Failed to fetch quest: ${questError.message}`,
        500,
        "QUEST_LOOKUP_FAILED",
      );
    }

    if (!quest) {
      throw new NotFoundError("Quest not found", "QUEST_NOT_FOUND");
    }

    // Security: Validate that characterId (if provided) belongs to the authenticated user
    let validCharacterId: string | undefined = undefined;
    if (characterId) {
      const { count, error: charError } = await supabase
        .from("characters")
        .select("*", { count: "exact", head: true })
        .eq("id", characterId)
        .eq("user_id", requesterProfile.id);

      if (!charError && count && count > 0) {
        validCharacterId = characterId;
      }
    }

    // Check authorization: GM or hero who claimed the quest or is assigned to it
    const isGM = requesterProfile.role === "GUILD_MASTER";
    const isQuestAssignedToUser = quest.assigned_to_id === requesterProfile.id;
    const isQuestClaimer = validCharacterId && quest.volunteered_by === validCharacterId;

    if (!isGM && !isQuestAssignedToUser && !isQuestClaimer) {
      throw new ForbiddenError(
        "You can only release your own quests",
        "QUEST_RELEASE_FORBIDDEN",
      );
    }

    // Check family authorization for GMs
    if (isGM && quest.family_id !== requesterProfile.family_id) {
      throw new ForbiddenError(
        "Cannot release quests outside your family",
        "QUEST_RELEASE_FORBIDDEN",
      );
    }

    // For family quests, use the service to properly handle character updates
    if (quest.quest_type === "FAMILY") {
      const questService = new QuestInstanceService(supabase);
      // Use validCharacterId if provided, otherwise try to find the character via volunteered_by
      const charIdToRelease = validCharacterId || quest.volunteered_by;
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
          throw new Error(`Failed to update quest: ${updateError.message}`);
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
        throw new Error(`Failed to update quest: ${updateError.message}`);
      }
    }

    return NextResponse.json(
      { success: true, message: "Quest released back to available pool" },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
