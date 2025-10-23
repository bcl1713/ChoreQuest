import React, { memo } from 'react';
import type { QuestStatus } from '@/lib/types/database';
import { Button } from '@/components/ui';

export interface QuestFiltersProps {
  filters: {
    status: QuestStatus | 'ALL';
    assigneeId: string | 'ALL';
    searchTerm: string;
  };
  assignees?: Array<{ id: string; name: string }>;
  onFilterChange: (filters: Partial<QuestFiltersProps['filters']>) => void;
  onReset?: () => void;
}

const QuestFilters: React.FC<QuestFiltersProps> = memo(({
  filters,
  assignees,
  onFilterChange,
  onReset,
}) => {
  const hasActiveFilters =
    filters.status !== 'ALL' ||
    filters.assigneeId !== 'ALL' ||
    filters.searchTerm.trim() !== '';

  const statusOptions: Array<{ value: QuestStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'CLAIMED', label: 'Claimed' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'MISSED', label: 'Missed' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search input */}
      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search quests..."
          value={filters.searchTerm}
          onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
          className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-gold-500"
          aria-label="Search"
        />
      </div>

      {/* Status filter */}
      <div className="flex-shrink-0 sm:w-48">
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value as QuestStatus | 'ALL' })}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-gold-500"
          aria-label="Status"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Assignee filter (only shown if assignees are provided) */}
      {assignees && assignees.length > 0 && (
        <div className="flex-shrink-0 sm:w-48">
          <select
            value={filters.assigneeId}
            onChange={(e) => onFilterChange({ assigneeId: e.target.value })}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-gold-500"
            aria-label="Assignee"
          >
            <option value="ALL">All Assignees</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Reset button */}
      {onReset && (
        <Button
          type="button"
          onClick={onReset}
          disabled={!hasActiveFilters}
          variant="outline"
          size="sm"
          className="px-4 py-2 rounded-md border border-gray-700 text-sm text-gray-300 hover:bg-gray-800"
          aria-label="Reset filters"
        >
          Reset
        </Button>
      )}
    </div>
  );
});

QuestFilters.displayName = 'QuestFilters';

export default QuestFilters;
