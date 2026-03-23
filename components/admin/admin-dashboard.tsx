"use client";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useMemo } from "react";
import {
  BarChart3,
  Swords,
  ScrollText,
  Trophy,
  Crown,
  Settings,
  FolderOpen,
  Medal,
} from "lucide-react";
import StatisticsPanel from "./statistics-panel";
import ActivityFeed from "./activity-feed";
import GuildMasterManager from "./guild-master-manager";
import FamilySettings from "@/components/family/family-settings";
import { QuestTemplateManager } from "@/components/quests/quest-template-manager";
import RewardManager from "@/components/rewards/reward-manager";
import { QuestManagementTab } from "./quest-management-tab";
import AchievementCategoryAdmin from "./achievement-category-admin";
import AchievementAdmin from "./achievement-admin";
import { useTabNavigation } from "@/hooks/useTabNavigation";

type TabName =
  | "overview"
  | "quests"
  | "quest-templates"
  | "rewards"
  | "achievement-categories"
  | "achievements"
  | "guild-masters"
  | "family-settings";

const TAB_ICONS = {
  BarChart3,
  Swords,
  ScrollText,
  Trophy,
  Crown,
  Settings,
  FolderOpen,
  Medal,
};

export function AdminDashboard() {
  // Tab configuration
  const tabs: { name: TabName; label: string; icon: keyof typeof TAB_ICONS }[] =
    useMemo(
      () => [
        { name: "overview", label: "Overview", icon: "BarChart3" },
        { name: "quests", label: "Quest Management", icon: "Swords" },
        {
          name: "quest-templates",
          label: "Quest Templates",
          icon: "ScrollText",
        },
        { name: "rewards", label: "Rewards", icon: "Trophy" },
        {
          name: "achievement-categories",
          label: "Achievement Categories",
          icon: "FolderOpen",
        },
        { name: "achievements", label: "Achievements", icon: "Medal" },
        { name: "guild-masters", label: "Guild Masters", icon: "Crown" },
        { name: "family-settings", label: "Family Settings", icon: "Settings" },
      ],
      [],
    );

  // Use custom hook for tab navigation with URL sync
  const { selectedIndex, handleTabChange } = useTabNavigation(tabs, "tab");

  return (
    <div className="w-full" data-testid="admin-dashboard">
      <TabGroup selectedIndex={selectedIndex} onChange={handleTabChange}>
        {/* Tab Navigation */}
        <TabList className="flex space-x-1 bg-dark-800 p-1 rounded-lg mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-dark-600">
          {tabs.map((tab) => {
            const IconComponent = TAB_ICONS[tab.icon];
            return (
              <Tab
                key={tab.name}
                data-testid={`tab-${tab.name}`}
                className={({ selected }) =>
                  `flex-shrink-0 py-3 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap flex items-center gap-2 ${
                    selected
                      ? "bg-gold-600 text-white"
                      : "text-gray-400 hover:text-gray-200 hover:bg-dark-700"
                  }`
                }
              >
                <IconComponent size={20} className="flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Tab>
            );
          })}
        </TabList>

        {/* Tab Content Panels */}
        <TabPanels>
          {/* Overview Tab */}
          <TabPanel unmount={false}>
            <div className="space-y-6">
              <StatisticsPanel />
              <ActivityFeed />
            </div>
          </TabPanel>

          {/* Quest Management Tab */}
          <TabPanel unmount={false}>
            <QuestManagementTab />
          </TabPanel>

          {/* Quest Templates Tab */}
          <TabPanel unmount={false}>
            <QuestTemplateManager />
          </TabPanel>

          {/* Rewards Tab */}
          <TabPanel unmount={false}>
            <RewardManager />
          </TabPanel>

          {/* Achievement Categories Tab */}
          <TabPanel unmount={false}>
            <AchievementCategoryAdmin />
          </TabPanel>

          {/* Achievements Tab */}
          <TabPanel unmount={false}>
            <AchievementAdmin />
          </TabPanel>

          {/* Guild Masters Tab */}
          <TabPanel unmount={false}>
            <GuildMasterManager />
          </TabPanel>

          {/* Family Settings Tab */}
          <TabPanel unmount={false}>
            <FamilySettings />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
