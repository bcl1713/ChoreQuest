"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import type { Database } from "@/lib/types/database-generated";

export type BossQuest = Database["public"]["Tables"]["boss_battles"]["Row"];

type BossQuestWithParticipants = BossQuest & {
  boss_battle_participants: {
    user_id: string | null;
    participation_status?: string | null;
    awarded_gold?: number | null;
    awarded_xp?: number | null;
    honor_awarded?: number | null;
    user_profiles?: { name?: string | null } | null;
  }[];
};

interface UseBossQuestsReturn {
  bossQuests: BossQuestWithParticipants[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Fetch boss quests for the family with realtime updates for boss quests and participants.
 */
export function useBossQuests(): UseBossQuestsReturn {
  const { profile } = useAuth();
  const { onBossQuestUpdate, onBossParticipantUpdate } = useRealtime();
  const [bossQuests, setBossQuests] = useState<BossQuestWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const loadBossQuests = useCallback(async () => {
    if (!profile?.family_id) {
      setBossQuests([]);
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("boss_battles")
        .select(
          "*, boss_battle_participants(user_id, participation_status, awarded_gold, awarded_xp, honor_awarded, approved_at, approved_by, user_profiles!boss_battle_participants_user_id_fkey(name))",
        )
        .eq("family_id", profile.family_id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setBossQuests((data as BossQuestWithParticipants[]) ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load boss quests";
      setError(message);
      setBossQuests([]);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [profile?.family_id]);

  useEffect(() => {
    void loadBossQuests();
  }, [loadBossQuests]);

  useEffect(() => {
    if (!profile?.family_id) return;

    const unsubscribeBoss = onBossQuestUpdate(() => {
      void loadBossQuests();
    });

    const unsubscribeParticipants = onBossParticipantUpdate(() => {
      void loadBossQuests();
    });

    return () => {
      unsubscribeBoss?.();
      unsubscribeParticipants?.();
    };
  }, [
    loadBossQuests,
    profile?.family_id,
    onBossQuestUpdate,
    onBossParticipantUpdate,
  ]);

  return {
    bossQuests,
    loading,
    error,
    reload: loadBossQuests,
  };
}
