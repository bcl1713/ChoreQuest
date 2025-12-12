import { renderHook, act } from "@testing-library/react";
import { useQuestFilters } from "./useQuestFilters";
import { mockQuests } from "./useQuestFilters.fixtures";

describe("useQuestFilters - state management", () => {
  it("should update filters with setFilters", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({ status: "COMPLETED", assigneeId: "user-3", searchTerm: "homework" });
    });

    expect(result.current.filters).toEqual({
      status: "COMPLETED",
      assigneeId: "user-3",
      searchTerm: "homework",
    });
    expect(result.current.filteredQuests).toHaveLength(1);
    expect(result.current.filteredQuests[0].id).toBe("quest-3");
  });

  it("should merge new filters with existing ones", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({ status: "PENDING" });
    });

    act(() => {
      result.current.setFilters({ searchTerm: "mow" });
    });

    expect(result.current.filters).toEqual({
      status: "PENDING",
      assigneeId: "ALL",
      searchTerm: "mow",
    });
  });

  it("should reset filters to defaults", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    act(() => {
      result.current.setFilters({ status: "PENDING", assigneeId: "user-2", searchTerm: "clean" });
    });

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

  it("should update filtered quests when quests change", () => {
    const { result, rerender } = renderHook(({ quests }) => useQuestFilters(quests), {
      initialProps: { quests: mockQuests },
    });

    const updatedQuests = [
      ...mockQuests,
      {
        ...mockQuests[0],
        id: "quest-5",
        status: "PENDING",
        title: "New pending quest",
      },
    ];

    act(() => {
      result.current.setFilters({ status: "PENDING" });
    });

    rerender({ quests: updatedQuests });

    expect(result.current.filteredQuests).toHaveLength(3);
  });

  it("should memoize filtered quests", () => {
    const { result } = renderHook(() => useQuestFilters(mockQuests));

    const firstResult = result.current.filteredQuests;

    act(() => {
      result.current.setFilters({ status: "PENDING" });
    });

    const secondResult = result.current.filteredQuests;

    act(() => {
      result.current.setFilters({ status: "PENDING" });
    });

    const thirdResult = result.current.filteredQuests;

    expect(firstResult).not.toBe(secondResult);
    expect(secondResult).toBe(thirdResult);
  });
});
