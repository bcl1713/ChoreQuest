"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface Tab {
  name: string;
  label: string;
  icon?: string;
}

interface UseTabNavigationReturn {
  selectedIndex: number;
  handleTabChange: (index: number) => void;
  tabs: Tab[];
}

/**
 * Custom hook for managing tab navigation state with URL query parameter synchronization.
 *
 * This hook consolidates tab navigation logic, managing the selected tab index and
 * automatically syncing it with URL query parameters. When a tab is selected, the URL
 * is updated (without page reload). When the URL changes (e.g., via back button), the
 * selected tab updates accordingly.
 *
 * @param tabs - Array of tab configuration objects with name, label, and optional icon
 * @param queryParamName - Name of the URL query parameter to use (defaults to "tab")
 * @returns {UseTabNavigationReturn} Object containing:
 *   - selectedIndex: Currently selected tab index (0-based)
 *   - handleTabChange: Function to change the selected tab (updates state and URL)
 *   - tabs: The provided tab configuration array
 *
 * @example
 * const tabs = [
 *   { name: "overview", label: "Overview", icon: "📊" },
 *   { name: "settings", label: "Settings", icon: "⚙️" },
 * ];
 *
 * const { selectedIndex, handleTabChange, tabs: tabConfig } = useTabNavigation(tabs);
 *
 * // Use with HeadlessUI TabGroup
 * <TabGroup selectedIndex={selectedIndex} onChange={handleTabChange}>
 *   <TabList>
 *     {tabConfig.map(tab => <Tab key={tab.name}>{tab.label}</Tab>)}
 *   </TabList>
 * </TabGroup>
 */
export function useTabNavigation(
  tabs: Tab[],
  queryParamName: string = "tab"
): UseTabNavigationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Memoize tabs to prevent unnecessary re-renders
  const memoizedTabs = useMemo(() => tabs, [tabs]);

  // Sync selected tab with URL query params on mount and when URL changes
  useEffect(() => {
    const tabParam = searchParams.get(queryParamName);
    if (tabParam) {
      const tabIndex = memoizedTabs.findIndex((tab) => tab.name === tabParam);
      if (tabIndex !== -1) {
        setSelectedIndex(tabIndex);
      }
    }
  }, [searchParams, memoizedTabs, queryParamName]);

  // Update URL when tab changes
  const handleTabChange = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      const tabName = memoizedTabs[index]?.name;

      if (tabName) {
        const params = new URLSearchParams(searchParams.toString());
        params.set(queryParamName, tabName);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [memoizedTabs, searchParams, queryParamName, router, pathname]
  );

  return {
    selectedIndex,
    handleTabChange,
    tabs: memoizedTabs,
  };
}
