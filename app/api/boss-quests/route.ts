import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateAndFetchUserProfile,
  extractBearerToken,
} from "@/lib/api-auth-helpers";
import { handleRouteError } from "@/lib/api-error-handler";
import { AppError, ForbiddenError, ValidationError } from "@/lib/errors";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const createBossQuestSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  reward_gold: z.number().int().min(0).default(0),
  reward_xp: z.number().int().min(0).default(0),
  join_window_minutes: z.number().int().positive().max(24 * 60).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    const supabase = createServerSupabaseClient(token);
    const requesterProfile = await authenticateAndFetchUserProfile(supabase, token);
    if (requesterProfile.role !== "GUILD_MASTER") {
      throw new ForbiddenError(
        "Only Guild Masters can create boss quests",
        "BOSS_QUEST_CREATE_FORBIDDEN",
      );
    }

    const body = await request.json();
    const parsed = createBossQuestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid boss quest payload",
        "VALIDATION_ERROR",
        parsed.error.flatten(),
      );
    }

    const {
      name,
      description,
      reward_gold,
      reward_xp,
      join_window_minutes = 60,
    } = parsed.data;

    const now = new Date();
    const joinWindowExpiresAt = new Date(
      now.getTime() + join_window_minutes * 60 * 1000
    ).toISOString();

    const { data: created, error: createError } = await supabase
      .from("boss_battles")
      .insert({
        name,
        description,
        family_id: requesterProfile.family_id,
        total_hp: 100,
        current_hp: 100,
        status: "ACTIVE",
        start_date: now.toISOString(),
        end_date: joinWindowExpiresAt,
        reward_gold,
        reward_xp,
        honor_reward: 1,
        join_window_minutes,
        join_window_expires_at: joinWindowExpiresAt,
      })
      .select()
      .single();

    if (createError || !created) {
      throw new AppError(
        `Failed to create boss quest: ${createError?.message ?? "Unknown error"}`,
        500,
        "BOSS_QUEST_CREATE_FAILED",
      );
    }

    return NextResponse.json({ bossQuest: created }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
