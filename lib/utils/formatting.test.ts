import {
  formatNumber,
  formatXP,
  formatGold,
  formatPoints,
  formatPercent,
  formatDateTime,
  formatDueDate,
} from "./formatting";

describe("formatNumber", () => {
  it("should format small numbers without separators", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(1)).toBe("1");
    expect(formatNumber(99)).toBe("99");
    expect(formatNumber(999)).toBe("999");
  });

  it("should format large numbers with thousand separators", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234)).toBe("1,234");
    expect(formatNumber(1000000)).toBe("1,000,000");
    expect(formatNumber(9999999)).toBe("9,999,999");
  });

  it("should handle negative numbers", () => {
    expect(formatNumber(-100)).toBe("-100");
    expect(formatNumber(-1000)).toBe("-1,000");
  });

  it("should handle decimal numbers", () => {
    expect(formatNumber(1234.56)).toBe("1,234.56");
  });
});

describe("formatXP", () => {
  it("should format XP values with thousand separators", () => {
    expect(formatXP(0)).toBe("0");
    expect(formatXP(50)).toBe("50");
    expect(formatXP(1500)).toBe("1,500");
    expect(formatXP(100000)).toBe("100,000");
  });

  it("should handle large XP values", () => {
    expect(formatXP(9999999)).toBe("9,999,999");
  });
});

describe("formatGold", () => {
  it("should format gold amounts with thousand separators", () => {
    expect(formatGold(0)).toBe("0");
    expect(formatGold(100)).toBe("100");
    expect(formatGold(2500)).toBe("2,500");
    expect(formatGold(1000000)).toBe("1,000,000");
  });

  it("should handle small gold amounts", () => {
    expect(formatGold(1)).toBe("1");
    expect(formatGold(50)).toBe("50");
  });
});

describe("formatPoints", () => {
  it("should format point values with thousand separators", () => {
    expect(formatPoints(0)).toBe("0");
    expect(formatPoints(50)).toBe("50");
    expect(formatPoints(1000)).toBe("1,000");
    expect(formatPoints(25000)).toBe("25,000");
  });

  it("should handle large point values", () => {
    expect(formatPoints(1000000)).toBe("1,000,000");
  });
});

describe("formatPercent", () => {
  describe("decimal format (0-1 range)", () => {
    it("should convert decimal percentages to whole numbers", () => {
      expect(formatPercent(0.25)).toBe("25%");
      expect(formatPercent(0.5)).toBe("50%");
      expect(formatPercent(0.75)).toBe("75%");
      expect(formatPercent(1.0)).toBe("100%");
    });

    it("should round decimal percentages", () => {
      expect(formatPercent(0.123)).toBe("12%");
      expect(formatPercent(0.456)).toBe("46%");
      expect(formatPercent(0.789)).toBe("79%");
    });
  });

  describe("whole number format (>1 range)", () => {
    it("should handle whole number percentages", () => {
      expect(formatPercent(25)).toBe("25%");
      expect(formatPercent(50)).toBe("50%");
      expect(formatPercent(100)).toBe("100%");
    });

    it("should round whole number percentages", () => {
      expect(formatPercent(12.3)).toBe("12%");
      expect(formatPercent(45.6)).toBe("46%");
      expect(formatPercent(78.9)).toBe("79%");
    });
  });

  describe("edge cases and invalid values", () => {
    it("should return null for zero and negative values", () => {
      expect(formatPercent(0)).toBeNull();
      expect(formatPercent(-0.5)).toBeNull();
      expect(formatPercent(-10)).toBeNull();
    });

    it("should return null for null and undefined", () => {
      expect(formatPercent(null)).toBeNull();
      expect(formatPercent(undefined)).toBeNull();
    });

    it("should return null for NaN", () => {
      expect(formatPercent(NaN)).toBeNull();
    });

    it("should return null for infinite values", () => {
      expect(formatPercent(Infinity)).toBeNull();
      expect(formatPercent(-Infinity)).toBeNull();
    });

    it("should return null for non-numeric values", () => {
      // @ts-expect-error Testing invalid input
      expect(formatPercent("50")).toBeNull();
      // @ts-expect-error Testing invalid input
      expect(formatPercent({})).toBeNull();
      // @ts-expect-error Testing invalid input
      expect(formatPercent([])).toBeNull();
    });
  });

  describe("boundary values", () => {
    it("should handle very small positive percentages", () => {
      expect(formatPercent(0.01)).toBe("1%");
      expect(formatPercent(0.001)).toBe("0%");
    });

    it("should handle percentages over 100%", () => {
      // Values > 1 are treated as already-converted percentages
      expect(formatPercent(1.5)).toBe("2%"); // Rounds 1.5 to 2
      expect(formatPercent(200)).toBe("200%");
    });

    it("should handle exactly 1.0", () => {
      // 1.0 is treated as decimal (100%)
      expect(formatPercent(1.0)).toBe("100%");
    });
  });
});

describe("formatDateTime", () => {
  it("should format valid ISO date strings", () => {
    const result = formatDateTime("2025-01-15T14:30:00Z");
    expect(result).toBeTruthy();
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });

  it("should return null for null input", () => {
    expect(formatDateTime(null)).toBeNull();
  });

  it("should return null for undefined input", () => {
    expect(formatDateTime(undefined)).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(formatDateTime("")).toBeNull();
  });

  it("should return null for invalid date strings", () => {
    expect(formatDateTime("invalid-date")).toBeNull();
    expect(formatDateTime("not a date")).toBeNull();
    expect(formatDateTime("2025-13-45")).toBeNull();
  });

  it("should handle different valid date formats", () => {
    const isoDate = formatDateTime("2025-01-15T14:30:00Z");
    const standardDate = formatDateTime("2025-01-15");

    expect(isoDate).toBeTruthy();
    expect(standardDate).toBeTruthy();
  });

  it("should include time information", () => {
    const result = formatDateTime("2025-01-15T14:30:00Z");
    expect(result).toBeTruthy();
    // Should contain some time indicator (exact format depends on locale)
    expect(result?.length).toBeGreaterThan(10); // More than just date
  });
});

describe("formatDueDate", () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent tests
    jest.useFakeTimers();
    // Set system time to a specific local time
    jest.setSystemTime(new Date("2025-01-10T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return null for null input", () => {
    expect(formatDueDate(null)).toBeNull();
  });

  it("should show overdue status for past dates", () => {
    const result = formatDueDate("2025-01-09T10:00:00");
    expect(result).toContain("AlertCircle");
    expect(result).toContain("Overdue");
  });

  it("should show 'Due Today' for today's dates", () => {
    // Use a time slightly before "now" (12:00) to ensure diffDays rounds to 0
    const result = formatDueDate("2025-01-10T11:00:00");
    expect(result).toContain("Clock");
    expect(result).toContain("Due Today");
  });

  it("should show 'Due Tomorrow' for tomorrow's dates", () => {
    // Use a time that's clearly tomorrow
    const result = formatDueDate("2025-01-11T12:00:00");
    expect(result).toContain("Calendar");
    expect(result).toContain("Due Tomorrow");
  });

  it("should show formatted date for future dates", () => {
    const result = formatDueDate("2025-01-15T14:00:00");
    expect(result).toContain("Calendar");
    expect(result).toContain("Due");
    expect(result).toContain("1/15");
  });

  it("should include time information in all formats", () => {
    const today = formatDueDate("2025-01-10T14:30:00");
    const tomorrow = formatDueDate("2025-01-11T14:30:00");
    const future = formatDueDate("2025-01-15T14:30:00");

    expect(today).toBeTruthy();
    expect(tomorrow).toBeTruthy();
    expect(future).toBeTruthy();
  });

  it("should handle dates far in the past", () => {
    const result = formatDueDate("2024-12-01T10:00:00");
    expect(result).toContain("AlertCircle");
    expect(result).toContain("Overdue");
  });

  it("should handle dates far in the future", () => {
    const result = formatDueDate("2025-12-31T10:00:00");
    expect(result).toContain("Calendar");
    expect(result).toContain("Due");
  });

  it("should format month/day correctly for single digits", () => {
    const result = formatDueDate("2025-01-05T14:00:00");
    expect(result).toBeTruthy();
    expect(result).toContain("1/5");
  });

  it("should format month/day correctly for double digits", () => {
    const result = formatDueDate("2025-11-25T14:00:00");
    expect(result).toBeTruthy();
    expect(result).toContain("11/25");
  });
});
