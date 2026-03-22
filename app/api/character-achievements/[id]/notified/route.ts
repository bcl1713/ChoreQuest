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
 * PATCH /api/character-achievements/[id]/notified
 * Mark a character achievement as notified.
 * Uses service-role client because character_achievements INSERT/UPDATE
 * is restricted to service role by RLS policy.
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

    // Record lookup via service-role client — 404 if not found
    const serviceSupabase = createServiceSupabaseClient();

    const { data: existing, error: lookupError } = await serviceSupabase
      .from("character_achievements")
      .select("id, characters(user_profiles(family_id))")
      .eq("id", id)
      .maybeSingle();

    if (lookupError || !existing) {
      return NextResponse.json(
        { error: "Character achievement not found" },
        { status: 404 },
      );
    }

    // Ownership check — 403 if the character belongs to a different family
    const characters = existing.characters;
    const userProfile =
      characters && !Array.isArray(characters)
        ? characters.user_profiles
        : null;
    const characterFamilyId =
      userProfile && !Array.isArray(userProfile) ? userProfile.family_id : null;
    if (
      !characterFamilyId ||
      characterFamilyId !== requesterProfile.family_id
    ) {
      throw new ForbiddenError(
        "Character achievement does not belong to your family",
        "NOTIFIED_FORBIDDEN",
      );
    }

    // Update notified flag
    const { error: updateError } = await serviceSupabase
      .from("character_achievements")
      .update({ notified: true })
      .eq("id", id);

    if (updateError) {
      throw new Error(`Failed to update notified flag: ${updateError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
