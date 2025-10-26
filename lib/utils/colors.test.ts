import { QuestDifficulty, QuestStatus } from "@/lib/types/database";
import { getDifficultyColor, getStatusColor } from "./colors";

describe("getDifficultyColor", () => {
  it("should return green text color for EASY difficulty", () => {
    expect(getDifficultyColor("EASY")).toBe("text-green-400");
  });

  it("should return yellow text color for MEDIUM difficulty", () => {
    expect(getDifficultyColor("MEDIUM")).toBe("text-yellow-400");
  });

  it("should return red text color for HARD difficulty", () => {
    expect(getDifficultyColor("HARD")).toBe("text-red-400");
  });

  it("should return gray text color for unknown difficulty", () => {
    // @ts-expect-error Testing invalid input
    expect(getDifficultyColor("UNKNOWN")).toBe("text-gray-400");
  });

  it("should handle all valid QuestDifficulty values", () => {
    const validDifficulties: QuestDifficulty[] = ["EASY", "MEDIUM", "HARD"];

    validDifficulties.forEach((difficulty) => {
      const color = getDifficultyColor(difficulty);
      expect(color).toMatch(/^text-(green|yellow|red)-400$/);
    });
  });
});

describe("getStatusColor", () => {
  it("should return gray background for PENDING status", () => {
    expect(getStatusColor("PENDING")).toBe("bg-gray-600 text-gray-200");
  });

  it("should return blue background for IN_PROGRESS status", () => {
    expect(getStatusColor("IN_PROGRESS")).toBe("bg-blue-600 text-blue-100");
  });

  it("should return yellow background for COMPLETED status", () => {
    expect(getStatusColor("COMPLETED")).toBe("bg-yellow-600 text-yellow-100");
  });

  it("should return green background for APPROVED status", () => {
    expect(getStatusColor("APPROVED")).toBe("bg-green-600 text-green-100");
  });

  it("should return red background for EXPIRED status", () => {
    expect(getStatusColor("EXPIRED")).toBe("bg-red-600 text-red-100");
  });

  it("should return red background for MISSED status", () => {
    expect(getStatusColor("MISSED")).toBe("bg-red-600 text-red-100");
  });

  it("should return emerald background for AVAILABLE status", () => {
    expect(getStatusColor("AVAILABLE")).toBe("bg-emerald-700 text-emerald-100");
  });

  it("should return purple background for CLAIMED status", () => {
    expect(getStatusColor("CLAIMED")).toBe("bg-purple-700 text-purple-100");
  });

  it("should return gray background for null status", () => {
    expect(getStatusColor(null)).toBe("bg-gray-600 text-gray-200");
  });

  it("should return gray background for undefined status", () => {
    expect(getStatusColor(undefined)).toBe("bg-gray-600 text-gray-200");
  });

  it("should return gray background for unknown status", () => {
    // @ts-expect-error Testing invalid input
    expect(getStatusColor("UNKNOWN")).toBe("bg-gray-600 text-gray-200");
  });

  it("should handle all valid QuestStatus values", () => {
    const validStatuses: QuestStatus[] = [
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "APPROVED",
      "EXPIRED",
      "MISSED",
      "AVAILABLE",
      "CLAIMED",
    ];

    validStatuses.forEach((status) => {
      const color = getStatusColor(status);
      expect(color).toMatch(/^bg-\w+-\d+ text-\w+-\d+$/);
      expect(color).toContain("bg-");
      expect(color).toContain("text-");
    });
  });

  it("should use consistent color schemes for status badges", () => {
    // Ensure all status colors return both background and text color classes
    const testStatuses: Array<QuestStatus | null | undefined> = [
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "APPROVED",
      "EXPIRED",
      "MISSED",
      "AVAILABLE",
      "CLAIMED",
      null,
      undefined,
    ];

    testStatuses.forEach((status) => {
      const colorClasses = getStatusColor(status);
      const parts = colorClasses.split(" ");

      // Should have exactly 2 classes: background and text
      expect(parts).toHaveLength(2);

      // First class should be a background color
      expect(parts[0]).toMatch(/^bg-/);

      // Second class should be a text color
      expect(parts[1]).toMatch(/^text-/);
    });
  });
});
