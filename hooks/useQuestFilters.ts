"use client";

import { useState, useMemo, useCallback } from "react";
import type { QuestInstance, QuestStatus } from "@/lib/types/database";

export interface QuestFilters {
  status: QuestStatus | "ALL";
  assigneeId: string | "ALL";
  searchTerm: string;
}

interface UseQuestFiltersReturn {
  filters: QuestFilters;
  setFilters: (filters: Partial<QuestFilters>) => void;
  filteredQuests: QuestInstance[];
  resetFilters: () => void;
}

const DEFAULT_FILTERS: QuestFilters = {
  status: "ALL",
  assigneeId: "ALL",
  searchTerm: "",
};

/**
 * Custom hook for filtering and searching quest instances.
 *
 * This hook provides a flexible filtering system for quest lists, allowing users
 * to filter by status, assignee, and search term. It uses memoization to optimize
 * performance and only recomputes filtered results when quests or filters change.
 *
 * @param quests - Array of quest instances to filter
 * @returns {UseQuestFiltersReturn} Object containing:
 *   - filters: Current filter state (status, assigneeId, searchTerm)
 *   - setFilters: Function to update filters (accepts partial updates)
 *   - filteredQuests: Memoized array of quests matching current filters
 *   - resetFilters: Function to reset all filters to default values
 *
 * @example
 * const { filters, setFilters, filteredQuests, resetFilters } = useQuestFilters(allQuests);
 *
 * // Filter by status
 * setFilters({ status: "PENDING" });
 *
 * // Filter by assignee
 * setFilters({ assigneeId: "user-123" });
 *
 * // Search by title or description
 * setFilters({ searchTerm: "clean" });
 *
 * // Reset all filters
 * resetFilters();
 */
export function useQuestFilters(quests: QuestInstance[]): UseQuestFiltersReturn {
  const [filters, setFiltersState] = useState<QuestFilters>(DEFAULT_FILTERS);

  const setFilters = useCallback((newFilters: Partial<QuestFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const filteredQuests = useMemo(() => {
    let result = quests;

    // Filter by status
    if (filters.status !== "ALL") {
      result = result.filter((quest) => quest.status === filters.status);
    }

    // Filter by assignee
    if (filters.assigneeId !== "ALL") {
      result = result.filter((quest) => quest.assigned_to_id === filters.assigneeId);
    }

    // Filter by search term (searches in title and description)
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      result = result.filter((quest) => {
        const titleMatch = quest.title?.toLowerCase().includes(searchLower);
        const descMatch = quest.description?.toLowerCase().includes(searchLower);
        return titleMatch || descMatch;
      });
    }

    return result;
  }, [quests, filters]);

  return {
    filters,
    setFilters,
    filteredQuests,
    resetFilters,
  };
}
