import { renderHook, act } from "@testing-library/react";
import { useQuestFilters } from "./useQuestFilters";
import { mockQuests } from "./useQuestFilters.fixtures";

describe("useQuestFilters - assignee and search filters", () => {
  it("should filter quests by assignee ID", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({ assigneeId: "user-2" });
    });

    expect(result.current.filteredQuests.every(q => q.assigned_to_id === "user-2")).toBe(true);
  });

  it("should handle assignee filter with no matches", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({ assigneeId: "non-existent" });
    });

    expect(result.current.filteredQuests).toEqual([]);
  });

  it("should return all quests when assignee filter is ALL", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({ assigneeId: "ALL" });
    });

    expect(result.current.filteredQuests).toHaveLength(4);
  });

  it("should filter quests by search term in title", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({ searchTerm: "clean" });
    });

    expect(result.current.filteredQuests).toHaveLength(1);
    expect(result.current.filteredQuests[0].title).toContain("Clean");
  });

  it("should filter quests by search term in description", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({ searchTerm: "trash" });
    });

    expect(result.current.filteredQuests).toHaveLength(1);
    expect(result.current.filteredQuests[0].description).toContain("trash");
  });

  it("should handle search term with no matches", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({ searchTerm: "non-existent" });
    });

    expect(result.current.filteredQuests).toEqual([]);
  });

  it("should handle combined filters", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({
        status: "PENDING",
        assigneeId: "user-2",
        searchTerm: "clean",
      });
    });

    expect(result.current.filteredQuests).toHaveLength(1);
    expect(result.current.filteredQuests[0].id).toBe("quest-1");
  });
});
