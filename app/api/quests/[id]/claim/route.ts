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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params;

    if (!UUID_PATTERN.test(questId)) {
      throw new ValidationError("Invalid quest ID format", "QUEST_ID_INVALID");
    }

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
      throw new AppError("Failed to load user profile", 500, "PROFILE_LOAD_FAILED");
    }

    if (!["HERO", "YOUNG_HERO", "GUILD_MASTER"].includes(profile.role ?? "")) {
      throw new ForbiddenError("Only heroes can claim quests", "QUEST_CLAIM_FORBIDDEN");
    }

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id")
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
        "Cannot claim quests for another family",
        "QUEST_CLAIM_FORBIDDEN",
      );
    }

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

    if (!character) {
      throw new NotFoundError("No character found for this hero", "CHARACTER_NOT_FOUND");
    }

    const questInstanceService = new QuestInstanceService(supabase);
    const claimedQuest = await questInstanceService.claimQuest(
      questId,
      character.id
    );

    return NextResponse.json(
      {
        success: true,
        quest: claimedQuest,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
