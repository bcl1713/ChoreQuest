import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import {
  authenticateAndFetchUserProfile,
  extractBearerToken,
} from "@/lib/api-auth-helpers";
import {
  createServerSupabaseClient,
  createServiceSupabaseClient,
} from "@/lib/supabase-server";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { assertValidUuidParam } from "@/lib/api-route-params";
import { AchievementProgressService } from "@/lib/achievement-progress-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: characterId } = await params;
    assertValidUuidParam(characterId, "character", "CHARACTER_ID_INVALID");

    const token = extractBearerToken(request);
    const supabase = createServerSupabaseClient(token);
    const requesterProfile = await authenticateAndFetchUserProfile(
      supabase,
      token,
    );

    const body = await request.json().catch(() => ({}));
    const { newClass } = body as { newClass?: string };

    if (!newClass) {
      throw new ValidationError("newClass is required", "NEW_CLASS_REQUIRED");
    }

    // Verify the character belongs to the requesting user and fetch fields needed for cost validation
    const { data: character, error: charError } = await supabase
      .from("characters")
      .select("id, user_id, class, level, gold")
      .eq("id", characterId)
      .maybeSingle();

    if (charError || !character) {
      throw new NotFoundError("Character not found", "CHARACTER_NOT_FOUND");
    }

    if (character.user_id !== requesterProfile.id) {
      throw new ForbiddenError(
        "Cannot change class for another user's character",
        "CHARACTER_CHANGE_CLASS_FORBIDDEN",
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    const level = character.level ?? 1;
    const cost =
      level <= 5
        ? 100
        : level <= 10
          ? 250
          : level <= 15
            ? 500
            : level <= 20
              ? 1000
              : 2000;

    if ((character.gold ?? 0) < cost) {
      throw new ValidationError(
        `Insufficient gold. Need ${cost}, have ${character.gold ?? 0}`,
        "INSUFFICIENT_GOLD",
      );
    }

    const { data: rpcData, error: updateError } = await serviceSupabase.rpc(
      "fn_change_character_class",
      {
        p_character_id: characterId,
        p_new_class: newClass,
      },
    );

    if (updateError) {
      throw new Error(updateError.message ?? "Failed to update character class");
    }

    const updated = Array.isArray(rpcData) ? rpcData[0] : rpcData;

    if (!updated) {
      throw new Error("Failed to update character class");
    }

    try {
      const progressService = new AchievementProgressService(serviceSupabase);
      await progressService.updateProgress(characterId, {
        type: "CLASS_CHANGED",
      });
    } catch (progressError) {
      console.warn(
        "Achievement progress update failed after class change (non-blocking):",
        characterId,
        progressError,
      );
    }

    return NextResponse.json(
      { success: true, character: updated },
      { status: 200 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
