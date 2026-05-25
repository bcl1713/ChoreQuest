"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type FamilyAchievementDisplay = {
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
  category: {
    id: string;
    name: string;
    icon: string | null;
    display_order: number | null;
  } | null;
};

export type FamilyAchievementCategory = {
  id: string;
  name: string;
  icon: string | null;
  display_order: number | null;
  achievements: FamilyAchievementDisplay[];
};

export interface UseFamilyAchievementsReturn {
  categories: FamilyAchievementCategory[];
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

export function useFamilyAchievements(
  familyId: string | null | undefined,
): UseFamilyAchievementsReturn {
  const [categories, setCategories] = useState<FamilyAchievementCategory[]>([]);
  const [isLoading, setIsLoading] = useState(!!familyId);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsLoading(!!familyId);
    if (!familyId) setCategories([]);
  }, [familyId]);

  const fetchFamilyAchievements = useCallback(async () => {
    if (!familyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/api/family-achievements", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error ||
            `Failed to fetch family achievements (${response.status})`,
        );
      }

      const data = await response.json();
      const achievements: FamilyAchievementDisplay[] = data.achievements ?? [];

      // Group by category
      const categoryMap = new Map<string, FamilyAchievementCategory>();
      const uncategorized: FamilyAchievementDisplay[] = [];

      for (const ach of achievements) {
        if (ach.category) {
          const catId = ach.category.id;
          if (!categoryMap.has(catId)) {
            categoryMap.set(catId, {
              id: catId,
              name: ach.category.name,
              icon: ach.category.icon,
              display_order: ach.category.display_order,
              achievements: [],
            });
          }
          categoryMap.get(catId)!.achievements.push(ach);
        } else {
          uncategorized.push(ach);
        }
      }

      const sorted = Array.from(categoryMap.values()).sort(
        (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999),
      );

      if (uncategorized.length > 0) {
        sorted.push({
          id: "__uncategorized__",
          name: "Other",
          icon: null,
          display_order: 999,
          achievements: uncategorized,
        });
      }

      setCategories(sorted);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch family achievements",
      );
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchFamilyAchievements();
  }, [fetchFamilyAchievements, retryCount]);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  return { categories, isLoading, error, retry };
}
