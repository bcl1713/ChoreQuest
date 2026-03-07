/**
 * Edge case tests for StreakService.validateConsecutiveCompletion
 */

import { StreakService } from "./streak-service";

describe("StreakService - validateConsecutiveCompletion edge cases", () => {
  let streakService: StreakService;

  beforeEach(() => {
    streakService = new StreakService();
  });

  it("should fail for a daily quest completed just over 48 hours apart but missing one calendar day", () => {
    const lastCompleted = new Date("2025-10-10T10:00:00.000Z").toISOString();
    const current = new Date("2025-10-12T11:00:00.000Z");
    const result = streakService.validateConsecutiveCompletion(
      lastCompleted,
      "DAILY",
      current,
    );
    expect(result).toBe(false);
  });

  it("should pass for a daily quest completed just under 48 hours apart (within 2-day window)", () => {
    const lastCompleted = new Date("2025-10-10T23:00:00.000Z").toISOString();
    const current = new Date("2025-10-12T22:00:00.000Z");
    const result = streakService.validateConsecutiveCompletion(
      lastCompleted,
      "DAILY",
      current,
    );
    expect(result).toBe(true);
  });

  it("should handle completions across a timezone boundary correctly", () => {
    const lastCompleted = new Date("2025-10-11T04:00:00.000Z").toISOString();
    const current = new Date("2025-10-12T04:00:00.000Z");
    const result = streakService.validateConsecutiveCompletion(
      lastCompleted,
      "DAILY",
      current,
    );
    expect(result).toBe(true);
  });

  it("should return true for a weekly quest completed on Monday then the next Sunday", () => {
    const lastCompleted = new Date("2025-10-06T12:00:00.000Z").toISOString();
    const current = new Date("2025-10-12T12:00:00.000Z");
    const result = streakService.validateConsecutiveCompletion(
      lastCompleted,
      "WEEKLY",
      current,
    );
    expect(result).toBe(true);
  });

  it("should return true for a weekly quest completed on Sunday then the next Monday", () => {
    const lastCompleted = new Date("2025-10-05T12:00:00.000Z").toISOString();
    const current = new Date("2025-10-06T12:00:00.000Z");
    const result = streakService.validateConsecutiveCompletion(
      lastCompleted,
      "WEEKLY",
      current,
    );
    expect(result).toBe(true);
  });

  it("should return true for a weekly quest exactly 8 days apart (within 8-day window)", () => {
    const lastCompleted = new Date("2025-10-05T12:00:00.000Z").toISOString();
    const current = new Date("2025-10-13T12:00:00.000Z");
    const result = streakService.validateConsecutiveCompletion(
      lastCompleted,
      "WEEKLY",
      current,
    );
    expect(result).toBe(true);
  });
});
