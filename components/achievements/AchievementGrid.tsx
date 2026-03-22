"use client";

import { useState, useMemo } from "react";
import { LayoutGrid } from "lucide-react";
import { TabBar, type TabItem } from "@/components/ui/tab-bar";
import { AchievementBadge } from "./AchievementBadge";
import { getAchievementIcon } from "./achievement-icon-map";
import type {
  AchievementCategory,
  AchievementDisplay,
} from "@/hooks/useAchievements";

const ALL_TAB_ID = "__all__";

interface AchievementGridProps {
  categories: AchievementCategory[];
  onBadgeClick?: (achievement: AchievementDisplay) => void;
}

export function AchievementGrid({
  categories,
  onBadgeClick,
}: AchievementGridProps) {
  const [activeTab, setActiveTab] = useState(ALL_TAB_ID);

  const tabs: TabItem<string>[] = useMemo(() => {
    const categoryTabs = categories.map((cat) => ({
      id: cat.id,
      label: `${cat.name} (${cat.achievements.length})`,
      shortLabel: cat.name,
      icon: getAchievementIcon(cat.icon),
      testId: `achievement-tab-${cat.id}`,
    }));

    return [
      {
        id: ALL_TAB_ID,
        label: `All (${categories.reduce((sum, c) => sum + c.achievements.length, 0)})`,
        shortLabel: "All",
        icon: LayoutGrid,
        testId: "achievement-tab-all",
      },
      ...categoryTabs,
    ];
  }, [categories]);

  const filteredAchievements = useMemo(() => {
    if (activeTab === ALL_TAB_ID) {
      return categories.flatMap((c) => c.achievements);
    }
    const category = categories.find((c) => c.id === activeTab);
    return category?.achievements ?? [];
  }, [categories, activeTab]);

  return (
    <div data-testid="achievement-grid">
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-4 rounded-t-lg"
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredAchievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            onClick={onBadgeClick}
          />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No achievements in this category.
        </p>
      )}
    </div>
  );
}
