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

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser(token);
    const user = authData?.user;

    if (authError || !user) {
      throw new AuthError();
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("family_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Failed to load user profile");
    }

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id, volunteered_by")
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

    if (quest.family_id !== profile.family_id) {
      throw new ForbiddenError(
        "Cannot release quests for another family",
        "QUEST_RELEASE_FORBIDDEN",
      );
    }

    let characterIdForRelease: string | null = null;

    if (profile.role === "GUILD_MASTER") {
      characterIdForRelease = quest.volunteered_by ?? null;
    } else {
      const { data: character, error: characterError } = await supabase
        .from("characters")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (characterError) {
        throw new AppError(
          `Failed to fetch character: ${characterError.message}`,
          500,
          "CHARACTER_LOOKUP_FAILED",
        );
      }

      characterIdForRelease = character?.id ?? null;
    }

    if (!characterIdForRelease) {
      throw new ValidationError(
        "Unable to determine which character should release this quest",
        "CHARACTER_REQUIRED",
      );
    }

    const questInstanceService = new QuestInstanceService(supabase);
    const releasedQuest = await questInstanceService.releaseQuest(
      questId,
      characterIdForRelease
    );

    return NextResponse.json(
      {
        success: true,
        quest: releasedQuest,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
