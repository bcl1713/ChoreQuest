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

/**
 * GET /api/achievements?characterId=<uuid>
 *
 * Returns all achievements grouped by category with the character's
 * progress merged in. Uses service-role client for reads because
 * character_achievements has restrictive RLS.
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    const userSupabase = createServerSupabaseClient(token);
    const requesterProfile = await authenticateAndFetchUserProfile(
      userSupabase,
      token,
    );

    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get("characterId");

    if (!characterId) {
      throw new ValidationError(
        "characterId is required",
        "CHARACTER_ID_REQUIRED",
      );
    }

    // Verify the character belongs to the authenticated user
    const { data: character, error: charError } = await userSupabase
      .from("characters")
      .select("id")
      .eq("id", characterId)
      .eq("user_id", requesterProfile.id)
      .maybeSingle();

    if (charError || !character) {
      throw new ForbiddenError(
        "Cannot access achievements for another user's character",
        "CHARACTER_ACCESS_FORBIDDEN",
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    // Fetch categories, achievements, and character progress in parallel
    const [categoriesResult, achievementsResult, progressResult] =
      await Promise.all([
        serviceSupabase
          .from("achievement_categories")
          .select("id, name, description, icon, display_order")
          .order("display_order", { ascending: true }),
        serviceSupabase
          .from("achievements")
          .select(
            "id, name, description, icon, category_id, xp_reward, gold_reward, is_hidden, criteria_type",
          )
          .order("name", { ascending: true }),
        serviceSupabase
          .from("character_achievements")
          .select("id, achievement_id, unlocked_at, progress")
          .eq("character_id", characterId),
      ]);

    if (categoriesResult.error) {
      throw new Error(
        `Failed to fetch categories: ${categoriesResult.error.message}`,
      );
    }
    if (achievementsResult.error) {
      throw new Error(
        `Failed to fetch achievements: ${achievementsResult.error.message}`,
      );
    }
    if (progressResult.error) {
      throw new Error(
        `Failed to fetch progress: ${progressResult.error.message}`,
      );
    }

    // Build a progress lookup by achievement_id
    const progressByAchievementId = new Map(
      (progressResult.data ?? []).map((p) => [p.achievement_id, p]),
    );

    // Group achievements by category with progress merged
    const categories = (categoriesResult.data ?? []).map((category) => {
      const categoryAchievements = (achievementsResult.data ?? [])
        .filter((a) => a.category_id === category.id)
        .map((achievement) => {
          const progress = progressByAchievementId.get(achievement.id);
          const isLocked = achievement.is_hidden && !progress?.unlocked_at;
          return {
            id: achievement.id,
            name: isLocked ? "???" : achievement.name,
            description: isLocked ? "???" : achievement.description,
            icon: isLocked ? null : achievement.icon,
            xp_reward: achievement.xp_reward,
            gold_reward: achievement.gold_reward,
            is_hidden: achievement.is_hidden,
            criteria_type: achievement.criteria_type,
            unlocked_at: progress?.unlocked_at ?? null,
            progress: progress?.progress ?? null,
          };
        });

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        display_order: category.display_order,
        achievements: categoryAchievements,
      };
    });

    return NextResponse.json({ categories });
  } catch (error) {
    return handleRouteError(error);
  }
}
