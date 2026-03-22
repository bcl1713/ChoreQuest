"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type AchievementDisplay = {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  xp_reward: number | null;
  gold_reward: number | null;
  is_hidden: boolean | null;
  criteria_type: string;
  unlocked_at: string | null;
  progress: { current: number; threshold: number } | null;
};

export type AchievementCategory = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  achievements: AchievementDisplay[];
};

export interface UseAchievementsReturn {
  categories: AchievementCategory[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

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

export function useAchievements(
  characterId: string | null | undefined,
): UseAchievementsReturn {
  const [categories, setCategories] = useState<AchievementCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchAchievements = useCallback(async () => {
    if (!characterId) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(
        `/api/achievements?characterId=${encodeURIComponent(characterId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to fetch achievements (${response.status})`,
        );
      }

      const data = await response.json();
      setCategories(data.categories);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch achievements",
      );
    } finally {
      setIsLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements, retryCount]);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  return { categories, isLoading, error, retry };
}
