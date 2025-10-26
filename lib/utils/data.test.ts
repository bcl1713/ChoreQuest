import { QuestInstance } from "@/lib/types/database";
import {
  deduplicate,
  deduplicateQuests,
  getQuestTimestamp,
  sortBy,
  sortByKey,
  filterByAll,
  filterByAny,
  groupBy,
} from "./data";

describe("deduplicate", () => {
  it("should remove duplicate primitive values", () => {
    const numbers = [1, 2, 2, 3, 1, 4];
    expect(deduplicate(numbers)).toEqual([1, 2, 3, 4]);
  });

  it("should remove duplicate strings", () => {
    const strings = ["a", "b", "a", "c", "b"];
    expect(deduplicate(strings)).toEqual(["a", "b", "c"]);
  });

  it("should preserve first occurrence order", () => {
    const items = [3, 1, 2, 1, 3];
    expect(deduplicate(items)).toEqual([3, 1, 2]);
  });

  it("should deduplicate objects by key extractor", () => {
    const users = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "1", name: "Alice Duplicate" },
      { id: "3", name: "Charlie" },
    ];
    const result = deduplicate(users, (user) => user.id);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("Alice"); // First occurrence preserved
    expect(result.map((u) => u.id)).toEqual(["1", "2", "3"]);
  });

  it("should handle empty arrays", () => {
    expect(deduplicate([])).toEqual([]);
  });

  it("should handle arrays with no duplicates", () => {
    const items = [1, 2, 3, 4];
    expect(deduplicate(items)).toEqual([1, 2, 3, 4]);
  });

  it("should handle arrays with all duplicates", () => {
    const items = [1, 1, 1, 1];
    expect(deduplicate(items)).toEqual([1]);
  });

  it("should use default key extractor for primitives", () => {
    const mixed = [1, "1", 2, "2", 1, "1"];
    // String conversion makes String(1) === "1", so they're treated as duplicates
    expect(deduplicate(mixed)).toEqual([1, 2]);
  });
});

describe("deduplicateQuests", () => {
  const createQuest = (id: string, title: string): Partial<QuestInstance> => ({
    id,
    title,
    created_at: "2025-01-01T00:00:00Z",
  });

  it("should remove duplicate quests by ID", () => {
    const quests = [
      createQuest("quest-1", "Clean room"),
      createQuest("quest-2", "Do homework"),
      createQuest("quest-1", "Clean room duplicate"),
      createQuest("quest-3", "Practice piano"),
    ] as QuestInstance[];

    const result = deduplicateQuests(quests);
    expect(result).toHaveLength(3);
    expect(result.map((q) => q.id)).toEqual(["quest-1", "quest-2", "quest-3"]);
  });

  it("should preserve first occurrence when duplicates exist", () => {
    const quests = [
      createQuest("quest-1", "Original"),
      createQuest("quest-1", "Duplicate"),
    ] as QuestInstance[];

    const result = deduplicateQuests(quests);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Original");
  });

  it("should handle empty quest arrays", () => {
    expect(deduplicateQuests([])).toEqual([]);
  });

  it("should handle quest arrays with no duplicates", () => {
    const quests = [
      createQuest("quest-1", "Task 1"),
      createQuest("quest-2", "Task 2"),
    ] as QuestInstance[];

    const result = deduplicateQuests(quests);
    expect(result).toHaveLength(2);
  });
});

describe("getQuestTimestamp", () => {
  it("should prioritize completed_at timestamp", () => {
    const quest = {
      id: "1",
      created_at: "2025-01-01T10:00:00Z",
      updated_at: "2025-01-02T10:00:00Z",
      completed_at: "2025-01-03T10:00:00Z",
    } as QuestInstance;

    const timestamp = getQuestTimestamp(quest);
    expect(timestamp).toBe(new Date("2025-01-03T10:00:00Z").getTime());
  });

  it("should use updated_at when completed_at is null", () => {
    const quest = {
      id: "1",
      created_at: "2025-01-01T10:00:00Z",
      updated_at: "2025-01-02T10:00:00Z",
      completed_at: null,
    } as QuestInstance;

    const timestamp = getQuestTimestamp(quest);
    expect(timestamp).toBe(new Date("2025-01-02T10:00:00Z").getTime());
  });

  it("should use created_at when both completed_at and updated_at are null", () => {
    const quest = {
      id: "1",
      created_at: "2025-01-01T10:00:00Z",
      updated_at: null,
      completed_at: null,
    } as QuestInstance;

    const timestamp = getQuestTimestamp(quest);
    expect(timestamp).toBe(new Date("2025-01-01T10:00:00Z").getTime());
  });

  it("should return 0 for quests with all null timestamps", () => {
    const quest = {
      id: "1",
      created_at: null,
      updated_at: null,
      completed_at: null,
    } as QuestInstance;

    expect(getQuestTimestamp(quest)).toBe(0);
  });

  it("should return 0 for invalid timestamp strings", () => {
    const quest = {
      id: "1",
      created_at: "invalid-date",
      updated_at: null,
      completed_at: null,
    } as QuestInstance;

    expect(getQuestTimestamp(quest)).toBe(0);
  });

  it("should return 0 for undefined timestamps", () => {
    const quest = {
      id: "1",
      created_at: undefined,
      updated_at: undefined,
      completed_at: undefined,
    } as unknown as QuestInstance;

    expect(getQuestTimestamp(quest)).toBe(0);
  });
});

describe("sortBy", () => {
  it("should sort numbers in ascending order", () => {
    const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
    const sorted = sortBy(numbers, (a, b) => a - b);
    expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
  });

  it("should sort numbers in descending order", () => {
    const numbers = [3, 1, 4, 1, 5];
    const sorted = sortBy(numbers, (a, b) => b - a);
    expect(sorted).toEqual([5, 4, 3, 1, 1]);
  });

  it("should not mutate the original array", () => {
    const original = [3, 1, 2];
    const sorted = sortBy(original, (a, b) => a - b);
    expect(original).toEqual([3, 1, 2]);
    expect(sorted).toEqual([1, 2, 3]);
  });

  it("should handle empty arrays", () => {
    expect(sortBy([], (a, b) => a - b)).toEqual([]);
  });

  it("should use default sort when no compareFn provided", () => {
    const strings = ["banana", "apple", "cherry"];
    const sorted = sortBy(strings);
    expect(sorted).toEqual(["apple", "banana", "cherry"]);
  });
});

describe("sortByKey", () => {
  const users = [
    { name: "Charlie", age: 30 },
    { name: "Alice", age: 25 },
    { name: "Bob", age: 35 },
  ];

  it("should sort by numeric key in ascending order", () => {
    const sorted = sortByKey(users, (user) => user.age);
    expect(sorted.map((u) => u.age)).toEqual([25, 30, 35]);
  });

  it("should sort by numeric key in descending order", () => {
    const sorted = sortByKey(users, (user) => user.age, "desc");
    expect(sorted.map((u) => u.age)).toEqual([35, 30, 25]);
  });

  it("should sort by string key in ascending order", () => {
    const sorted = sortByKey(users, (user) => user.name);
    expect(sorted.map((u) => u.name)).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("should sort by string key in descending order", () => {
    const sorted = sortByKey(users, (user) => user.name, "desc");
    expect(sorted.map((u) => u.name)).toEqual(["Charlie", "Bob", "Alice"]);
  });

  it("should not mutate the original array", () => {
    const original = [...users];
    sortByKey(users, (user) => user.age);
    expect(users).toEqual(original);
  });

  it("should handle empty arrays", () => {
    expect(sortByKey([], (item: { age: number }) => item.age)).toEqual([]);
  });
});

describe("filterByAll", () => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("should filter items matching all predicates", () => {
    const result = filterByAll(numbers, [
      (n) => n > 5,
      (n) => n % 2 === 0,
    ]);
    expect(result).toEqual([6, 8, 10]);
  });

  it("should return all items when no predicates provided", () => {
    const result = filterByAll(numbers, []);
    expect(result).toEqual(numbers);
  });

  it("should return empty array when no items match all predicates", () => {
    const result = filterByAll(numbers, [
      (n) => n > 10,
      (n) => n < 5,
    ]);
    expect(result).toEqual([]);
  });

  it("should work with single predicate", () => {
    const result = filterByAll(numbers, [(n) => n % 2 === 0]);
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it("should handle empty arrays", () => {
    expect(filterByAll([], [(n) => n > 0])).toEqual([]);
  });

  it("should work with object predicates", () => {
    const users = [
      { name: "Alice", age: 25, active: true },
      { name: "Bob", age: 30, active: false },
      { name: "Charlie", age: 35, active: true },
    ];

    const result = filterByAll(users, [
      (u) => u.age > 25,
      (u) => u.active,
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Charlie");
  });
});

describe("filterByAny", () => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("should filter items matching any predicate", () => {
    const result = filterByAny(numbers, [
      (n) => n < 3,
      (n) => n > 8,
    ]);
    expect(result).toEqual([1, 2, 9, 10]);
  });

  it("should return empty array when no predicates provided", () => {
    const result = filterByAny(numbers, []);
    expect(result).toEqual([]);
  });

  it("should return all matching items when predicates overlap", () => {
    const result = filterByAny(numbers, [
      (n) => n % 2 === 0,
      (n) => n > 5,
    ]);
    // Even numbers: 2, 4, 6, 8, 10
    // Greater than 5: 6, 7, 8, 9, 10
    // Union: 2, 4, 6, 7, 8, 9, 10
    expect(result).toEqual([2, 4, 6, 7, 8, 9, 10]);
  });

  it("should work with single predicate", () => {
    const result = filterByAny(numbers, [(n) => n % 2 === 0]);
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it("should handle empty arrays", () => {
    expect(filterByAny([], [(n) => n > 0])).toEqual([]);
  });

  it("should work with object predicates", () => {
    const users = [
      { name: "Alice", age: 25, admin: false },
      { name: "Bob", age: 30, admin: true },
      { name: "Charlie", age: 35, admin: false },
    ];

    const result = filterByAny(users, [
      (u) => u.admin,
      (u) => u.age < 30,
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((u) => u.name)).toEqual(["Alice", "Bob"]);
  });
});

describe("groupBy", () => {
  it("should group items by key", () => {
    const items = [
      { id: "1", category: "A" },
      { id: "2", category: "B" },
      { id: "3", category: "A" },
      { id: "4", category: "C" },
    ];

    const grouped = groupBy(items, (item) => item.category);

    expect(grouped.A).toHaveLength(2);
    expect(grouped.B).toHaveLength(1);
    expect(grouped.C).toHaveLength(1);
    expect(grouped.A.map((i) => i.id)).toEqual(["1", "3"]);
  });

  it("should handle empty arrays", () => {
    const result = groupBy([], (item: { key: string }) => item.key);
    expect(result).toEqual({});
  });

  it("should group quests by status", () => {
    const quests = [
      { id: "1", status: "PENDING" },
      { id: "2", status: "COMPLETED" },
      { id: "3", status: "PENDING" },
      { id: "4", status: "IN_PROGRESS" },
    ] as Array<Partial<QuestInstance>>;

    const grouped = groupBy(quests, (quest) => quest.status!);

    expect(grouped.PENDING).toHaveLength(2);
    expect(grouped.COMPLETED).toHaveLength(1);
    expect(grouped.IN_PROGRESS).toHaveLength(1);
  });

  it("should group by numeric keys", () => {
    const items = [
      { value: 10, bucket: 1 },
      { value: 20, bucket: 2 },
      { value: 15, bucket: 1 },
      { value: 25, bucket: 2 },
    ];

    const grouped = groupBy(items, (item) => item.bucket);

    expect(grouped[1]).toHaveLength(2);
    expect(grouped[2]).toHaveLength(2);
  });

  it("should handle single group", () => {
    const items = [
      { id: "1", type: "A" },
      { id: "2", type: "A" },
    ];

    const grouped = groupBy(items, (item) => item.type);

    expect(Object.keys(grouped)).toEqual(["A"]);
    expect(grouped.A).toHaveLength(2);
  });

  it("should handle items with unique keys", () => {
    const items = [
      { id: "1", key: "a" },
      { id: "2", key: "b" },
      { id: "3", key: "c" },
    ];

    const grouped = groupBy(items, (item) => item.key);

    expect(Object.keys(grouped)).toEqual(["a", "b", "c"]);
    expect(grouped.a).toHaveLength(1);
    expect(grouped.b).toHaveLength(1);
    expect(grouped.c).toHaveLength(1);
  });
});
