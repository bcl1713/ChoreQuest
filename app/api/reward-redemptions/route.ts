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
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { assertValidUuidParam } from "@/lib/api-route-params";

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    const supabase = createServerSupabaseClient(token);
    const requesterProfile = await authenticateAndFetchUserProfile(
      supabase,
      token,
    );

    const body = (await request.json().catch(() => null)) as {
      rewardId?: unknown;
    } | null;
    const rewardId = typeof body?.rewardId === "string" ? body.rewardId : null;

    if (!rewardId) {
      throw new ValidationError("rewardId is required", "REWARD_ID_REQUIRED");
    }
    assertValidUuidParam(rewardId, "reward", "REWARD_ID_INVALID");

    const serviceSupabase = createServiceSupabaseClient();
    const { data, error } = await serviceSupabase.rpc("fn_redeem_reward", {
      p_user_id: requesterProfile.id,
      p_reward_id: rewardId,
    });

    if (error) {
      const message = error.message ?? "Failed to redeem reward";
      if (message.includes("INSUFFICIENT_GOLD")) {
        throw new ConflictError(
          "Insufficient gold to redeem this reward",
          "INSUFFICIENT_GOLD",
        );
      }
      if (
        message.includes("REWARD_NOT_FOUND_OR_INACTIVE") ||
        message.includes("CHARACTER_NOT_FOUND")
      ) {
        throw new NotFoundError(message, message);
      }
      throw new Error(message);
    }

    const redemption = Array.isArray(data) ? data[0] : data;
    if (!redemption) {
      throw new Error("Reward redemption did not return a row");
    }

    return NextResponse.json({ success: true, redemption }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
