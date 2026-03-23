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

/**
 * GET /api/family-achievements
 *
 * Returns all family achievements with progress for the authenticated user's family.
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    const userSupabase = createServerSupabaseClient(token);
    const requesterProfile = await authenticateAndFetchUserProfile(
      userSupabase,
      token,
    );

    const familyId = requesterProfile.family_id;
    if (!familyId) {
      return NextResponse.json({ achievements: [] });
    }

    const serviceSupabase = createServiceSupabaseClient();

    // Fetch family achievements
    const { data: achievements, error: achError } = await serviceSupabase
      .from("family_achievements")
      .select(
        "id, name, description, icon, category_id, xp_reward, gold_reward, is_hidden, criteria_type, criteria_config, achievement_categories(id, name, icon, display_order)",
      )
      .eq("family_id", familyId)
      .order("name", { ascending: true });

    if (achError) {
      throw new Error(
        `Failed to fetch family achievements: ${achError.message}`,
      );
    }

    // Fetch family achievement progress
    const { data: progress, error: progressError } = await serviceSupabase
      .from("family_achievement_progress")
      .select("family_achievement_id, unlocked_at, progress, notified")
      .eq("family_id", familyId);

    if (progressError) {
      throw new Error(
        `Failed to fetch family achievement progress: ${progressError.message}`,
      );
    }

    // Build progress lookup
    const progressMap = new Map(
      (progress ?? []).map((p) => [p.family_achievement_id, p]),
    );

    // Merge achievements with progress
    const mergedAchievements = (achievements ?? []).map((a) => {
      const p = progressMap.get(a.id);
      const { achievement_categories, ...rest } = a;
      return {
        ...rest,
        category: achievement_categories,
        unlocked_at: p?.unlocked_at ?? null,
        progress: p?.progress ?? null,
        notified: p?.notified ?? null,
      };
    });

    return NextResponse.json({ achievements: mergedAchievements });
  } catch (error) {
    return handleRouteError(error);
  }
}
