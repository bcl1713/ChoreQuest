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
        "Only Guild Masters can deny reward redemptions",
        "DENY_REDEMPTION_FORBIDDEN",
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    const { data: redemption, error: fetchError } = await serviceSupabase
      .from("reward_redemptions")
      .select("id, user_id, status, cost")
      .eq("id", redemptionId)
      .maybeSingle();

    if (fetchError || !redemption) {
      throw new NotFoundError("Redemption not found", "REDEMPTION_NOT_FOUND");
    }

    if (redemption.status !== "PENDING") {
      throw new ConflictError(
        "Only pending redemptions can be denied",
        "REDEMPTION_NOT_PENDING",
      );
    }

    if (!redemption.user_id) {
      throw new ConflictError("Redemption has no user", "REDEMPTION_USER_MISSING");
    }

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
        "DENY_REDEMPTION_FORBIDDEN",
      );
    }

    const { data, error } = await serviceSupabase.rpc(
      "fn_deny_reward_redemption",
      {
        p_redemption_id: redemptionId,
        p_user_id: redemption.user_id,
        p_amount: redemption.cost ?? 0,
        p_denied_by: requesterProfile.id,
      },
    );

    if (error) {
      const message = error.message ?? "Failed to deny redemption";
      if (message.includes("REDEMPTION_NOT_PENDING")) {
        throw new ConflictError(
          "Only pending redemptions can be denied",
          "REDEMPTION_NOT_PENDING",
        );
      }
      throw new Error(message);
    }

    const updated = Array.isArray(data) ? data[0] : data;
    if (!updated) {
      throw new Error("Reward denial did not return a row");
    }

    return NextResponse.json(
      { success: true, redemption: updated },
      { status: 200 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
