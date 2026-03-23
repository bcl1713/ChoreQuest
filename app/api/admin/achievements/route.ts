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
 * GET /api/admin/achievements
 *
 * Returns all achievements with category names.
 * Requires Guild Master role.
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
        "Only Guild Masters can manage achievements",
        "ACHIEVEMENT_ADMIN_FORBIDDEN",
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    const { data: achievements, error: achError } = await serviceSupabase
      .from("achievements")
      .select(
        "id, name, description, icon, category_id, xp_reward, gold_reward, is_hidden, criteria_type, criteria_config, family_id",
      )
      .order("name", { ascending: true });

    if (achError) {
      throw new Error(`Failed to fetch achievements: ${achError.message}`);
    }

    // Fetch category names for display
    const { data: categories, error: catError } = await serviceSupabase
      .from("achievement_categories")
      .select("id, name")
      .order("display_order", { ascending: true });

    if (catError) {
      throw new Error(`Failed to fetch categories: ${catError.message}`);
    }

    const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

    const achievementsWithCategory = (achievements ?? []).map((a) => ({
      ...a,
      category_name: categoryMap.get(a.category_id) ?? "Unknown",
    }));

    return NextResponse.json({
      achievements: achievementsWithCategory,
      categories: categories ?? [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/admin/achievements
 *
 * Creates a new achievement.
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
        "Only Guild Masters can manage achievements",
        "ACHIEVEMENT_ADMIN_FORBIDDEN",
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
        "ACHIEVEMENT_NAME_REQUIRED",
      );
    }

    if (!category_id) {
      throw new ValidationError(
        "Category is required",
        "ACHIEVEMENT_CATEGORY_REQUIRED",
      );
    }

    if (!criteria_type) {
      throw new ValidationError(
        "Criteria type is required",
        "ACHIEVEMENT_CRITERIA_TYPE_REQUIRED",
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    const { data: achievement, error: insertError } = await serviceSupabase
      .from("achievements")
      .insert({
        name: name.trim(),
        description: description ?? "",
        icon: icon ?? null,
        category_id,
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
      throw new Error(`Failed to create achievement: ${insertError.message}`);
    }

    return NextResponse.json({ success: true, achievement }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
