/**
 * Quest Approval API
 * Allows Guild Masters to approve quest instances and trigger streak integration.
 */

import { NextRequest, NextResponse } from "next/server";
import { QuestInstanceService } from "@/lib/quest-instance-service";
import { handleRouteError } from "@/lib/api-error-handler";
import {
  AuthError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthError(
        "Missing or invalid authorization header",
        "AUTH_HEADER_INVALID",
      );
    }

    const token = authHeader.substring(7);
    const supabase = createServerSupabaseClient(token);

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const user = authData?.user;

    if (authError || !user) {
      throw new AuthError();
    }

    const { data: requesterProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role, family_id")
      .eq("id", user.id)
      .single();

    if (profileError || !requesterProfile) {
      throw new Error("Failed to load user profile");
    }

    if (requesterProfile.role !== "GUILD_MASTER") {
      throw new ForbiddenError(
        "Only Guild Masters can approve quests",
        "QUEST_APPROVE_FORBIDDEN",
      );
    }

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

    if (quest.family_id !== requesterProfile.family_id) {
      throw new ForbiddenError(
        "Cannot approve quests for other families",
        "QUEST_APPROVE_FORBIDDEN",
      );
    }

    const questInstanceService = new QuestInstanceService(supabase);
    const approvedQuest = await questInstanceService.approveQuest(questId);

    return NextResponse.json(
      {
        success: true,
        quest: approvedQuest,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
