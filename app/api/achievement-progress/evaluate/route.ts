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
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { AchievementProgressService } from "@/lib/achievement-progress-service";

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    const supabase = createServerSupabaseClient(token);

    const requesterProfile = await authenticateAndFetchUserProfile(
      supabase,
      token,
    );

    const body = await request.json().catch(() => ({}));
    const { eventType, userId: targetUserId } = body as {
      eventType?: string;
      userId?: string;
    };

    if (eventType !== "REWARD_APPROVED") {
      throw new ValidationError(
        "This route only accepts REWARD_APPROVED event type",
        "UNSUPPORTED_EVENT_TYPE",
      );
    }

    // Resolve character ID from the target user (defaults to requester's user)
    const resolvedUserId = targetUserId ?? requesterProfile.id;

    // Cross-user writes require GUILD_MASTER in the same family
    if (resolvedUserId !== requesterProfile.id) {
      if (requesterProfile.role !== "GUILD_MASTER") {
        throw new ForbiddenError(
          "Only Guild Masters can update achievement progress for other users",
          "ACHIEVEMENT_UPDATE_FORBIDDEN",
        );
      }

      const serviceSupabaseForCheck = createServiceSupabaseClient();
      const { data: targetProfile } = await serviceSupabaseForCheck
        .from("user_profiles")
        .select("family_id")
        .eq("id", resolvedUserId)
        .maybeSingle();

      if (
        !targetProfile ||
        targetProfile.family_id !== requesterProfile.family_id
      ) {
        throw new ForbiddenError(
          "Cannot update achievement progress for users outside your family",
          "ACHIEVEMENT_UPDATE_FORBIDDEN",
        );
      }
    }

    const serviceSupabase = createServiceSupabaseClient();
    const { data: character, error: charError } = await serviceSupabase
      .from("characters")
      .select("id")
      .eq("user_id", resolvedUserId)
      .maybeSingle();

    if (charError || !character) {
      throw new ValidationError(
        `Character not found for user ${resolvedUserId}`,
        "CHARACTER_NOT_FOUND",
      );
    }

    const progressService = new AchievementProgressService(serviceSupabase);
    await progressService.updateProgress(character.id, {
      type: "REWARD_APPROVED",
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
