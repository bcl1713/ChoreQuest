/**
 * Formatting utilities for numbers, dates, times, and percentages.
 * Consolidates formatting logic used across the application.
 */

/**
 * Formats a number with thousand separators using locale-specific formatting.
 *
 * @param value - The number to format
 * @returns A formatted string with thousand separators (e.g., "1,234")
 *
 * @example
 * ```ts
 * formatNumber(1234) // "1,234"
 * formatNumber(1000000) // "1,000,000"
 * ```
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

/**
 * Formats XP (experience points) with thousand separators.
 *
 * @param xp - The XP value to format
 * @returns A formatted string with thousand separators
 *
 * @example
 * ```ts
 * formatXP(1500) // "1,500"
 * formatXP(50) // "50"
 * ```
 */
export const formatXP = (xp: number): string => {
  return xp.toLocaleString();
};

/**
 * Formats gold currency with thousand separators.
 *
 * @param gold - The gold amount to format
 * @returns A formatted string with thousand separators
 *
 * @example
 * ```ts
 * formatGold(2500) // "2,500"
 * formatGold(100) // "100"
 * ```
 */
export const formatGold = (gold: number): string => {
  return gold.toLocaleString();
};

/**
 * Formats quest points with thousand separators.
 *
 * @param points - The points value to format
 * @returns A formatted string with thousand separators
 *
 * @example
 * ```ts
 * formatPoints(1000) // "1,000"
 * formatPoints(50) // "50"
 * ```
 */
export const formatPoints = (points: number): string => {
  return points.toLocaleString();
};

/**
 * Formats a percentage value, handling both decimal (0.25) and whole number (25) formats.
 * Returns null for invalid values (non-numeric, NaN, infinite, or zero/negative).
 *
 * @param value - The percentage value to format (can be decimal like 0.25 or whole like 25)
 * @returns A formatted percentage string (e.g., "25%") or null if invalid
 *
 * @example
 * ```ts
 * formatPercent(0.25) // "25%"
 * formatPercent(25) // "25%"
 * formatPercent(0.5) // "50%"
 * formatPercent(null) // null
 * formatPercent(0) // null
 * ```
 */
export const formatPercent = (value: number | null | undefined): string | null => {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return null;
  }
  const normalized = value <= 1 ? value * 100 : value;
  if (normalized <= 0) return null;
  return `${Math.round(normalized)}%`;
};

/**
 * Formats a date/time string into a human-readable format.
 * Returns null for invalid or empty values.
 *
 * @param value - ISO date string or other date-parseable string
 * @returns A formatted date/time string (e.g., "Jan 15, 2025, 02:30 PM") or null if invalid
 *
 * @example
 * ```ts
 * formatDateTime("2025-01-15T14:30:00Z") // "Jan 15, 2025, 02:30 PM"
 * formatDateTime(null) // null
 * formatDateTime("invalid") // null
 * ```
 */
export const formatDateTime = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formats a due date with contextual emoji and relative time information.
 * Shows different formatting based on how soon the date is due.
 *
 * @param dueDate - ISO date string representing the due date
 * @returns A formatted string with emoji and relative time, or null if no date provided
 *
 * @example
 * ```ts
 * // If today is Jan 10
 * formatDueDate("2025-01-09T10:00:00Z") // "🚨 Overdue (1/9)"
 * formatDueDate("2025-01-10T14:00:00Z") // "⏰ Due Today 02:00 PM"
 * formatDueDate("2025-01-11T14:00:00Z") // "📅 Due Tomorrow 02:00 PM"
 * formatDueDate("2025-01-15T14:00:00Z") // "📅 Due 1/15 02:00 PM"
 * formatDueDate(null) // null
 * ```
 */
export const formatDueDate = (dueDate: string | null): string | null => {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
  const formattedTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffDays < 0) {
    return `🚨 Overdue (${formattedDate})`;
  }
  if (diffDays === 0) {
    return `⏰ Due Today ${formattedTime}`;
  }
  if (diffDays === 1) {
    return `📅 Due Tomorrow ${formattedTime}`;
  }
  return `📅 Due ${formattedDate} ${formattedTime}`;
};
