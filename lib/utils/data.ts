import { QuestInstance } from "@/lib/types/database";

/**
 * Generic deduplication function that removes duplicate items from an array based on a key extractor.
 *
 * @param items - The array of items to deduplicate
 * @param keyExtractor - Function that extracts a unique key from each item (defaults to the item itself)
 * @returns A new array with duplicates removed (preserving first occurrence order)
 *
 * @example
 * ```ts
 * const items = [1, 2, 2, 3, 1, 4];
 * deduplicate(items) // [1, 2, 3, 4]
 *
 * const users = [
 *   { id: '1', name: 'Alice' },
 *   { id: '2', name: 'Bob' },
 *   { id: '1', name: 'Alice Duplicate' }
 * ];
 * deduplicate(users, user => user.id) // [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }]
 * ```
 */
export const deduplicate = <T>(
  items: T[],
  keyExtractor: (item: T) => string | number = (item) => String(item)
): T[] => {
  const seen = new Set<string | number>();
  return items.filter((item) => {
    const key = keyExtractor(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/**
 * Deduplicates an array of quest instances by their ID.
 * Preserves the first occurrence of each quest when duplicates are found.
 *
 * @param quests - The array of quest instances to deduplicate
 * @returns A new array with duplicate quests removed
 *
 * @example
 * ```ts
 * const quests = [
 *   { id: 'quest-1', title: 'Clean room' },
 *   { id: 'quest-2', title: 'Do homework' },
 *   { id: 'quest-1', title: 'Clean room duplicate' }
 * ];
 * deduplicateQuests(quests) // Returns first two quests only
 * ```
 */
export const deduplicateQuests = (quests: QuestInstance[]): QuestInstance[] => {
  return deduplicate(quests, (quest) => quest.id);
};

/**
 * Extracts the most relevant timestamp from a quest instance for sorting purposes.
 * Prioritizes: completed_at > updated_at > created_at
 * Returns 0 for invalid or missing timestamps.
 *
 * @param quest - The quest instance to extract timestamp from
 * @returns The timestamp in milliseconds, or 0 if no valid timestamp exists
 *
 * @example
 * ```ts
 * const quest = {
 *   id: 'quest-1',
 *   created_at: '2025-01-01T10:00:00Z',
 *   updated_at: '2025-01-02T10:00:00Z',
 *   completed_at: '2025-01-03T10:00:00Z'
 * };
 * getQuestTimestamp(quest) // Returns timestamp for 2025-01-03T10:00:00Z
 * ```
 */
export const getQuestTimestamp = (quest: QuestInstance): number => {
  const toTime = (timestamp: string | null | undefined): number => {
    if (!timestamp) return 0;
    const value = new Date(timestamp).getTime();
    return Number.isFinite(value) ? value : 0;
  };

  return (
    toTime(quest.completed_at) ||
    toTime(quest.updated_at) ||
    toTime(quest.created_at)
  );
};

/**
 * Sorts an array of items using a comparator function without mutating the original array.
 *
 * @param items - The array to sort
 * @param compareFn - Optional comparison function (same as Array.sort)
 * @returns A new sorted array
 *
 * @example
 * ```ts
 * const numbers = [3, 1, 2];
 * sortBy(numbers, (a, b) => a - b) // [1, 2, 3]
 * // Original array unchanged: [3, 1, 2]
 * ```
 */
export const sortBy = <T>(
  items: T[],
  compareFn?: (a: T, b: T) => number
): T[] => {
  return [...items].sort(compareFn);
};

/**
 * Sorts an array by a specific field or key extractor function.
 *
 * @param items - The array to sort
 * @param keyExtractor - Function that extracts the sort key from each item
 * @param order - Sort order: 'asc' for ascending (default), 'desc' for descending
 * @returns A new sorted array
 *
 * @example
 * ```ts
 * const users = [
 *   { name: 'Charlie', age: 30 },
 *   { name: 'Alice', age: 25 },
 *   { name: 'Bob', age: 35 }
 * ];
 * sortByKey(users, user => user.age) // Sorted by age ascending
 * sortByKey(users, user => user.name, 'desc') // Sorted by name descending
 * ```
 */
export const sortByKey = <T, K extends string | number>(
  items: T[],
  keyExtractor: (item: T) => K,
  order: "asc" | "desc" = "asc"
): T[] => {
  return sortBy(items, (a, b) => {
    const keyA = keyExtractor(a);
    const keyB = keyExtractor(b);

    if (keyA < keyB) return order === "asc" ? -1 : 1;
    if (keyA > keyB) return order === "asc" ? 1 : -1;
    return 0;
  });
};

/**
 * Filters an array to only include items that match all provided criteria.
 *
 * @param items - The array to filter
 * @param predicates - Array of predicate functions that must all return true
 * @returns A new filtered array
 *
 * @example
 * ```ts
 * const numbers = [1, 2, 3, 4, 5, 6];
 * filterByAll(numbers, [
 *   n => n > 2,
 *   n => n % 2 === 0
 * ]) // [4, 6] - numbers greater than 2 AND even
 * ```
 */
export const filterByAll = <T>(
  items: T[],
  predicates: Array<(item: T) => boolean>
): T[] => {
  return items.filter((item) => predicates.every((predicate) => predicate(item)));
};

/**
 * Filters an array to include items that match any of the provided criteria.
 *
 * @param items - The array to filter
 * @param predicates - Array of predicate functions where at least one must return true
 * @returns A new filtered array
 *
 * @example
 * ```ts
 * const numbers = [1, 2, 3, 4, 5, 6];
 * filterByAny(numbers, [
 *   n => n < 2,
 *   n => n > 5
 * ]) // [1, 6] - numbers less than 2 OR greater than 5
 * ```
 */
export const filterByAny = <T>(
  items: T[],
  predicates: Array<(item: T) => boolean>
): T[] => {
  return items.filter((item) => predicates.some((predicate) => predicate(item)));
};

/**
 * Groups an array of items by a key extractor function.
 *
 * @param items - The array to group
 * @param keyExtractor - Function that extracts the grouping key from each item
 * @returns An object with keys mapped to arrays of items
 *
 * @example
 * ```ts
 * const quests = [
 *   { id: '1', status: 'PENDING' },
 *   { id: '2', status: 'COMPLETED' },
 *   { id: '3', status: 'PENDING' }
 * ];
 * groupBy(quests, quest => quest.status)
 * // {
 * //   PENDING: [{ id: '1', status: 'PENDING' }, { id: '3', status: 'PENDING' }],
 * //   COMPLETED: [{ id: '2', status: 'COMPLETED' }]
 * // }
 * ```
 */
export const groupBy = <T, K extends string | number>(
  items: T[],
  keyExtractor: (item: T) => K
): Record<K, T[]> => {
  return items.reduce((groups, item) => {
    const key = keyExtractor(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};
