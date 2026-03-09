import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  testId?: string;
}

export interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
}

export function TabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabBarProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-wrap border-b border-gold-700/30 bg-dark-800/50",
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        const mobileLabel = tab.shortLabel ?? tab.label.split(" ")[0];

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            {...(tab.testId ? { "data-testid": tab.testId } : {})}
            className={cn(
              "flex-1 min-w-0 flex items-center justify-center",
              "gap-2 px-4 py-4 text-sm sm:text-base",
              "font-medium transition-colors",
              "border-b-2 -mb-[2px]",
              isActive
                ? "text-gold-400 border-gold-500 bg-dark-700/50"
                : "text-gray-400 border-transparent hover:text-gold-300",
            )}
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden text-xs">{mobileLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
