"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { deduplicateQuests } from "@/lib/utils/data";
import type { QuestInstance } from "@/lib/types/database";

interface UseQuestsReturn {
  quests: QuestInstance[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing quest data with realtime updates.
 *
 * This hook consolidates the quest loading logic from quest-dashboard and provides
 * realtime subscriptions to automatically update the quest list when quests are
 * created, updated, or deleted.
 *
 * The hook uses optimistic realtime updates to merge changes without full reloads,
 * and deduplicates quests to ensure data consistency.
 *
 * @returns {UseQuestsReturn} Object containing:
 *   - quests: Array of quest instance objects for the current family
 *   - loading: Boolean indicating if data is currently being fetched
 *   - error: Error message string if fetch failed, null otherwise
 *   - reload: Function to manually trigger a data reload
 *
 * @example
 * const { quests, loading, error, reload } = useQuests();
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <QuestList quests={quests} />;
 */
export function useQuests(): UseQuestsReturn {
  const { profile } = useAuth();
  const { onQuestUpdate } = useRealtime();
  const [quests, setQuests] = useState<QuestInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuests = useCallback(async () => {
    if (!profile?.family_id) {
      setQuests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("quest_instances")
        .select("*")
        .eq("family_id", profile.family_id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch quest instances: ${fetchError.message}`);
      }

      setQuests(deduplicateQuests((data as QuestInstance[]) ?? []));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load quests";
      setError(message);
      setQuests([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.family_id]);

  useEffect(() => {
    void loadQuests();
  }, [loadQuests]);

  // Realtime subscription for quest updates
  useEffect(() => {
    if (!profile?.family_id) return;

    const unsubscribe = onQuestUpdate((event) => {
      setQuests((current) => {
        if (!event?.action) return current;
        const record = (event.record ?? {}) as Partial<QuestInstance>;
        const oldRecord = (event.old_record ?? {}) as Partial<QuestInstance>;

        if (event.action === "INSERT" && record.id) {
          return deduplicateQuests([record as QuestInstance, ...current]);
        }

        if (event.action === "UPDATE" && record.id) {
          return deduplicateQuests(
            current.map((quest) =>
              quest.id === record.id
                ? { ...quest, ...record }
                : quest
            )
          );
        }

        if (event.action === "DELETE" && oldRecord.id) {
          return current.filter((quest) => quest.id !== oldRecord.id);
        }

        return current;
      });
    });

    return unsubscribe;
  }, [onQuestUpdate, profile?.family_id]);

  return {
    quests,
    loading,
    error,
    reload: loadQuests,
  };
}
