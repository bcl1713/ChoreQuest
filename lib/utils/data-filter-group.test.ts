import { QuestInstance } from "@/lib/types/database";
import { filterByAll, filterByAny, groupBy } from "./data";

describe("filterByAll", () => {
  it("should keep items that satisfy all predicates", () => {
    const items = [1, 2, 3, 4, 5];
    const predicates = [
      (n: number) => n > 2,
      (n: number) => n % 2 === 1,
    ];
    const result = filterByAll(items, predicates);
    expect(result).toEqual([3, 5]);
  });

  it("should return empty array when predicates reject all", () => {
    const items = [1, 2, 3];
    const predicates = [
      (n: number) => n > 5,
      (n: number) => n % 2 === 0,
    ];
    const result = filterByAll(items, predicates);
    expect(result).toEqual([]);
  });

  it("should handle empty predicates array", () => {
    const items = [1, 2, 3];
    const result = filterByAll(items, []);
    expect(result).toEqual(items);
  });
});

describe("filterByAny", () => {
  it("should keep items that satisfy at least one predicate", () => {
    const items = [1, 2, 3, 4, 5];
    const predicates = [
      (n: number) => n > 4,
      (n: number) => n % 2 === 0,
    ];
    const result = filterByAny(items, predicates);
    expect(result).toEqual([2, 4, 5]);
  });

  it("should return empty array when no predicates match", () => {
    const items = [1, 3, 5];
    const predicates = [
      (n: number) => n > 10,
      (n: number) => n % 2 === 0,
    ];
    const result = filterByAny(items, predicates);
    expect(result).toEqual([]);
  });

  it("should handle empty predicates array", () => {
    const items = [1, 2, 3];
    const result = filterByAny(items, []);
    expect(result).toEqual(items);
  });
});

describe("groupBy", () => {
  it("should group items by key extractor", () => {
    const quests = [
      { id: "1", status: "PENDING" },
      { id: "2", status: "COMPLETED" },
      { id: "3", status: "PENDING" },
    ] as QuestInstance[];
    const grouped = groupBy(quests, (q) => q.status);
    expect(grouped.PENDING).toHaveLength(2);
    expect(grouped.COMPLETED).toHaveLength(1);
  });

  it("should handle empty arrays", () => {
    const grouped = groupBy([], (item) => item);
    expect(grouped).toEqual({});
  });

  it("should handle multiple groups", () => {
    const quests = [
      { id: "1", status: "PENDING" },
      { id: "2", status: "COMPLETED" },
      { id: "3", status: "IN_PROGRESS" },
      { id: "4", status: "PENDING" },
    ] as QuestInstance[];
    const grouped = groupBy(quests, (q) => q.status);
    expect(grouped.PENDING).toHaveLength(2);
    expect(grouped.COMPLETED).toHaveLength(1);
    expect(grouped.IN_PROGRESS).toHaveLength(1);
  });
});
