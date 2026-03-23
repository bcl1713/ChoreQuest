"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { LoadingSpinner, Button } from "@/components/ui";
import { AchievementSummary } from "./AchievementSummary";
import { AchievementGrid } from "./AchievementGrid";
import { AchievementDetailModal } from "./AchievementDetailModal";
import type { AchievementDisplay } from "@/hooks/useAchievements";

interface AchievementsSectionProps {
  characterId: string;
}

export function AchievementsSection({ characterId }: AchievementsSectionProps) {
  const { categories, isLoading, error, retry } = useAchievements(characterId);
  const [selectedAchievement, setSelectedAchievement] =
    useState<AchievementDisplay | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (
      selectedCategoryId !== null &&
      !categories.some((c) => c.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(null);
    }
  }, [categories, selectedCategoryId]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        data-testid="achievements-loading"
      >
        <LoadingSpinner
          size="lg"
          className="mb-2"
          aria-label="Loading achievements"
        />
        <p className="text-gray-400 ml-3">Loading achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" data-testid="achievements-error">
        <p className="text-red-400 mb-4">{error}</p>
        <Button
          onClick={retry}
          variant="secondary"
          size="sm"
          startIcon={<RefreshCw className="h-4 w-4" />}
          data-testid="achievements-retry"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="achievements-section">
      <AchievementSummary
        categories={categories}
        selectedCategoryId={selectedCategoryId}
      />
      <AchievementGrid
        categories={categories}
        onBadgeClick={setSelectedAchievement}
        onActiveCategoryChange={setSelectedCategoryId}
      />
      <AchievementDetailModal
        achievement={selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
}
