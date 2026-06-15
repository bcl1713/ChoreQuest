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
import { getActiveSeasonForFamily } from "@/lib/seasons/active-season";
import { fetchFamilyAchievementProgressForSeason } from "@/lib/family-achievement-progress/season-progress-reader";

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
    const activeSeason = await getActiveSeasonForFamily(serviceSupabase, familyId);

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

    const progress = activeSeason
      ? await (async () => {
          return fetchFamilyAchievementProgressForSeason(
            serviceSupabase,
            familyId,
            activeSeason.id,
          );
        })()
      : [];

    // Build progress lookup
    let progressMap = new Map(
      (progress ?? []).map((p) => [p.family_achievement_id, p]),
    );

    const hasMissingProgress = (achievements ?? []).some(
      (a) => !progressMap.has(a.id),
    );
    const storedCounts: number[] = [];
    const storedWithChars: number[] = [];
    let hasLegacyRows = false;
    for (const p of progressMap.values()) {
      const snap = p.progress as {
        member_count?: number;
        members_with_char_count?: number;
      } | null;
      if (snap?.member_count !== undefined)
        storedCounts.push(snap.member_count);
      if (snap?.members_with_char_count !== undefined)
        storedWithChars.push(snap.members_with_char_count);
      if (
        snap?.member_count === undefined &&
        snap?.members_with_char_count === undefined
      )
        hasLegacyRows = true;
    }

    const familyService = new FamilyAchievementProgressService(serviceSupabase);
    let backfilled = false;
    let backfillFailed = false;
    if (activeSeason) {
      try {
        backfilled = await familyService.backfillIfStale(
          familyId,
          hasMissingProgress,
          storedCounts,
          storedWithChars,
          hasLegacyRows,
        );
      } catch (backfillErr) {
        console.error("Family achievement backfill failed:", backfillErr);
        // Fail closed: we cannot verify cached unlock state is still valid after
        // a potential roster change, so hidden achievements will be redacted below.
        backfillFailed = true;
      }
    }

    if (backfilled) {
      try {
        const freshProgress = await fetchFamilyAchievementProgressForSeason(
          serviceSupabase,
          familyId,
          activeSeason!.id,
        );
        progressMap = new Map(
          (freshProgress ?? []).map((p) => [p.family_achievement_id, p]),
        );
      } catch (refreshError) {
        console.error(
          "Failed to reload progress after backfill:",
          refreshError,
        );
        // Fail closed: backfillIfStale() may have cleared unlocked_at for
        // re-locked hidden achievements, but we cannot confirm that without a
        // fresh read.  Treat this as a failed backfill so hidden achievements
        // are redacted below rather than served with stale metadata.
        backfillFailed = true;
      }
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

      // When backfill failed we cannot verify that a hidden achievement's cached
      // unlock is still valid (the roster may have changed). Redact hidden
      // achievements only — visible achievements can safely use the previously
      // read progress row regardless of backfill outcome.
      const effectiveProgress = backfillFailed && a.is_hidden ? undefined : p;
      const isLocked = a.is_hidden && !effectiveProgress?.unlocked_at;

      // Strip the internal member_count tracking key from the stored progress
      // so the public API only exposes { current, threshold }.
      const rawProgress = effectiveProgress?.progress as
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
        category: achievement_categories,
        unlocked_at: effectiveProgress?.unlocked_at ?? null,
        progress: isLocked ? null : progressForResponse,
        notified: effectiveProgress?.notified ?? null,
      };
    });

    return NextResponse.json({
      achievements: mergedAchievements,
      backfill_ok: !backfillFailed,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
