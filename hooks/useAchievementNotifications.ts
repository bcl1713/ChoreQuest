"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRealtime } from "@/lib/realtime-context";
import type { RealtimeEvent } from "@/lib/realtime-context";
import {
  fetchAchievementById,
  fetchFamilyAchievementById,
  fetchUnnotifiedAchievements,
  fetchUnnotifiedFamilyAchievements,
  markCharacterAchievementNotified,
  markFamilyAchievementNotified,
} from "./useAchievementNotifications.helpers";

export type AchievementNotification = {
  /** character_achievements.id or family_achievement_progress.id — used to mark notified */
  id: string;
  /** achievements.id or family_achievements.id — used for deduplication */
  achievementId: string;
  name: string;
  description: string;
  icon: string | null;
  xpReward: number | null;
  goldReward: number | null;
  /** True when this is a family achievement unlock */
  isFamily?: boolean;
};

export interface UseAchievementNotificationsReturn {
  current: AchievementNotification | null;
  onDismiss: () => void;
}

export function useAchievementNotifications(
  characterId: string | null | undefined,
  familyId?: string | null,
): UseAchievementNotificationsReturn {
  const { onAchievementUnlockUpdate, onFamilyAchievementUnlockUpdate } =
    useRealtime();
  const [queue, setQueue] = useState<AchievementNotification[]>([]);
  // Track achievement IDs already in the queue to deduplicate catch-up + realtime
  const queuedAchievementIds = useRef<Set<string>>(new Set());
  // Track the current characterId so in-flight async fetches can detect stale results
  const currentCharacterIdRef = useRef<string | null | undefined>(characterId);
  currentCharacterIdRef.current = characterId;
  // Track the current familyId so in-flight family fetches can detect stale results
  const currentFamilyIdRef = useRef<string | null | undefined>(familyId);
  currentFamilyIdRef.current = familyId;
  // Guard to avoid re-firing the mark-notified effect for the same id;
  // reset when the queue is cleared so failed writes can be retried
  const prevCurrentIdRef = useRef<string | null>(null);
  // Track previous familyId to distinguish family changes from character-only changes
  const prevFamilyIdRef = useRef<string | null | undefined>(familyId);

  const enqueue = useCallback((notification: AchievementNotification) => {
    if (queuedAchievementIds.current.has(notification.achievementId)) return;
    queuedAchievementIds.current.add(notification.achievementId);
    setQueue((prev) => [...prev, notification]);
  }, []);

  // Catch-up query: runs on mount and on character switch
  useEffect(() => {
    const familyChanged = familyId !== prevFamilyIdRef.current;
    prevFamilyIdRef.current = familyId;
    prevCurrentIdRef.current = null;

    if (familyChanged) {
      // Family changed — full reset
      queuedAchievementIds.current = new Set();
      setQueue([]);
    } else {
      // Only characterId changed within the same family — preserve pending family notifications
      setQueue((prev) => {
        const kept = prev.filter((n) => n.isFamily);
        queuedAchievementIds.current = new Set(
          kept.map((n) => n.achievementId),
        );
        return kept;
      });
    }

    if (!characterId && !familyId) {
      return;
    }

    let cancelled = false;

    if (characterId) {
      fetchUnnotifiedAchievements(characterId).then((notifications) => {
        if (cancelled) return;
        notifications.forEach(enqueue);
      });
    }

    if (familyId) {
      fetchUnnotifiedFamilyAchievements(familyId).then((notifications) => {
        if (cancelled) return;
        notifications.forEach(enqueue);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [characterId, familyId, enqueue]);

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

  // Realtime subscription for family achievement unlocks
  useEffect(() => {
    if (!familyId) return;

    const unsubscribe = onFamilyAchievementUnlockUpdate(
      (event: RealtimeEvent) => {
        if (event.action !== "UPDATE") return;

        const record = event.record;
        const oldRecord = event.old_record;

        // Handle non-null → null (re-lock): remove any stale queued toast
        if (!record.unlocked_at && oldRecord?.unlocked_at != null) {
          const reLockedKey = `family_${record.family_achievement_id as string}`;
          if (queuedAchievementIds.current.has(reLockedKey)) {
            queuedAchievementIds.current.delete(reLockedKey);
            setQueue((prev) =>
              prev.filter((n) => n.achievementId !== reLockedKey),
            );
          }
          // Clear the notified guard so the next unlock of the same progress row
          // triggers markFamilyAchievementNotified again (same id, different epoch).
          const reLockedProgressId = record.id as string;
          if (prevCurrentIdRef.current === reLockedProgressId) {
            prevCurrentIdRef.current = null;
          }
          return;
        }

        // Only process null → non-null unlocked_at transitions
        if (!record.unlocked_at) return;
        if (oldRecord?.unlocked_at != null) return;

        const familyAchievementId = record.family_achievement_id as string;
        const progressId = record.id as string;
        // Capture familyId at event-receive time so we can detect a switch
        const capturedFamilyId = familyId;

        fetchFamilyAchievementById(familyAchievementId).then((achievement) => {
          if (!achievement) return;
          // Discard if the active family changed while the fetch was in-flight
          if (currentFamilyIdRef.current !== capturedFamilyId) return;
          enqueue({
            id: progressId,
            achievementId: `family_${familyAchievementId}`,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            xpReward: achievement.xp_reward,
            goldReward: achievement.gold_reward,
            isFamily: true,
          });
        });
      },
    );

    return unsubscribe;
  }, [familyId, onFamilyAchievementUnlockUpdate, enqueue]);

  // Mark notified when a new item becomes current; only set the guard on success
  // so transient failures (auth not ready, network, 5xx) can be retried on remount
  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current) return;
    if (current.id === prevCurrentIdRef.current) return;
    const markNotified = current.isFamily
      ? markFamilyAchievementNotified
      : markCharacterAchievementNotified;
    markNotified(current.id).then((success) => {
      if (success) prevCurrentIdRef.current = current.id;
    });
  }, [current]);

  const onDismiss = useCallback(() => {
    setQueue((prev) => {
      const [dismissed, ...next] = prev;
      if (dismissed) {
        queuedAchievementIds.current.delete(dismissed.achievementId);
      }
      return next;
    });
  }, []);

  return { current, onDismiss };
}
