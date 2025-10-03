'use client';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    <div className="w-full">
      <TabGroup selectedIndex={selectedIndex} onChange={handleTabChange}>
        {/* Tab Navigation */}
        <TabList className="flex space-x-1 bg-dark-800 p-1 rounded-lg mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
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
            <div className="fantasy-card p-6">
              <h2 className="text-2xl font-fantasy text-gold-400 mb-4">Family Overview</h2>
              <p className="text-gray-400">Statistics and activity feed coming soon...</p>
            </div>
          </TabPanel>

          {/* Quest Templates Tab */}
          <TabPanel>
            <div className="fantasy-card p-6">
              <h2 className="text-2xl font-fantasy text-gold-400 mb-4">Quest Templates</h2>
              <p className="text-gray-400">Quest template management coming soon...</p>
            </div>
          </TabPanel>

          {/* Rewards Tab */}
          <TabPanel>
            <div className="fantasy-card p-6">
              <h2 className="text-2xl font-fantasy text-gold-400 mb-4">Rewards</h2>
              <p className="text-gray-400">Reward management coming soon...</p>
            </div>
          </TabPanel>

          {/* Guild Masters Tab */}
          <TabPanel>
            <div className="fantasy-card p-6">
              <h2 className="text-2xl font-fantasy text-gold-400 mb-4">Guild Masters</h2>
              <p className="text-gray-400">Role management coming soon...</p>
            </div>
          </TabPanel>

          {/* Family Settings Tab */}
          <TabPanel>
            <div className="fantasy-card p-6">
              <h2 className="text-2xl font-fantasy text-gold-400 mb-4">Family Settings</h2>
              <p className="text-gray-400">Family settings coming soon...</p>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
