import { QuestDifficulty, QuestStatus } from "@/lib/types/database";

/**
 * Returns the Tailwind CSS text color class for a given quest difficulty level.
 *
 * @param difficulty - The difficulty level of the quest
 * @returns A Tailwind CSS text color class string
 *
 * @example
 * ```ts
 * getDifficultyColor("EASY") // "text-green-400"
 * getDifficultyColor("MEDIUM") // "text-yellow-400"
 * getDifficultyColor("HARD") // "text-red-400"
 * ```
 */
export const getDifficultyColor = (difficulty: QuestDifficulty): string => {
  switch (difficulty) {
    case "EASY":
      return "text-green-400";
    case "MEDIUM":
      return "text-yellow-400";
    case "HARD":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
};

/**
 * Returns the Tailwind CSS background and text color classes for a given quest status.
 * Used for status badges and pills throughout the application.
 *
 * @param status - The status of the quest instance
 * @returns A space-separated string of Tailwind CSS classes for background and text colors
 *
 * @example
 * ```ts
 * getStatusColor("PENDING") // "bg-gray-600 text-gray-200"
 * getStatusColor("IN_PROGRESS") // "bg-blue-600 text-blue-100"
 * getStatusColor("COMPLETED") // "bg-yellow-600 text-yellow-100"
 * getStatusColor("APPROVED") // "bg-green-600 text-green-100"
 * ```
 */
export const getStatusColor = (status: QuestStatus | null | undefined): string => {
  switch (status) {
    case "PENDING":
      return "bg-gray-600 text-gray-200";
    case "IN_PROGRESS":
      return "bg-blue-600 text-blue-100";
    case "COMPLETED":
      return "bg-yellow-600 text-yellow-100";
    case "APPROVED":
      return "bg-green-600 text-green-100";
    case "EXPIRED":
    case "MISSED":
      return "bg-red-600 text-red-100";
    case "AVAILABLE":
      return "bg-emerald-700 text-emerald-100";
    case "CLAIMED":
      return "bg-purple-700 text-purple-100";
    default:
      return "bg-gray-600 text-gray-200";
  }
};
