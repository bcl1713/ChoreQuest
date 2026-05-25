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
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

/**
 * PATCH /api/admin/achievements/[id]
 *
 * Updates an existing achievement (category, hidden flag, rewards, etc.).
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

    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length === 0)
    ) {
      throw new ValidationError(
        "Achievement name cannot be empty",
        "ACHIEVEMENT_NAME_REQUIRED",
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    // Verify achievement exists and belongs to requester's family
    const { data: existing, error: fetchError } = await serviceSupabase
      .from("achievements")
      .select("id, family_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch achievement: ${fetchError.message}`);
    }

    if (!existing) {
      throw new NotFoundError("Achievement not found", "ACHIEVEMENT_NOT_FOUND");
    }

    if (existing.family_id !== requesterProfile.family_id) {
      throw new ForbiddenError(
        "You can only update achievements belonging to your family",
        "ACHIEVEMENT_ADMIN_FORBIDDEN",
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (xp_reward !== undefined) updateData.xp_reward = xp_reward;
    if (gold_reward !== undefined) updateData.gold_reward = gold_reward;
    if (is_hidden !== undefined) updateData.is_hidden = is_hidden;
    if (criteria_type !== undefined) updateData.criteria_type = criteria_type;
    if (criteria_config !== undefined)
      updateData.criteria_config = criteria_config;

    const { data: achievement, error: updateError } = await serviceSupabase
      .from("achievements")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update achievement: ${updateError.message}`);
    }

    // Invalidate stale progress rows so they are recomputed on the next event
    if (criteria_type !== undefined || criteria_config !== undefined) {
      const { error: deleteError } = await serviceSupabase
        .from("character_achievements")
        .delete()
        .eq("achievement_id", id);

      if (deleteError) {
        console.error(
          `Failed to invalidate progress for achievement ${id}: ${deleteError.message}`,
        );
      }
    }

    return NextResponse.json({ success: true, achievement });
  } catch (error) {
    return handleRouteError(error);
  }
}
