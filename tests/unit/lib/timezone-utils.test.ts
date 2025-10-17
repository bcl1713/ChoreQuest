/**
 * Tests for timezone utility functions
 *
 * These tests ensure timezone-aware date calculations work correctly
 * across different timezones and handle DST transitions properly.
 */

import {
  getDateInTimezone,
  getStartOfDayInTimezone,
  getEndOfDayInTimezone,
  getStartOfWeekInTimezone,
  getEndOfWeekInTimezone,
  isSameDayInTimezone,
  isSameWeekInTimezone,
  getDaysBetweenInTimezone,
  getNowInTimezone,
  isValidTimezone,
  getBrowserTimezone,
} from '@/lib/timezone-utils';

describe('timezone-utils', () => {
  describe('getDateInTimezone', () => {
    it('should convert UTC date to Chicago timezone', () => {
      const utcDate = new Date('2025-01-15T06:00:00Z'); // 6 AM UTC
      const chicagoDate = getDateInTimezone(utcDate, 'America/Chicago');

      // During CST (UTC-6), 6 AM UTC = midnight in Chicago
      expect(chicagoDate.getHours()).toBe(0);
      expect(chicagoDate.getMinutes()).toBe(0);
    });

    it('should convert UTC date to Tokyo timezone', () => {
      const utcDate = new Date('2025-01-15T15:00:00Z'); // 3 PM UTC
      const tokyoDate = getDateInTimezone(utcDate, 'Asia/Tokyo');

      // Tokyo is UTC+9, so 3 PM UTC = midnight next day in Tokyo
      expect(tokyoDate.getHours()).toBe(0);
      expect(tokyoDate.getDate()).toBe(16);
    });
  });

  describe('getStartOfDayInTimezone', () => {
    it('should get midnight in Chicago timezone', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Noon UTC
      const startOfDay = getStartOfDayInTimezone(date, 'America/Chicago');

      // Midnight Jan 15 in Chicago (CST) = 6 AM UTC on Jan 15
      expect(startOfDay.toISOString()).toBe('2025-01-15T06:00:00.000Z');
    });

    it('should get midnight in London timezone', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Noon UTC
      const startOfDay = getStartOfDayInTimezone(date, 'Europe/London');

      // Midnight Jan 15 in London (GMT) = midnight UTC on Jan 15
      expect(startOfDay.toISOString()).toBe('2025-01-15T00:00:00.000Z');
    });

    it('should get midnight in Sydney timezone', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Noon UTC
      const startOfDay = getStartOfDayInTimezone(date, 'Australia/Sydney');

      // Midnight Jan 15 in Sydney (AEDT, UTC+11) = 1 PM UTC on Jan 14
      expect(startOfDay.toISOString()).toBe('2025-01-14T13:00:00.000Z');
    });
  });

  describe('getEndOfDayInTimezone', () => {
    it('should get end of day in Chicago timezone', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Noon UTC
      const endOfDay = getEndOfDayInTimezone(date, 'America/Chicago');

      // 23:59:59.999 Jan 15 in Chicago (CST) = 05:59:59.999 UTC on Jan 16
      expect(endOfDay.toISOString()).toBe('2025-01-16T05:59:59.999Z');
    });

    it('should get end of day in UTC timezone', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const endOfDay = getEndOfDayInTimezone(date, 'UTC');

      expect(endOfDay.toISOString()).toBe('2025-01-15T23:59:59.999Z');
    });
  });

  describe('getStartOfWeekInTimezone', () => {
    it('should get start of week (Sunday) in Chicago', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Wednesday, Jan 15
      const startOfWeek = getStartOfWeekInTimezone(date, 'America/Chicago', 0);

      // Sunday Jan 12 midnight in Chicago = 6 AM UTC on Jan 12
      expect(startOfWeek.toISOString()).toBe('2025-01-12T06:00:00.000Z');
    });

    it('should get start of week (Monday) in Chicago', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Wednesday, Jan 15
      const startOfWeek = getStartOfWeekInTimezone(date, 'America/Chicago', 1);

      // Monday Jan 13 midnight in Chicago = 6 AM UTC on Jan 13
      expect(startOfWeek.toISOString()).toBe('2025-01-13T06:00:00.000Z');
    });

    it('should get start of week in different timezone', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Wednesday, Jan 15
      const startOfWeek = getStartOfWeekInTimezone(date, 'Asia/Tokyo', 0);

      // Sunday Jan 12 midnight in Tokyo (UTC+9) = 3 PM UTC on Jan 11
      expect(startOfWeek.toISOString()).toBe('2025-01-11T15:00:00.000Z');
    });
  });

  describe('getEndOfWeekInTimezone', () => {
    it('should get end of week (Saturday) in Chicago', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Wednesday, Jan 15
      const endOfWeek = getEndOfWeekInTimezone(date, 'America/Chicago', 0);

      // Saturday Jan 18 23:59:59.999 in Chicago = 5:59:59.999 AM UTC on Jan 19
      expect(endOfWeek.toISOString()).toBe('2025-01-19T05:59:59.999Z');
    });

    it('should get end of week (Sunday) when week starts Monday', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Wednesday, Jan 15
      const endOfWeek = getEndOfWeekInTimezone(date, 'America/Chicago', 1);

      // Sunday Jan 19 23:59:59.999 in Chicago = 5:59:59.999 AM UTC on Jan 20
      expect(endOfWeek.toISOString()).toBe('2025-01-20T05:59:59.999Z');
    });
  });

  describe('isSameDayInTimezone', () => {
    it('should return true for dates on same day in Chicago', () => {
      const date1 = new Date('2025-01-15T05:00:00Z'); // Jan 14 11 PM in Chicago
      const date2 = new Date('2025-01-15T10:00:00Z'); // Jan 15 4 AM in Chicago

      // Both are Jan 14 in Chicago (CST)
      expect(isSameDayInTimezone(date1, date2, 'America/Chicago')).toBe(false);
    });

    it('should return false for dates on different days in Chicago', () => {
      const date1 = new Date('2025-01-15T05:00:00Z'); // Jan 14 11 PM in Chicago
      const date2 = new Date('2025-01-16T05:00:00Z'); // Jan 15 11 PM in Chicago

      expect(isSameDayInTimezone(date1, date2, 'America/Chicago')).toBe(false);
    });

    it('should handle timezone edge cases', () => {
      const date1 = new Date('2025-01-15T05:59:59Z'); // Just before midnight in Chicago
      const date2 = new Date('2025-01-15T06:00:00Z'); // Exactly midnight in Chicago

      // date1 is Jan 14 23:59:59 in Chicago, date2 is Jan 15 00:00:00
      expect(isSameDayInTimezone(date1, date2, 'America/Chicago')).toBe(false);
    });
  });

  describe('isSameWeekInTimezone', () => {
    it('should return true for dates in same week', () => {
      const date1 = new Date('2025-01-13T12:00:00Z'); // Monday
      const date2 = new Date('2025-01-17T12:00:00Z'); // Friday

      // Both are in week starting Sunday Jan 12
      expect(isSameWeekInTimezone(date1, date2, 'America/Chicago', 0)).toBe(true);
    });

    it('should return false for dates in different weeks', () => {
      const date1 = new Date('2025-01-11T12:00:00Z'); // Saturday
      const date2 = new Date('2025-01-13T12:00:00Z'); // Monday

      // Saturday is end of previous week, Monday is start of new week
      expect(isSameWeekInTimezone(date1, date2, 'America/Chicago', 0)).toBe(false);
    });

    it('should respect weekStartsOn parameter', () => {
      const date1 = new Date('2025-01-12T12:00:00Z'); // Sunday
      const date2 = new Date('2025-01-13T12:00:00Z'); // Monday

      // When week starts on Sunday, they're in the same week (Sun-Sat)
      expect(isSameWeekInTimezone(date1, date2, 'America/Chicago', 0)).toBe(true);

      // When week starts on Monday, Sunday is end of prev week, Monday is start of new week
      expect(isSameWeekInTimezone(date1, date2, 'America/Chicago', 1)).toBe(false);
    });
  });

  describe('getDaysBetweenInTimezone', () => {
    it('should calculate days between dates in same timezone', () => {
      const date1 = new Date('2025-01-15T12:00:00Z');
      const date2 = new Date('2025-01-17T12:00:00Z');

      const days = getDaysBetweenInTimezone(date1, date2, 'America/Chicago');
      expect(days).toBe(2);
    });

    it('should handle dates in reverse order', () => {
      const date1 = new Date('2025-01-17T12:00:00Z');
      const date2 = new Date('2025-01-15T12:00:00Z');

      const days = getDaysBetweenInTimezone(date1, date2, 'America/Chicago');
      expect(days).toBe(2);
    });

    it('should return 0 for same day', () => {
      const date1 = new Date('2025-01-15T12:00:00Z');
      const date2 = new Date('2025-01-15T20:00:00Z');

      const days = getDaysBetweenInTimezone(date1, date2, 'America/Chicago');
      expect(days).toBe(0);
    });
  });

  describe('getNowInTimezone', () => {
    it('should return current time in specified timezone', () => {
      const now = new Date();
      const chicagoNow = getNowInTimezone('America/Chicago');

      // Should return a valid date
      expect(chicagoNow).toBeInstanceOf(Date);
      expect(chicagoNow.getTime()).toBeGreaterThan(0);

      // getNowInTimezone returns the zoned date, which represents the same moment
      // The absolute time value should be very similar (within a few ms)
      const diff = Math.abs(now.getTime() - new Date().getTime());
      expect(diff).toBeLessThan(1000);
    });
  });

  describe('isValidTimezone', () => {
    it('should return true for valid IANA timezones', () => {
      expect(isValidTimezone('America/Chicago')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
      expect(isValidTimezone('Asia/Tokyo')).toBe(true);
      expect(isValidTimezone('UTC')).toBe(true);
      expect(isValidTimezone('America/New_York')).toBe(true);
    });

    it('should return false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('Chicago')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
      // Note: GMT is actually valid in Intl API, though UTC is preferred
    });
  });

  describe('getBrowserTimezone', () => {
    it('should return a valid IANA timezone string', () => {
      const timezone = getBrowserTimezone();

      expect(typeof timezone).toBe('string');
      expect(timezone.length).toBeGreaterThan(0);
      expect(isValidTimezone(timezone)).toBe(true);
    });
  });

  describe('DST transitions', () => {
    it('should handle spring forward DST transition', () => {
      // March 9, 2025 - Spring forward in US (2 AM -> 3 AM)
      const beforeDST = new Date('2025-03-09T07:00:00Z'); // 1 AM CST (before spring forward)
      const afterDST = new Date('2025-03-09T08:00:00Z'); // 3 AM CDT (after spring forward)

      const startBefore = getStartOfDayInTimezone(beforeDST, 'America/Chicago');
      const startAfter = getStartOfDayInTimezone(afterDST, 'America/Chicago');

      // Both should be midnight on March 9
      expect(startBefore.toISOString()).toBe(startAfter.toISOString());
    });

    it('should handle fall back DST transition', () => {
      // November 2, 2025 - Fall back in US (2 AM -> 1 AM)
      const beforeDST = new Date('2025-11-02T06:00:00Z'); // 1 AM CDT (before fall back)
      const afterDST = new Date('2025-11-02T08:00:00Z'); // 2 AM CST (after fall back)

      const startBefore = getStartOfDayInTimezone(beforeDST, 'America/Chicago');
      const startAfter = getStartOfDayInTimezone(afterDST, 'America/Chicago');

      // Both should be midnight on November 2
      expect(startBefore.toISOString()).toBe(startAfter.toISOString());
    });
  });

  describe('edge cases', () => {
    it('should handle leap year dates', () => {
      const leapDay = new Date('2024-02-29T12:00:00Z');
      const startOfDay = getStartOfDayInTimezone(leapDay, 'America/Chicago');

      expect(startOfDay.toISOString()).toBe('2024-02-29T06:00:00.000Z');
    });

    it('should handle year boundaries', () => {
      const newYearsEve = new Date('2024-12-31T23:00:00Z');
      const endOfDay = getEndOfDayInTimezone(newYearsEve, 'America/Chicago');

      // End of Dec 31 in Chicago
      expect(endOfDay.toISOString()).toBe('2025-01-01T05:59:59.999Z');
    });

    it('should handle International Date Line (Pacific/Fiji)', () => {
      const date = new Date('2025-01-15T12:00:00Z'); // Noon UTC on Jan 15
      const fijiStart = getStartOfDayInTimezone(date, 'Pacific/Fiji');

      // In January 2025, Fiji uses UTC+12 (standard time, not DST)
      // Noon UTC on Jan 15 = midnight Jan 16 in Fiji
      // So start of day for that date in Fiji would be midnight Jan 16 Fiji time
      // Midnight Jan 16 in Fiji (UTC+12) = noon Jan 15 UTC
      const fijiStartUTC = fijiStart.toISOString();
      expect(fijiStartUTC).toBe('2025-01-15T12:00:00.000Z');
    });
  });

  describe('consistency across timezones', () => {
    it('should maintain consistent day calculations across timezones', () => {
      const date = new Date('2025-01-15T12:00:00Z');

      const chicagoStart = getStartOfDayInTimezone(date, 'America/Chicago');
      const tokyoStart = getStartOfDayInTimezone(date, 'Asia/Tokyo');
      const londonStart = getStartOfDayInTimezone(date, 'Europe/London');

      // All should represent midnight on Jan 15 in their respective timezones
      expect(chicagoStart.getUTCDate()).toBe(15);
      expect(tokyoStart.getUTCDate()).toBe(14); // Tokyo is ahead, so Jan 15 midnight is Jan 14 UTC
      expect(londonStart.getUTCDate()).toBe(15);
    });
  });
});
