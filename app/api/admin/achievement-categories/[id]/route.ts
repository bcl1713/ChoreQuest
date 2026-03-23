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
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";

async function verifyCategoryExists(
  serviceSupabase: ReturnType<typeof createServiceSupabaseClient>,
  id: string,
) {
  const { data: existing, error: fetchError } = await serviceSupabase
    .from("achievement_categories")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch category: ${fetchError.message}`);
  }

  if (!existing) {
    throw new NotFoundError(
      "Achievement category not found",
      "CATEGORY_NOT_FOUND",
    );
  }
}

/**
 * PATCH /api/admin/achievement-categories/[id]
 *
 * Updates an existing achievement category.
 * Requires Guild Master role.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length === 0)
    ) {
      throw new ValidationError(
        "Category name cannot be empty",
        "CATEGORY_NAME_REQUIRED",
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    await verifyCategoryExists(serviceSupabase, id);

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data: category, error: updateError } = await serviceSupabase
      .from("achievement_categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update category: ${updateError.message}`);
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * DELETE /api/admin/achievement-categories/[id]
 *
 * Deletes an achievement category if it has no achievements assigned.
 * Requires Guild Master role.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    await verifyCategoryExists(serviceSupabase, id);

    // Check if category has achievements
    const { count, error: countError } = await serviceSupabase
      .from("achievements")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (countError) {
      throw new Error(`Failed to check achievements: ${countError.message}`);
    }

    if (count && count > 0) {
      throw new ConflictError(
        "Cannot delete category with achievements assigned. Remove or reassign achievements first.",
        "CATEGORY_HAS_ACHIEVEMENTS",
      );
    }

    const { error: deleteError } = await serviceSupabase
      .from("achievement_categories")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(`Failed to delete category: ${deleteError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
