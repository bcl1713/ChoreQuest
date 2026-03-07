import { QuestInstance } from "@/lib/types/database";
import {
  deduplicate,
  deduplicateQuests,
  getQuestTimestamp,
  sortBy,
  sortByKey,
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
    expect(result[0].name).toBe("Alice");
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
    } as QuestInstance;
    expect(getQuestTimestamp(quest)).toBe(0);
  });
});

describe("sortBy", () => {
  it("should sort numbers ascending", () => {
    const numbers = [5, 2, 9, 1];
    const result = sortBy(numbers, (a, b) => a - b);
    expect(result).toEqual([1, 2, 5, 9]);
  });

  it("should sort strings ascending", () => {
    const strings = ["banana", "apple", "cherry"];
    const result = sortBy(strings, (a, b) => a.localeCompare(b));
    expect(result).toEqual(["apple", "banana", "cherry"]);
  });

  it("should handle sorting objects by key", () => {
    const objects = [
      { name: "Charlie", age: 30 },
      { name: "Alice", age: 25 },
      { name: "Bob", age: 28 },
    ];
    const result = sortBy(objects, (a, b) => a.name.localeCompare(b.name));
    expect(result.map((o) => o.name)).toEqual(["Alice", "Bob", "Charlie"]);
  });
});

describe("sortByKey", () => {
  it("should sort objects by a given key", () => {
    const items = [
      { id: 3, name: "Charlie" },
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    const result = sortByKey(items, (item) => item.id);
    expect(result.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("should handle string keys", () => {
    const items = [
      { id: 3, name: "Charlie" },
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    const result = sortByKey(items, (item) => item.name);
    expect(result.map((item) => item.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
    ]);
  });

  it("should handle empty arrays", () => {
    expect(sortByKey([], (item: { id: number }) => item.id)).toEqual([]);
  });
});
