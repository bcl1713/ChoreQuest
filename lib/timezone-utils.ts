/**
 * Timezone utility functions for ChoreQuest
 *
 * Provides timezone-aware date calculations for quest recurrence logic.
 * All functions use IANA timezone strings (e.g., 'America/Chicago', 'Europe/London')
 * and handle Daylight Saving Time (DST) transitions automatically.
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Converts a UTC date to the equivalent date/time in a specific timezone
 *
 * @param date - UTC date to convert
 * @param timezone - IANA timezone string (e.g., 'America/Chicago')
 * @returns Date object representing the same moment in the specified timezone
 *
 * @example
 * const utcDate = new Date('2025-01-15T06:00:00Z'); // 6 AM UTC
 * const chicagoDate = getDateInTimezone(utcDate, 'America/Chicago');
 * // Returns midnight in Chicago (which is 6 AM UTC during CST)
 */
export function getDateInTimezone(date: Date, timezone: string): Date {
  return toZonedTime(date, timezone);
}

/**
 * Gets the start of day (00:00:00.000) in a specific timezone
 *
 * @param date - Reference date
 * @param timezone - IANA timezone string
 * @returns UTC Date object representing midnight in the specified timezone
 *
 * @example
 * const now = new Date(); // Any time on Jan 15, 2025
 * const start = getStartOfDayInTimezone(now, 'America/Chicago');
 * // Returns Jan 15, 2025 00:00:00 CST (which is Jan 15, 06:00:00 UTC)
 */
export function getStartOfDayInTimezone(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  const startOfDayLocal = startOfDay(zonedDate);
  return fromZonedTime(startOfDayLocal, timezone);
}

/**
 * Gets the end of day (23:59:59.999) in a specific timezone
 *
 * @param date - Reference date
 * @param timezone - IANA timezone string
 * @returns UTC Date object representing 23:59:59.999 in the specified timezone
 *
 * @example
 * const now = new Date(); // Any time on Jan 15, 2025
 * const end = getEndOfDayInTimezone(now, 'America/Chicago');
 * // Returns Jan 15, 2025 23:59:59.999 CST (which is Jan 16, 05:59:59.999 UTC)
 */
export function getEndOfDayInTimezone(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  const endOfDayLocal = endOfDay(zonedDate);
  return fromZonedTime(endOfDayLocal, timezone);
}

/**
 * Gets the start of week in a specific timezone
 *
 * @param date - Reference date
 * @param timezone - IANA timezone string
 * @param weekStartsOn - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns UTC Date object representing the start of the week in the specified timezone
 *
 * @example
 * const now = new Date('2025-01-15'); // Wednesday
 * const weekStart = getStartOfWeekInTimezone(now, 'America/Chicago', 0);
 * // Returns Sunday Jan 12, 2025 00:00:00 CST (start of week when week starts on Sunday)
 */
export function getStartOfWeekInTimezone(
  date: Date,
  timezone: string,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): Date {
  const zonedDate = toZonedTime(date, timezone);
  const startOfWeekLocal = startOfWeek(zonedDate, { weekStartsOn });
  const startOfWeekDayLocal = startOfDay(startOfWeekLocal);
  return fromZonedTime(startOfWeekDayLocal, timezone);
}

/**
 * Gets the end of week in a specific timezone
 *
 * @param date - Reference date
 * @param timezone - IANA timezone string
 * @param weekStartsOn - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns UTC Date object representing the end of the week in the specified timezone
 *
 * @example
 * const now = new Date('2025-01-15'); // Wednesday
 * const weekEnd = getEndOfWeekInTimezone(now, 'America/Chicago', 0);
 * // Returns Saturday Jan 18, 2025 23:59:59.999 CST (end of week when week starts on Sunday)
 */
export function getEndOfWeekInTimezone(
  date: Date,
  timezone: string,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): Date {
  const zonedDate = toZonedTime(date, timezone);
  const endOfWeekLocal = endOfWeek(zonedDate, { weekStartsOn });
  const endOfWeekDayLocal = endOfDay(endOfWeekLocal);
  return fromZonedTime(endOfWeekDayLocal, timezone);
}

/**
 * Checks if two dates are on the same day in a specific timezone
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @param timezone - IANA timezone string
 * @returns true if both dates fall on the same calendar day in the specified timezone
 *
 * @example
 * const date1 = new Date('2025-01-15T05:00:00Z'); // Jan 15 at 5 AM UTC
 * const date2 = new Date('2025-01-15T23:00:00Z'); // Jan 15 at 11 PM UTC
 * isSameDayInTimezone(date1, date2, 'America/Chicago');
 * // Returns true (both are Jan 14 in Chicago during CST)
 */
export function isSameDayInTimezone(date1: Date, date2: Date, timezone: string): boolean {
  const start1 = getStartOfDayInTimezone(date1, timezone);
  const start2 = getStartOfDayInTimezone(date2, timezone);
  return start1.getTime() === start2.getTime();
}

/**
 * Checks if two dates are in the same week in a specific timezone
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @param timezone - IANA timezone string
 * @param weekStartsOn - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns true if both dates fall in the same calendar week in the specified timezone
 *
 * @example
 * const date1 = new Date('2025-01-13'); // Monday
 * const date2 = new Date('2025-01-17'); // Friday
 * isSameWeekInTimezone(date1, date2, 'America/Chicago', 0);
 * // Returns true (both are in the week starting Sunday Jan 12)
 */
export function isSameWeekInTimezone(
  date1: Date,
  date2: Date,
  timezone: string,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): boolean {
  const weekStart1 = getStartOfWeekInTimezone(date1, timezone, weekStartsOn);
  const weekStart2 = getStartOfWeekInTimezone(date2, timezone, weekStartsOn);
  return weekStart1.getTime() === weekStart2.getTime();
}

/**
 * Calculates the number of days between two dates in a specific timezone
 * This accounts for DST transitions where a "day" might be 23 or 25 hours
 *
 * @param date1 - Start date
 * @param date2 - End date
 * @param timezone - IANA timezone string
 * @returns Number of calendar days between the dates
 *
 * @example
 * const date1 = new Date('2025-01-15');
 * const date2 = new Date('2025-01-17');
 * getDaysBetweenInTimezone(date1, date2, 'America/Chicago');
 * // Returns 2 (two calendar days apart)
 */
export function getDaysBetweenInTimezone(date1: Date, date2: Date, timezone: string): number {
  const start1 = getStartOfDayInTimezone(date1, timezone);
  const start2 = getStartOfDayInTimezone(date2, timezone);
  const diffMs = Math.abs(start2.getTime() - start1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Gets the current time in a specific timezone
 *
 * @param timezone - IANA timezone string
 * @returns Current date/time in the specified timezone
 *
 * @example
 * const nowInChicago = getNowInTimezone('America/Chicago');
 * // Returns current time in Chicago timezone
 */
export function getNowInTimezone(timezone: string): Date {
  return toZonedTime(new Date(), timezone);
}

/**
 * Validates that a string is a valid IANA timezone
 *
 * @param timezone - Timezone string to validate
 * @returns true if the timezone is valid
 *
 * @example
 * isValidTimezone('America/Chicago'); // true
 * isValidTimezone('Invalid/Timezone'); // false
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the browser's detected timezone using Intl API
 * Falls back to 'UTC' if detection fails
 *
 * @returns IANA timezone string
 *
 * @example
 * const browserTz = getBrowserTimezone();
 * // Returns 'America/Chicago' if browser is in Central Time
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
