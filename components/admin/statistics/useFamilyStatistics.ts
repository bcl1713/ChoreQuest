"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { StatisticsService, type FamilyStatistics } from "@/lib/statistics-service";

const statisticsService = new StatisticsService();

export function useFamilyStatistics() {
  const { profile } = useAuth();
  const { onQuestUpdate, onRewardRedemptionUpdate, onCharacterUpdate } = useRealtime();
  const [statistics, setStatistics] = useState<FamilyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    if (!profile?.family_id) return;

    try {
      setLoading(true);
      setError(null);
      const stats = await statisticsService.getFamilyStatistics(profile.family_id);
      setStatistics(stats);
    } catch (err) {
      console.error("Failed to load statistics:", err);
      setError("Failed to load family statistics");
    } finally {
      setLoading(false);
    }
  }, [profile?.family_id]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  useEffect(() => {
    const unsubscribeQuest = onQuestUpdate(() => {
      loadStatistics();
    });

    const unsubscribeRedemption = onRewardRedemptionUpdate(() => {
      loadStatistics();
    });

    const unsubscribeCharacter = onCharacterUpdate(() => {
      loadStatistics();
    });

    return () => {
      unsubscribeQuest();
      unsubscribeRedemption();
      unsubscribeCharacter();
    };
  }, [onQuestUpdate, onRewardRedemptionUpdate, onCharacterUpdate, loadStatistics]);

  return { statistics, loading, error, reload: loadStatistics };
}
