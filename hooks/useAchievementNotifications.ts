"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/lib/realtime-context";
import type { RealtimeEvent } from "@/lib/realtime-context";

export type AchievementNotification = {
  /** character_achievements.id — used to mark notified */
  id: string;
  /** achievements.id — used for deduplication */
  achievementId: string;
  name: string;
  description: string;
  icon: string | null;
  xpReward: number | null;
  goldReward: number | null;
};

async function getAuthToken(): Promise<string | null> {
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

async function fetchAchievementById(achievementId: string): Promise<{
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

async function markCharacterAchievementNotified(id: string): Promise<boolean> {
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

async function fetchUnnotifiedAchievements(
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

export interface UseAchievementNotificationsReturn {
  current: AchievementNotification | null;
  onDismiss: () => void;
}

export function useAchievementNotifications(
  characterId: string | null | undefined,
): UseAchievementNotificationsReturn {
  const { onAchievementUnlockUpdate } = useRealtime();
  const [queue, setQueue] = useState<AchievementNotification[]>([]);
  // Track achievement IDs already in the queue to deduplicate catch-up + realtime
  const queuedAchievementIds = useRef<Set<string>>(new Set());
  // Track the current characterId so in-flight async fetches can detect stale results
  const currentCharacterIdRef = useRef<string | null | undefined>(characterId);
  currentCharacterIdRef.current = characterId;
  // Guard to avoid re-firing the mark-notified effect for the same id;
  // reset when the queue is cleared so failed writes can be retried
  const prevCurrentIdRef = useRef<string | null>(null);

  const enqueue = useCallback((notification: AchievementNotification) => {
    if (queuedAchievementIds.current.has(notification.achievementId)) return;
    queuedAchievementIds.current.add(notification.achievementId);
    setQueue((prev) => [...prev, notification]);
  }, []);

  // Catch-up query: runs on mount and on character switch
  useEffect(() => {
    // Clear queue and refs on character change or deselection
    queuedAchievementIds.current = new Set();
    prevCurrentIdRef.current = null;
    setQueue([]);

    if (!characterId) {
      return;
    }

    let cancelled = false;

    fetchUnnotifiedAchievements(characterId).then((notifications) => {
      if (cancelled) return;
      notifications.forEach(enqueue);
    });

    return () => {
      cancelled = true;
    };
  }, [characterId, enqueue]);

  // Realtime subscription for new unlocks
  useEffect(() => {
    if (!characterId) return;

    const unsubscribe = onAchievementUnlockUpdate((event: RealtimeEvent) => {
      // Only act on UPDATE events (unlock engine UPDATEs existing rows)
      if (event.action !== "UPDATE") return;

      const record = event.record;
      const oldRecord = event.old_record;

      // Filter to current character only
      if (record.character_id !== characterId) return;

      // Only process null → non-null unlocked_at transitions
      if (!record.unlocked_at) return;
      if (oldRecord?.unlocked_at != null) return;

      // Skip if already notified
      if (record.notified) return;

      const achievementId = record.achievement_id as string;
      const caId = record.id as string;
      // Capture the characterId at event-receive time so we can detect a switch
      const capturedCharId = characterId;

      // Fetch achievement data and enqueue
      fetchAchievementById(achievementId).then((achievement) => {
        if (!achievement) return;
        // Discard if the active character changed while the fetch was in-flight
        if (currentCharacterIdRef.current !== capturedCharId) return;
        enqueue({
          id: caId,
          achievementId,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          xpReward: achievement.xp_reward,
          goldReward: achievement.gold_reward,
        });
      });
    });

    return unsubscribe;
  }, [characterId, onAchievementUnlockUpdate, enqueue]);

  // Mark notified when a new item becomes current; only set the guard on success
  // so transient failures (auth not ready, network, 5xx) can be retried on remount
  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current) return;
    if (current.id === prevCurrentIdRef.current) return;
    markCharacterAchievementNotified(current.id).then((success) => {
      if (success) prevCurrentIdRef.current = current.id;
    });
  }, [current]);

  const onDismiss = useCallback(() => {
    setQueue((prev) => {
      const next = prev.slice(1);
      return next;
    });
  }, []);

  return { current, onDismiss };
}
