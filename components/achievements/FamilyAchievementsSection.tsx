"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useFamilyAchievements } from "@/hooks/useFamilyAchievements";
import { LoadingSpinner, Button } from "@/components/ui";
import { FamilyAchievementSummary } from "./FamilyAchievementSummary";
import { FamilyAchievementGrid } from "./FamilyAchievementGrid";
import { FamilyAchievementDetailModal } from "./FamilyAchievementDetailModal";
import type { FamilyAchievementDisplay } from "@/hooks/useFamilyAchievements";

interface FamilyAchievementsSectionProps {
  familyId: string | null | undefined;
}

export function FamilyAchievementsSection({
  familyId,
}: FamilyAchievementsSectionProps) {
  const { categories, isLoading, error, retry } =
    useFamilyAchievements(familyId);
  const [selectedAchievement, setSelectedAchievement] =
    useState<FamilyAchievementDisplay | null>(null);
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

  if (!familyId) return null;

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        data-testid="family-achievements-loading"
      >
        <LoadingSpinner
          size="lg"
          className="mb-2"
          aria-label="Loading family achievements"
        />
        <p className="text-gray-400 ml-3">Loading family achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="text-center py-12"
        data-testid="family-achievements-error"
      >
        <p className="text-red-400 mb-4">{error}</p>
        <Button
          onClick={retry}
          variant="secondary"
          size="sm"
          startIcon={<RefreshCw className="h-4 w-4" />}
          data-testid="family-achievements-retry"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="family-achievements-section">
      <FamilyAchievementSummary
        categories={categories}
        selectedCategoryId={selectedCategoryId}
      />
      <FamilyAchievementGrid
        categories={categories}
        onBadgeClick={setSelectedAchievement}
        onActiveCategoryChange={setSelectedCategoryId}
      />
      <FamilyAchievementDetailModal
        achievement={selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
}
