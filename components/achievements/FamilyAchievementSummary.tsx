"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { FantasyCard } from "@/components/ui/FantasyCard";
import { FantasyIcon } from "@/components/icons/FantasyIcon";
import { ProgressBar } from "@/components/animations/ProgressBar";
import type { FamilyAchievementCategory } from "@/hooks/useFamilyAchievements";

interface FamilyAchievementSummaryProps {
  categories: FamilyAchievementCategory[];
  selectedCategoryId?: string | null;
}

export function FamilyAchievementSummary({
  categories,
  selectedCategoryId,
}: FamilyAchievementSummaryProps) {
  const { unlocked, total } = useMemo(() => {
    let unlockedCount = 0;
    let totalCount = 0;

    const filteredCategories = selectedCategoryId
      ? categories.filter((c) => c.id === selectedCategoryId)
      : categories;

    for (const category of filteredCategories) {
      for (const achievement of category.achievements) {
        const isLockedHidden =
          achievement.is_hidden && !achievement.unlocked_at;
        if (!isLockedHidden) totalCount++;
        if (achievement.unlocked_at) unlockedCount++;
      }
    }

    return { unlocked: unlockedCount, total: totalCount };
  }, [categories, selectedCategoryId]);

  const label = selectedCategoryId
    ? (categories.find((c) => c.id === selectedCategoryId)?.name ?? "Category")
    : "Family Achievements";

  return (
    <FantasyCard
      variant="default"
      className="p-4 mb-6"
      data-testid="family-achievement-summary"
    >
      <div className="flex items-center gap-3 mb-3">
        <FantasyIcon icon={Users} type="gold" size="lg" glow />
        <div>
          <h3 className="font-fantasy text-lg text-gold-300">{label}</h3>
          <p
            className="text-sm text-gray-400"
            data-testid="family-achievement-count"
          >
            {unlocked}/{total} Family Achievements Unlocked
          </p>
        </div>
      </div>
      <ProgressBar
        current={unlocked}
        max={total}
        showValues={false}
        showPercentage
        variant="gold"
      />
    </FantasyCard>
  );
}
