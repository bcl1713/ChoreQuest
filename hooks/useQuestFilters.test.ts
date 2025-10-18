import { renderHook, act } from "@testing-library/react";
import { useQuestFilters } from "./useQuestFilters";
import type { QuestInstance } from "@/lib/types/database";

describe("useQuestFilters", () => {
  const mockQuests: QuestInstance[] = [
    {
      id: "quest-1",
      family_id: "family-1",
      title: "Clean the kitchen",
      description: "Wash dishes and wipe counters",
      status: "PENDING",
      difficulty: "EASY",
      category: "DAILY",
      xp_reward: 50,
      gold_reward: 10,
      quest_type: "INDIVIDUAL",
      created_by_id: "user-1",
      assigned_to_id: "user-2",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      due_date: null,
      completed_at: null,
      recurrence_pattern: null,
      parent_template_id: null,
      volunteer_bonus: null,
      streak_bonus: null,
      streak_count: null,
    },
    {
      id: "quest-2",
      family_id: "family-1",
      title: "Take out trash",
      description: "Empty all trash bins",
      status: "IN_PROGRESS",
      difficulty: "EASY",
      category: "DAILY",
      xp_reward: 25,
      gold_reward: 5,
      quest_type: "INDIVIDUAL",
      created_by_id: "user-1",
      assigned_to_id: "user-2",
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
      due_date: null,
      completed_at: null,
      recurrence_pattern: null,
      parent_template_id: null,
      volunteer_bonus: null,
      streak_bonus: null,
      streak_count: null,
    },
    {
      id: "quest-3",
      family_id: "family-1",
      title: "Do homework",
      description: "Complete math and science assignments",
      status: "COMPLETED",
      difficulty: "MEDIUM",
      category: "DAILY",
      xp_reward: 100,
      gold_reward: 20,
      quest_type: "INDIVIDUAL",
      created_by_id: "user-1",
      assigned_to_id: "user-3",
      created_at: "2024-01-03T00:00:00Z",
      updated_at: "2024-01-03T00:00:00Z",
      due_date: null,
      completed_at: "2024-01-03T12:00:00Z",
      recurrence_pattern: null,
      parent_template_id: null,
      volunteer_bonus: null,
      streak_bonus: null,
      streak_count: null,
    },
    {
      id: "quest-4",
      family_id: "family-1",
      title: "Mow the lawn",
      description: "Cut grass in front and back yard",
      status: "PENDING",
      difficulty: "HARD",
      category: "WEEKLY",
      xp_reward: 200,
      gold_reward: 50,
      quest_type: "FAMILY",
      created_by_id: "user-1",
      assigned_to_id: null,
      created_at: "2024-01-04T00:00:00Z",
      updated_at: "2024-01-04T00:00:00Z",
      due_date: null,
      completed_at: null,
      recurrence_pattern: null,
      parent_template_id: null,
      volunteer_bonus: 0.2,
      streak_bonus: null,
      streak_count: null,
    },
  ];

  describe("initial state", () => {
    it("should initialize with default filters", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      expect(result.current.filters).toEqual({
        status: "ALL",
        assigneeId: "ALL",
        searchTerm: "",
      });
    });

    it("should return all quests when no filters are applied", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      expect(result.current.filteredQuests).toHaveLength(4);
      expect(result.current.filteredQuests).toEqual(mockQuests);
    });

    it("should handle empty quest array", () => {
      const { result } = renderHook(() => useQuestFilters([]));

      expect(result.current.filteredQuests).toEqual([]);
    });
  });

  describe("filtering by status", () => {
    it("should filter quests by PENDING status", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ status: "PENDING" });
      });

      expect(result.current.filteredQuests).toHaveLength(2);
      expect(result.current.filteredQuests.every(q => q.status === "PENDING")).toBe(true);
    });

    it("should filter quests by IN_PROGRESS status", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ status: "IN_PROGRESS" });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].id).toBe("quest-2");
    });

    it("should filter quests by COMPLETED status", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ status: "COMPLETED" });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].id).toBe("quest-3");
    });

    it("should return all quests when status is ALL", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ status: "PENDING" });
      });

      expect(result.current.filteredQuests).toHaveLength(2);

      act(() => {
        result.current.setFilters({ status: "ALL" });
      });

      expect(result.current.filteredQuests).toHaveLength(4);
    });

    it("should return empty array when no quests match status", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ status: "APPROVED" });
      });

      expect(result.current.filteredQuests).toEqual([]);
    });
  });

  describe("filtering by assignee", () => {
    it("should filter quests by assignee ID", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ assigneeId: "user-2" });
      });

      expect(result.current.filteredQuests).toHaveLength(2);
      expect(result.current.filteredQuests.every(q => q.assigned_to_id === "user-2")).toBe(true);
    });

    it("should filter quests by different assignee", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ assigneeId: "user-3" });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].id).toBe("quest-3");
    });

    it("should return all quests when assigneeId is ALL", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ assigneeId: "user-2" });
      });

      expect(result.current.filteredQuests).toHaveLength(2);

      act(() => {
        result.current.setFilters({ assigneeId: "ALL" });
      });

      expect(result.current.filteredQuests).toHaveLength(4);
    });

    it("should return empty array when no quests match assignee", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ assigneeId: "user-999" });
      });

      expect(result.current.filteredQuests).toEqual([]);
    });
  });

  describe("filtering by search term", () => {
    it("should filter quests by title", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ searchTerm: "kitchen" });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].id).toBe("quest-1");
    });

    it("should filter quests by description", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ searchTerm: "grass" });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].id).toBe("quest-4");
    });

    it("should be case-insensitive", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ searchTerm: "KITCHEN" });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].id).toBe("quest-1");
    });

    it("should match partial words", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ searchTerm: "home" });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].title).toContain("homework");
    });

    it("should trim whitespace", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ searchTerm: "  kitchen  " });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].id).toBe("quest-1");
    });

    it("should return all quests when search term is empty", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ searchTerm: "kitchen" });
      });

      expect(result.current.filteredQuests).toHaveLength(1);

      act(() => {
        result.current.setFilters({ searchTerm: "" });
      });

      expect(result.current.filteredQuests).toHaveLength(4);
    });

    it("should return all quests when search term is only whitespace", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ searchTerm: "   " });
      });

      expect(result.current.filteredQuests).toHaveLength(4);
    });

    it("should return empty array when no quests match search", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ searchTerm: "nonexistent" });
      });

      expect(result.current.filteredQuests).toEqual([]);
    });
  });

  describe("combined filters", () => {
    it("should apply status and assignee filters together", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({
          status: "PENDING",
          assigneeId: "user-2",
        });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].id).toBe("quest-1");
    });

    it("should apply status and search filters together", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({
          status: "PENDING",
          searchTerm: "kitchen",
        });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].id).toBe("quest-1");
    });

    it("should apply assignee and search filters together", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({
          assigneeId: "user-2",
          searchTerm: "trash",
        });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].id).toBe("quest-2");
    });

    it("should apply all three filters together", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({
          status: "PENDING",
          assigneeId: "user-2",
          searchTerm: "kitchen",
        });
      });

      expect(result.current.filteredQuests).toHaveLength(1);
      expect(result.current.filteredQuests[0].id).toBe("quest-1");
    });

    it("should return empty when combined filters match nothing", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({
          status: "COMPLETED",
          assigneeId: "user-2", // user-2 has no completed quests
        });
      });

      expect(result.current.filteredQuests).toEqual([]);
    });
  });

  describe("setFilters", () => {
    it("should support partial updates", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({ status: "PENDING" });
      });

      expect(result.current.filters.status).toBe("PENDING");
      expect(result.current.filters.assigneeId).toBe("ALL");
      expect(result.current.filters.searchTerm).toBe("");

      act(() => {
        result.current.setFilters({ assigneeId: "user-2" });
      });

      expect(result.current.filters.status).toBe("PENDING");
      expect(result.current.filters.assigneeId).toBe("user-2");
      expect(result.current.filters.searchTerm).toBe("");
    });

    it("should update multiple filters at once", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({
          status: "IN_PROGRESS",
          assigneeId: "user-2",
          searchTerm: "trash",
        });
      });

      expect(result.current.filters).toEqual({
        status: "IN_PROGRESS",
        assigneeId: "user-2",
        searchTerm: "trash",
      });
    });

    it("should maintain referential stability", () => {
      const { result, rerender } = renderHook(() => useQuestFilters(mockQuests));

      const firstSetFilters = result.current.setFilters;

      rerender();

      expect(result.current.setFilters).toBe(firstSetFilters);
    });
  });

  describe("resetFilters", () => {
    it("should reset all filters to defaults", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      act(() => {
        result.current.setFilters({
          status: "COMPLETED",
          assigneeId: "user-3",
          searchTerm: "homework",
        });
      });

      expect(result.current.filteredQuests).toHaveLength(1);

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters).toEqual({
        status: "ALL",
        assigneeId: "ALL",
        searchTerm: "",
      });
      expect(result.current.filteredQuests).toHaveLength(4);
    });

    it("should maintain referential stability", () => {
      const { result, rerender } = renderHook(() => useQuestFilters(mockQuests));

      const firstResetFilters = result.current.resetFilters;

      rerender();

      expect(result.current.resetFilters).toBe(firstResetFilters);
    });
  });

  describe("quest updates", () => {
    it("should update filtered results when quest array changes", () => {
      const { result, rerender } = renderHook(
        ({ quests }) => useQuestFilters(quests),
        { initialProps: { quests: mockQuests } }
      );

      act(() => {
        result.current.setFilters({ status: "PENDING" });
      });

      expect(result.current.filteredQuests).toHaveLength(2);

      // Add a new pending quest
      const newQuests = [
        ...mockQuests,
        {
          ...mockQuests[0],
          id: "quest-5",
          title: "New quest",
          status: "PENDING" as const,
        },
      ];

      rerender({ quests: newQuests });

      expect(result.current.filteredQuests).toHaveLength(3);
    });

    it("should handle quest removal", () => {
      const { result, rerender } = renderHook(
        ({ quests }) => useQuestFilters(quests),
        { initialProps: { quests: mockQuests } }
      );

      expect(result.current.filteredQuests).toHaveLength(4);

      // Remove a quest
      const fewerQuests = mockQuests.slice(0, 3);

      rerender({ quests: fewerQuests });

      expect(result.current.filteredQuests).toHaveLength(3);
    });
  });

  describe("memoization", () => {
    it("should not recompute filtered quests if filters and quests are unchanged", () => {
      const { result, rerender } = renderHook(() => useQuestFilters(mockQuests));

      const firstFiltered = result.current.filteredQuests;

      rerender();

      // Should be same reference if nothing changed
      expect(result.current.filteredQuests).toBe(firstFiltered);
    });

    it("should recompute filtered quests when filters change", () => {
      const { result } = renderHook(() => useQuestFilters(mockQuests));

      const firstFiltered = result.current.filteredQuests;

      act(() => {
        result.current.setFilters({ status: "PENDING" });
      });

      // Should be different reference after filter change
      expect(result.current.filteredQuests).not.toBe(firstFiltered);
    });
  });
});
