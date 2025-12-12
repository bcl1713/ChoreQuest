import { renderHook, act } from "@testing-library/react";
import { useQuestFilters } from "./useQuestFilters";
import { mockQuests } from "./useQuestFilters.fixtures";

describe("useQuestFilters - initial and status filters", () => {
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
    expect(result.current.filteredQuests[0].status).toBe("IN_PROGRESS");
  });

  it("should filter quests by COMPLETED status", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({ status: "COMPLETED" });
    });

    expect(result.current.filteredQuests).toHaveLength(1);
    expect(result.current.filteredQuests[0].status).toBe("COMPLETED");
  });

  it("should return all quests when status filter is ALL", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({ status: "ALL" });
    });

    expect(result.current.filteredQuests).toHaveLength(4);
  });
});
