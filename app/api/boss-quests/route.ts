import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateAndFetchUserProfile,
  authErrorResponse,
  extractBearerToken,
  isAuthError,
} from "@/lib/api-auth-helpers";
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
    const tokenOrError = extractBearerToken(request);
    if (isAuthError(tokenOrError)) {
      return authErrorResponse(tokenOrError);
    }

    const token = tokenOrError;
    const supabase = createServerSupabaseClient(token);

    const userOrError = await authenticateAndFetchUserProfile(supabase, token);
    if (isAuthError(userOrError)) {
      return authErrorResponse(userOrError);
    }

    const requesterProfile = userOrError;
    if (requesterProfile.role !== "GUILD_MASTER") {
      return NextResponse.json(
        { error: "Only Guild Masters can create boss quests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createBossQuestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid boss quest payload", details: parsed.error.flatten() },
        { status: 400 }
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
      return NextResponse.json(
        { error: `Failed to create boss quest: ${createError?.message ?? "Unknown error"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ bossQuest: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error creating boss quest:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
