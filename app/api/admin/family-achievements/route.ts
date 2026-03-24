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
import { FamilyAchievementProgressService } from "@/lib/family-achievement-progress-service";
import { ALL_FAMILY_CRITERIA_TYPES } from "@/lib/family-achievement-progress/family-evaluators";

/**
 * GET /api/admin/family-achievements
 *
 * Returns all family achievements for the Guild Master's family.
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    const userSupabase = createServerSupabaseClient(token);
    const requesterProfile = await authenticateAndFetchUserProfile(
      userSupabase,
      token,
    );

    if (requesterProfile.role !== "GUILD_MASTER") {
      throw new ForbiddenError(
        "Only Guild Masters can manage family achievements",
        "FAMILY_ACHIEVEMENT_ADMIN_FORBIDDEN",
      );
    }

    const familyId = requesterProfile.family_id;
    if (!familyId) {
      return NextResponse.json({ achievements: [], categories: [] });
    }

    const serviceSupabase = createServiceSupabaseClient();

    const { data: achievements, error: achError } = await serviceSupabase
      .from("family_achievements")
      .select(
        "id, name, description, icon, category_id, xp_reward, gold_reward, is_hidden, criteria_type, criteria_config, achievement_categories(name)",
      )
      .eq("family_id", familyId)
      .order("name", { ascending: true });

    if (achError) {
      throw new Error(
        `Failed to fetch family achievements: ${achError.message}`,
      );
    }

    // Fetch progress for display
    const { data: progress, error: progressError } = await serviceSupabase
      .from("family_achievement_progress")
      .select("family_achievement_id, unlocked_at, progress")
      .eq("family_id", familyId);

    if (progressError) {
      throw new Error(`Failed to fetch progress: ${progressError.message}`);
    }

    let progressMap = new Map(
      (progress ?? []).map((p) => [p.family_achievement_id, p]),
    );

    // Backfill missing progress rows so the admin dashboard shows accurate
    // state for all achievements, including newly-created ones.
    const hasMissingProgress = (achievements ?? []).some(
      (a) => !progressMap.has(a.id),
    );

    // Mirror the public API's roster-change detection: if ANY stored progress
    // row carries a member_count snapshot that differs from the current family
    // size, re-evaluate so the admin view reflects the correct unlock state.
    const storedMemberCounts = new Set<number>();
    for (const p of progressMap.values()) {
      const mc = (p.progress as { member_count?: number } | null | undefined)
        ?.member_count;
      if (mc !== undefined) storedMemberCounts.add(mc);
    }

    let memberCountChanged = false;
    if (storedMemberCounts.size > 0) {
      const { count: currentMemberCount, error: memberCountError } =
        await serviceSupabase
          .from("user_profiles")
          .select("*", { count: "exact", head: true })
          .eq("family_id", familyId);
      if (memberCountError) {
        throw new Error(
          `Failed to fetch family member count: ${memberCountError.message}`,
        );
      }
      const current = currentMemberCount ?? 0;
      memberCountChanged = [...storedMemberCounts].some((mc) => mc !== current);
    }

    if (hasMissingProgress || memberCountChanged) {
      try {
        const familyService = new FamilyAchievementProgressService(
          serviceSupabase,
        );
        await familyService.backfillProgress(familyId);

        const { data: freshProgress } = await serviceSupabase
          .from("family_achievement_progress")
          .select("family_achievement_id, unlocked_at, progress")
          .eq("family_id", familyId);

        progressMap = new Map(
          (freshProgress ?? []).map((p) => [p.family_achievement_id, p]),
        );
      } catch (backfillErr) {
        console.error(
          "Family achievement backfill failed (admin):",
          backfillErr,
        );
      }
    }

    const { data: categories, error: catError } = await serviceSupabase
      .from("achievement_categories")
      .select("id, name")
      .order("display_order", { ascending: true });

    if (catError) {
      throw new Error(`Failed to fetch categories: ${catError.message}`);
    }

    const achievementsWithProgress = (achievements ?? []).map((a) => {
      const { achievement_categories, ...rest } = a;
      const p = progressMap.get(a.id);
      return {
        ...rest,
        category_name:
          (achievement_categories as { name: string } | null)?.name ??
          "Unknown",
        progress: p?.progress ?? null,
        unlocked_at: p?.unlocked_at ?? null,
      };
    });

    return NextResponse.json({
      achievements: achievementsWithProgress,
      categories: categories ?? [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/admin/family-achievements
 *
 * Creates a new family achievement.
 * Requires Guild Master role.
 */
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    const userSupabase = createServerSupabaseClient(token);
    const requesterProfile = await authenticateAndFetchUserProfile(
      userSupabase,
      token,
    );

    if (requesterProfile.role !== "GUILD_MASTER") {
      throw new ForbiddenError(
        "Only Guild Masters can manage family achievements",
        "FAMILY_ACHIEVEMENT_ADMIN_FORBIDDEN",
      );
    }

    if (!requesterProfile.family_id) {
      throw new ValidationError(
        "No family associated with your account",
        "NO_FAMILY",
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      icon,
      category_id,
      xp_reward,
      gold_reward,
      is_hidden,
      criteria_type,
      criteria_config,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new ValidationError(
        "Achievement name is required",
        "FAMILY_ACHIEVEMENT_NAME_REQUIRED",
      );
    }

    if (!criteria_type) {
      throw new ValidationError(
        "Criteria type is required",
        "FAMILY_ACHIEVEMENT_CRITERIA_TYPE_REQUIRED",
      );
    }

    if (
      !(ALL_FAMILY_CRITERIA_TYPES as readonly string[]).includes(criteria_type)
    ) {
      throw new ValidationError(
        `Unsupported criteria type "${criteria_type}". Supported types: ${ALL_FAMILY_CRITERIA_TYPES.join(", ")}`,
        "FAMILY_ACHIEVEMENT_CRITERIA_TYPE_UNSUPPORTED",
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    const { data: achievement, error: insertError } = await serviceSupabase
      .from("family_achievements")
      .insert({
        name: name.trim(),
        description: description ?? "",
        icon: icon ?? null,
        category_id: category_id ?? null,
        xp_reward: xp_reward ?? 0,
        gold_reward: gold_reward ?? 0,
        is_hidden: is_hidden ?? false,
        criteria_type,
        criteria_config: criteria_config ?? {},
        family_id: requesterProfile.family_id,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(
        `Failed to create family achievement: ${insertError.message}`,
      );
    }

    // Seed and evaluate progress immediately so families whose criteria are
    // already satisfied receive an unlock row without waiting for a backfill.
    const service = new FamilyAchievementProgressService();
    try {
      await service.recomputeAchievement(
        requesterProfile.family_id,
        achievement.id,
      );
    } catch (err) {
      throw new Error(
        `Achievement created but progress seeding failed for ${achievement.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return NextResponse.json({ success: true, achievement }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
