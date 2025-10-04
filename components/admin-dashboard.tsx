'use client';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import StatisticsPanel from '@/components/statistics-panel';
import ActivityFeed from '@/components/activity-feed';
import GuildMasterManager from '@/components/guild-master-manager';
import FamilySettings from '@/components/family-settings';
import { QuestTemplateManager } from '@/components/quest-template-manager';
import RewardManager from '@/components/reward-manager';

type TabName = 'overview' | 'quest-templates' | 'rewards' | 'guild-masters' | 'family-settings';

export function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Tab configuration
  const tabs: { name: TabName; label: string; icon: string }[] = [
    { name: 'overview', label: 'Overview', icon: '📊' },
    { name: 'quest-templates', label: 'Quest Templates', icon: '📜' },
    { name: 'rewards', label: 'Rewards', icon: '🏆' },
    { name: 'guild-masters', label: 'Guild Masters', icon: '👑' },
    { name: 'family-settings', label: 'Family Settings', icon: '⚙️' },
  ];

  // Sync selected tab with URL query params
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabName | null;
    if (tabParam) {
      const tabIndex = tabs.findIndex((tab) => tab.name === tabParam);
      if (tabIndex !== -1) {
        setSelectedIndex(tabIndex);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (index: number) => {
    setSelectedIndex(index);
    const tabName = tabs[index].name;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabName);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full" data-testid="admin-dashboard">
      <TabGroup selectedIndex={selectedIndex} onChange={handleTabChange}>
        {/* Tab Navigation */}
        <TabList className="flex space-x-1 bg-dark-800 p-1 rounded-lg mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              data-testid={`tab-${tab.name}`}
              className={({ selected }) =>
                `flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
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
