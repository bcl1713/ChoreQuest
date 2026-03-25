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
import { FamilyAchievementProgressService } from "@/lib/family-achievement-progress-service";

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
    let progressMap = new Map(
      (progress ?? []).map((p) => [p.family_achievement_id, p]),
    );

    const hasMissingProgress = (achievements ?? []).some(
      (a) => !progressMap.has(a.id),
    );
    const storedCounts: number[] = [];
    const storedWithChars: number[] = [];
    for (const p of progressMap.values()) {
      const snap = p.progress as {
        member_count?: number;
        members_with_char_count?: number;
      } | null;
      if (snap?.member_count !== undefined)
        storedCounts.push(snap.member_count);
      if (snap?.members_with_char_count !== undefined)
        storedWithChars.push(snap.members_with_char_count);
    }

    const familyService = new FamilyAchievementProgressService(serviceSupabase);
    let backfilled = false;
    try {
      backfilled = await familyService.backfillIfStale(
        familyId,
        hasMissingProgress,
        storedCounts,
        storedWithChars,
      );
    } catch (backfillErr) {
      console.error("Family achievement backfill failed:", backfillErr);
    }

    if (backfilled) {
      const { data: freshProgress } = await serviceSupabase
        .from("family_achievement_progress")
        .select("family_achievement_id, unlocked_at, progress, notified")
        .eq("family_id", familyId);
      progressMap = new Map(
        (freshProgress ?? []).map((p) => [p.family_achievement_id, p]),
      );
    }

    // Merge achievements with progress
    const mergedAchievements = (achievements ?? []).map((a) => {
      const p = progressMap.get(a.id);
      const {
        achievement_categories,
        criteria_type,
        criteria_config,
        ...rest
      } = a;
      const isLocked = a.is_hidden && !p?.unlocked_at;

      // Strip the internal member_count tracking key from the stored progress
      // so the public API only exposes { current, threshold }.
      const rawProgress = p?.progress as
        | { current: number; threshold: number; member_count?: number }
        | null
        | undefined;
      const progressForResponse = rawProgress
        ? { current: rawProgress.current, threshold: rawProgress.threshold }
        : null;

      return {
        ...rest,
        // Redact criteria for hidden achievements that haven't been unlocked —
        // exposing these fields would let users reverse-engineer the unlock
        // condition even though the name/description are masked.
        criteria_type: isLocked ? null : criteria_type,
        criteria_config: isLocked ? null : criteria_config,
        name: isLocked ? "???" : a.name,
        description: isLocked ? "???" : a.description,
        icon: isLocked ? null : a.icon,
        xp_reward: isLocked ? null : a.xp_reward,
        gold_reward: isLocked ? null : a.gold_reward,
        category: isLocked ? null : achievement_categories,
        unlocked_at: p?.unlocked_at ?? null,
        progress: isLocked ? null : progressForResponse,
        notified: p?.notified ?? null,
      };
    });

    return NextResponse.json({ achievements: mergedAchievements });
  } catch (error) {
    return handleRouteError(error);
  }
}
