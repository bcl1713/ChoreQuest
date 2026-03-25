"use client";

import { useState, useMemo, useEffect } from "react";
import { LayoutGrid } from "lucide-react";
import { TabBar, type TabItem } from "@/components/ui/tab-bar";
import { FamilyAchievementBadge } from "./FamilyAchievementBadge";
import { getAchievementIcon } from "./achievement-icon-map";
import type {
  FamilyAchievementCategory,
  FamilyAchievementDisplay,
} from "@/hooks/useFamilyAchievements";

const ALL_TAB_ID = "__all__";

function computeCategoryCounts(achievements: FamilyAchievementDisplay[]) {
  let unlocked = 0;
  let total = 0;
  for (const a of achievements) {
    total++;
    if (a.unlocked_at) unlocked++;
  }
  return { unlocked, total };
}

interface FamilyAchievementGridProps {
  categories: FamilyAchievementCategory[];
  onBadgeClick?: (achievement: FamilyAchievementDisplay) => void;
  onActiveCategoryChange?: (categoryId: string | null) => void;
}

export function FamilyAchievementGrid({
  categories,
  onBadgeClick,
  onActiveCategoryChange,
}: FamilyAchievementGridProps) {
  const [activeTab, setActiveTab] = useState(ALL_TAB_ID);

  useEffect(() => {
    if (
      activeTab !== ALL_TAB_ID &&
      !categories.find((c) => c.id === activeTab)
    ) {
      setActiveTab(ALL_TAB_ID);
      onActiveCategoryChange?.(null);
    }
  }, [categories, activeTab, onActiveCategoryChange]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onActiveCategoryChange?.(tabId === ALL_TAB_ID ? null : tabId);
  };

  const allCounts = useMemo(
    () => computeCategoryCounts(categories.flatMap((c) => c.achievements)),
    [categories],
  );

  const tabs: TabItem<string>[] = useMemo(() => {
    const categoryTabs = categories.map((cat) => {
      const counts = computeCategoryCounts(cat.achievements);
      return {
        id: cat.id,
        label: `${cat.name} (${counts.unlocked}/${counts.total})`,
        shortLabel: `${cat.name} (${counts.unlocked}/${counts.total})`,
        icon: getAchievementIcon(cat.icon),
        complete: counts.total > 0 && counts.unlocked === counts.total,
        testId: `family-achievement-tab-${cat.id}`,
      };
    });

    return [
      {
        id: ALL_TAB_ID,
        label: `All (${allCounts.unlocked}/${allCounts.total})`,
        shortLabel: `All (${allCounts.unlocked}/${allCounts.total})`,
        icon: LayoutGrid,
        testId: "family-achievement-tab-all",
      },
      ...categoryTabs,
    ];
  }, [categories, allCounts]);

  const filteredAchievements = useMemo(() => {
    if (activeTab === ALL_TAB_ID) {
      return categories.flatMap((c) => c.achievements);
    }
    const category = categories.find((c) => c.id === activeTab);
    return category?.achievements ?? [];
  }, [categories, activeTab]);

  return (
    <div data-testid="family-achievement-grid">
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="mb-4 rounded-t-lg"
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredAchievements.map((achievement) => (
          <FamilyAchievementBadge
            key={achievement.id}
            achievement={achievement}
            onClick={onBadgeClick}
          />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <p
          className="text-center text-gray-500 py-8"
          data-testid="family-achievement-grid-empty"
        >
          No family achievements in this category.
        </p>
      )}
    </div>
  );
}
