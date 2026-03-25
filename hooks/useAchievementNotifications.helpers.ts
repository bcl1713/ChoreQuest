import { supabase } from "@/lib/supabase";
import type { AchievementNotification } from "./useAchievementNotifications";

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function fetchAchievementById(achievementId: string): Promise<{
  name: string;
  description: string;
  icon: string | null;
  xp_reward: number | null;
  gold_reward: number | null;
} | null> {
  const { data, error } = await supabase
    .from("achievements")
    .select("name, description, icon, xp_reward, gold_reward")
    .eq("id", achievementId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function markCharacterAchievementNotified(
  id: string,
): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;

  try {
    const response = await fetch(`/api/character-achievements/${id}/notified`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

type CatchUpRow = {
  id: string;
  achievement_id: string;
  achievements: {
    name: string;
    description: string;
    icon: string | null;
    xp_reward: number | null;
    gold_reward: number | null;
  } | null;
};

export async function fetchUnnotifiedAchievements(
  characterId: string,
): Promise<AchievementNotification[]> {
  const { data, error } = await supabase
    .from("character_achievements")
    .select(
      "id, achievement_id, achievements(name, description, icon, xp_reward, gold_reward)",
    )
    .eq("character_id", characterId)
    .not("unlocked_at", "is", null)
    .eq("notified", false);

  if (error || !data) return [];

  return (data as unknown as CatchUpRow[])
    .filter((row) => row.achievements !== null)
    .map((row) => ({
      id: row.id,
      achievementId: row.achievement_id,
      name: row.achievements!.name,
      description: row.achievements!.description,
      icon: row.achievements!.icon,
      xpReward: row.achievements!.xp_reward,
      goldReward: row.achievements!.gold_reward,
    }));
}

export async function fetchFamilyAchievementById(
  achievementId: string,
): Promise<{
  name: string;
  description: string;
  icon: string | null;
  xp_reward: number | null;
  gold_reward: number | null;
} | null> {
  const { data, error } = await supabase
    .from("family_achievements")
    .select("name, description, icon, xp_reward, gold_reward")
    .eq("id", achievementId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function markFamilyAchievementNotified(
  id: string,
): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;

  try {
    const response = await fetch(
      `/api/family-achievement-progress/${id}/notified`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

type FamilyCatchUpRow = {
  id: string;
  family_achievement_id: string;
  family_achievements: {
    name: string;
    description: string;
    icon: string | null;
    xp_reward: number | null;
    gold_reward: number | null;
  } | null;
};

export async function fetchUnnotifiedFamilyAchievements(
  familyId: string,
): Promise<AchievementNotification[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Recompute family progress before reading catch-up notifications.
  // A roster change (member join/leave) can leave unlocked_at stale until
  // the member-count backfill in /api/family-achievements runs.  We must
  // confirm the recompute succeeded before trusting any unlocked_at rows;
  // otherwise stale unlock state can produce false toasts or expose hidden
  // achievement metadata that the backfill would have re-locked.
  const token = await getAuthToken();
  if (!token) return [];

  try {
    const recomputeResponse = await fetch("/api/family-achievements", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!recomputeResponse.ok) return [];
  } catch {
    // Network failure — cannot verify that unlock state is fresh.
    return [];
  }

  // Step 1: all unlocked progress rows for this family
  const { data, error } = await supabase
    .from("family_achievement_progress")
    .select(
      "id, family_achievement_id, family_achievements(name, description, icon, xp_reward, gold_reward)",
    )
    .eq("family_id", familyId)
    .not("unlocked_at", "is", null);

  if (error || !data || data.length === 0) return [];

  // Step 2: which of those has this user already been notified about?
  const progressIds = (data as unknown as FamilyCatchUpRow[]).map((r) => r.id);
  const { data: notifiedData } = await supabase
    .from("family_achievement_user_notifications")
    .select("family_achievement_progress_id")
    .eq("user_id", user.id)
    .in("family_achievement_progress_id", progressIds);

  const notifiedSet = new Set(
    (notifiedData ?? []).map(
      (r: { family_achievement_progress_id: string }) =>
        r.family_achievement_progress_id,
    ),
  );

  return (data as unknown as FamilyCatchUpRow[])
    .filter(
      (row) => row.family_achievements !== null && !notifiedSet.has(row.id),
    )
    .map((row) => ({
      id: row.id,
      achievementId: `family_${row.family_achievement_id}`,
      name: row.family_achievements!.name,
      description: row.family_achievements!.description,
      icon: row.family_achievements!.icon,
      xpReward: row.family_achievements!.xp_reward,
      goldReward: row.family_achievements!.gold_reward,
      isFamily: true,
    }));
}
