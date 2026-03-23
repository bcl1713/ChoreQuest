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
import { FamilyAchievementProgressService } from "@/lib/family-achievement-progress-service";

async function requireGuildMaster(request: NextRequest) {
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

  return { requesterProfile, serviceSupabase: createServiceSupabaseClient() };
}

/**
 * GET /api/admin/family-achievements/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { requesterProfile, serviceSupabase } =
      await requireGuildMaster(request);

    const { data, error } = await serviceSupabase
      .from("family_achievements")
      .select("*")
      .eq("id", id)
      .eq("family_id", requesterProfile.family_id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch family achievement: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundError(
        "Family achievement not found",
        "FAMILY_ACHIEVEMENT_NOT_FOUND",
      );
    }

    return NextResponse.json({ achievement: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * PUT /api/admin/family-achievements/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { requesterProfile, serviceSupabase } =
      await requireGuildMaster(request);

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
        "FAMILY_ACHIEVEMENT_NAME_REQUIRED",
      );
    }

    // Verify exists and belongs to requester's family
    const { data: existing, error: fetchError } = await serviceSupabase
      .from("family_achievements")
      .select("id")
      .eq("id", id)
      .eq("family_id", requesterProfile.family_id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(
        `Failed to fetch family achievement: ${fetchError.message}`,
      );
    }
    if (!existing) {
      throw new NotFoundError(
        "Family achievement not found",
        "FAMILY_ACHIEVEMENT_NOT_FOUND",
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
      .from("family_achievements")
      .update(updateData)
      .eq("id", id)
      .eq("family_id", requesterProfile.family_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(
        `Failed to update family achievement: ${updateError.message}`,
      );
    }

    // Criteria changed — recompute progress so stored values and unlock state
    // stay consistent with the new definition.
    if (criteria_type !== undefined || criteria_config !== undefined) {
      const service = new FamilyAchievementProgressService();
      try {
        await service.recomputeAchievement(requesterProfile.family_id, id);
      } catch (err) {
        // Log but don't fail the request — the definition update succeeded.
        console.error(
          `Failed to recompute progress after criteria change for achievement ${id}:`,
          err,
        );
      }
    }

    return NextResponse.json({ success: true, achievement });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * DELETE /api/admin/family-achievements/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { requesterProfile, serviceSupabase } =
      await requireGuildMaster(request);

    const { error } = await serviceSupabase
      .from("family_achievements")
      .delete()
      .eq("id", id)
      .eq("family_id", requesterProfile.family_id);

    if (error) {
      throw new Error(`Failed to delete family achievement: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
