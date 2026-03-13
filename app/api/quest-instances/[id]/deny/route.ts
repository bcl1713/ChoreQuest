import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  extractBearerToken,
  authenticateAndFetchUserProfile,
} from "@/lib/api-auth-helpers";
import { AppError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

export async function POST(
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

    // Only GMs can deny quests
    if (requesterProfile.role !== "GUILD_MASTER") {
      throw new ForbiddenError(
        "Only Guild Masters can deny quests",
        "QUEST_DENY_FORBIDDEN",
      );
    }

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id, status, assigned_to_id")
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

    // Check family authorization
    if (quest.family_id !== requesterProfile.family_id) {
      throw new ForbiddenError(
        "Cannot deny quests outside your family",
        "QUEST_DENY_FORBIDDEN",
      );
    }

    // Only allow denying COMPLETED quests
    if (quest.status !== "COMPLETED") {
      throw new ValidationError(
        `Quest cannot be denied (status: ${quest.status}). Only COMPLETED quests can be denied.`,
        "QUEST_NOT_DENIABLE",
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
      throw new Error(`Failed to update quest: ${updateError.message}`);
    }

    return NextResponse.json(
      { success: true, message: "Quest denied and moved back to PENDING status" },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
