import {
  getStartOfDayInTimezone,
  getEndOfDayInTimezone,
  getStartOfWeekInTimezone,
  getEndOfWeekInTimezone,
} from "@/lib/timezone-utils";

const TEST_INTERVAL_MINUTES_ENV = process.env.RECURRING_TEST_INTERVAL_MINUTES;
const TEST_INTERVAL_MINUTES = TEST_INTERVAL_MINUTES_ENV
  ? Number.parseInt(TEST_INTERVAL_MINUTES_ENV, 10)
  : null;

export const calculateCycleDates = (
  recurrencePattern: string,
  timezone: string = "UTC",
  weekStartDay: number = 0
): { cycleStart: Date; cycleEnd: Date } => {
  const now = new Date();

  if (TEST_INTERVAL_MINUTES && TEST_INTERVAL_MINUTES > 0) {
    const interval = Math.max(TEST_INTERVAL_MINUTES, 1);
    const cycleStart = new Date(now);
    const minutes = cycleStart.getMinutes();
    const alignedMinutes = Math.floor(minutes / interval) * interval;
    cycleStart.setMinutes(alignedMinutes, 0, 0);

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMinutes(cycleEnd.getMinutes() + interval);
    cycleEnd.setMilliseconds(cycleEnd.getMilliseconds() - 1);

    return { cycleStart, cycleEnd };
  }

  if (recurrencePattern === "DAILY") {
    const cycleStart = getStartOfDayInTimezone(now, timezone);
    const cycleEnd = getEndOfDayInTimezone(now, timezone);
    return { cycleStart, cycleEnd };
  }

  if (recurrencePattern === "WEEKLY") {
    const weekStart = weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const cycleStart = getStartOfWeekInTimezone(now, timezone, weekStart);
    const cycleEnd = getEndOfWeekInTimezone(now, timezone, weekStart);
    return { cycleStart, cycleEnd };
  }

  return calculateCycleDates("DAILY", timezone, weekStartDay);
};
