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
import { ForbiddenError } from "@/lib/errors";

/**
 * PATCH /api/family-achievement-progress/[id]/notified
 * Mark a family achievement progress as notified.
 * Uses service-role client because family_achievement_progress writes
 * are restricted to service role by RLS policy.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = extractBearerToken(request);

    // Auth check — 401 if unauthenticated
    const userSupabase = createServerSupabaseClient(token);
    const requesterProfile = await authenticateAndFetchUserProfile(
      userSupabase,
      token,
    );

    const serviceSupabase = createServiceSupabaseClient();

    // Verify the progress row exists and belongs to the requester's family
    const { data: existing, error: lookupError } = await serviceSupabase
      .from("family_achievement_progress")
      .select("id, family_id")
      .eq("id", id)
      .maybeSingle();

    if (lookupError || !existing) {
      return NextResponse.json(
        { error: "Family achievement progress not found" },
        { status: 404 },
      );
    }

    if (existing.family_id !== requesterProfile.family_id) {
      throw new ForbiddenError(
        "Family achievement progress does not belong to your family",
        "FAMILY_NOTIFIED_FORBIDDEN",
      );
    }

    // Record that this user has been notified — per-user so every family member
    // gets their own toast regardless of whether a sibling dismissed it first.
    const { error: insertError } = await serviceSupabase
      .from("family_achievement_user_notifications")
      .upsert(
        {
          user_id: requesterProfile.id,
          family_achievement_progress_id: id,
        },
        {
          onConflict: "user_id,family_achievement_progress_id",
          ignoreDuplicates: true,
        },
      );

    if (insertError) {
      throw new Error(`Failed to record notification: ${insertError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
