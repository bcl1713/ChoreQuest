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
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertValidUuidParam } from "@/lib/api-route-params";
import { AchievementProgressService } from "@/lib/achievement-progress-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: redemptionId } = await params;
    assertValidUuidParam(redemptionId, "redemption", "REDEMPTION_ID_INVALID");

    const token = extractBearerToken(request);
    const supabase = createServerSupabaseClient(token);
    const requesterProfile = await authenticateAndFetchUserProfile(
      supabase,
      token,
    );

    if (requesterProfile.role !== "GUILD_MASTER") {
      throw new ForbiddenError(
        "Only Guild Masters can approve reward redemptions",
        "APPROVE_REDEMPTION_FORBIDDEN",
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    const { data: redemption, error: fetchError } = await serviceSupabase
      .from("reward_redemptions")
      .select("id, user_id, status")
      .eq("id", redemptionId)
      .maybeSingle();

    if (fetchError || !redemption) {
      throw new NotFoundError("Redemption not found", "REDEMPTION_NOT_FOUND");
    }

    if (redemption.status !== "PENDING") {
      throw new ConflictError(
        "Only pending redemptions can be approved",
        "REDEMPTION_NOT_PENDING",
      );
    }

    if (redemption.user_id) {
      const { data: redemptionProfile } = await serviceSupabase
        .from("user_profiles")
        .select("family_id")
        .eq("id", redemption.user_id)
        .maybeSingle();

      if (
        !redemptionProfile ||
        redemptionProfile.family_id !== requesterProfile.family_id
      ) {
        throw new ForbiddenError(
          "Redemption does not belong to your family",
          "APPROVE_REDEMPTION_FORBIDDEN",
        );
      }
    }

    const { data: updated, error: updateError } = await serviceSupabase
      .from("reward_redemptions")
      .update({
        status: "APPROVED",
        approved_at: new Date().toISOString(),
        approved_by: requesterProfile.id,
      })
      .eq("id", redemptionId)
      .select()
      .single();

    if (updateError || !updated) {
      throw new Error("Failed to approve redemption");
    }

    try {
      const { data: characters, error: characterError } = redemption.user_id
        ? await serviceSupabase
            .from("characters")
            .select("id")
            .eq("user_id", redemption.user_id)
            .order("created_at", { ascending: true })
        : { data: null, error: null };

      if (characterError) {
        throw characterError;
      }

      const character = characters?.[0] ?? null;

      if (character) {
        const progressService = new AchievementProgressService(serviceSupabase);
        await progressService.updateProgress(character.id, {
          type: "REWARD_APPROVED",
        });
      }
    } catch (progressError) {
      console.warn(
        "Achievement progress update failed after reward approval (non-blocking):",
        redemptionId,
        progressError,
      );
    }

    return NextResponse.json(
      { success: true, redemption: updated },
      { status: 200 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
