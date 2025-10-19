'use client';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { useMemo } from 'react';
import StatisticsPanel from '@/components/statistics-panel';
import ActivityFeed from '@/components/activity-feed';
import GuildMasterManager from '@/components/guild-master-manager';
import FamilySettings from '@/components/family-settings';
import { QuestTemplateManager } from '@/components/quest-template-manager';
import RewardManager from '@/components/rewards/reward-manager';
import { useTabNavigation } from '@/hooks/useTabNavigation';

type TabName = 'overview' | 'quest-templates' | 'rewards' | 'guild-masters' | 'family-settings';

export function AdminDashboard() {
  // Tab configuration
  const tabs: { name: TabName; label: string; icon: string }[] = useMemo(() => [
    { name: 'overview', label: 'Overview', icon: '📊' },
    { name: 'quest-templates', label: 'Quest Templates', icon: '📜' },
    { name: 'rewards', label: 'Rewards', icon: '🏆' },
    { name: 'guild-masters', label: 'Guild Masters', icon: '👑' },
    { name: 'family-settings', label: 'Family Settings', icon: '⚙️' },
  ], []);

  // Use custom hook for tab navigation with URL sync
  const { selectedIndex, handleTabChange } = useTabNavigation(tabs, 'tab');

  return (
    <div className="w-full" data-testid="admin-dashboard">
      <TabGroup selectedIndex={selectedIndex} onChange={handleTabChange}>
        {/* Tab Navigation */}
        <TabList className="flex space-x-1 bg-dark-800 p-1 rounded-lg mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-dark-600">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              data-testid={`tab-${tab.name}`}
              className={({ selected }) =>
                `flex-shrink-0 py-3 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
                  selected
                    ? 'bg-gold-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700'
                }`
              }
            >
              <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
              <span className="sm:hidden">{tab.icon}</span>
            </Tab>
          ))}
        </TabList>

        {/* Tab Content Panels */}
        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <div className="space-y-6">
              <StatisticsPanel />
              <ActivityFeed />
            </div>
          </TabPanel>

          {/* Quest Templates Tab */}
          <TabPanel>
            <QuestTemplateManager />
          </TabPanel>

          {/* Rewards Tab */}
          <TabPanel>
            <RewardManager />
          </TabPanel>

          {/* Guild Masters Tab */}
          <TabPanel>
            <GuildMasterManager />
          </TabPanel>

          {/* Family Settings Tab */}
          <TabPanel>
            <FamilySettings />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
