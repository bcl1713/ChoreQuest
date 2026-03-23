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
 * GET /api/admin/achievement-categories
 *
 * Returns all achievement categories ordered by display_order.
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
        "Only Guild Masters can manage achievement categories",
        "ACHIEVEMENT_CATEGORY_FORBIDDEN",
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    // Fetch categories with achievement counts
    const { data: categories, error: catError } = await serviceSupabase
      .from("achievement_categories")
      .select("id, name, description, icon, display_order")
      .order("display_order", { ascending: true });

    if (catError) {
      throw new Error(`Failed to fetch categories: ${catError.message}`);
    }

    // Get achievement counts per category
    const { data: achievements, error: achError } = await serviceSupabase
      .from("achievements")
      .select("id, category_id");

    if (achError) {
      throw new Error(
        `Failed to fetch achievement counts: ${achError.message}`,
      );
    }

    const countByCategory = new Map<string, number>();
    for (const a of achievements ?? []) {
      countByCategory.set(
        a.category_id,
        (countByCategory.get(a.category_id) ?? 0) + 1,
      );
    }

    const categoriesWithCounts = (categories ?? []).map((cat) => ({
      ...cat,
      achievement_count: countByCategory.get(cat.id) ?? 0,
    }));

    return NextResponse.json({ categories: categoriesWithCounts });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/admin/achievement-categories
 *
 * Creates a new achievement category.
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
        "Only Guild Masters can manage achievement categories",
        "ACHIEVEMENT_CATEGORY_FORBIDDEN",
      );
    }

    const body = await request.json();
    const { name, description, icon, display_order } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new ValidationError(
        "Category name is required",
        "CATEGORY_NAME_REQUIRED",
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    const { data: category, error: insertError } = await serviceSupabase
      .from("achievement_categories")
      .insert({
        name: name.trim(),
        description: description ?? null,
        icon: icon ?? null,
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create category: ${insertError.message}`);
    }

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
