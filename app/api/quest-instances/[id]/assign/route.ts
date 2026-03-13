import { NextRequest, NextResponse } from "next/server";
import { QuestInstanceService } from "@/lib/quest-instance-service";
import { handleRouteError } from "@/lib/api-error-handler";
import {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
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

    const body = await request.json().catch(() => null);
    const characterId = body?.characterId as string | undefined;

    if (!characterId) {
      throw new ValidationError("Character ID is required", "CHARACTER_ID_REQUIRED");
    }

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
        "Only Guild Masters can assign family quests",
        "QUEST_ASSIGN_FORBIDDEN",
      );
    }

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id, quest_type")
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

    if (quest.family_id !== requesterProfile.family_id) {
      throw new ForbiddenError(
        "Cannot assign quests outside your family",
        "QUEST_ASSIGN_FORBIDDEN",
      );
    }

    if (quest.quest_type !== "FAMILY") {
      throw new ValidationError(
        "Only family quests support GM assignment",
        "QUEST_TYPE_INVALID",
      );
    }

    const questInstanceService = new QuestInstanceService(supabase);
    const assignedQuest = await questInstanceService.assignQuest(
      questId,
      characterId,
      user.id
    );

    return NextResponse.json(
      {
        success: true,
        quest: assignedQuest,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
