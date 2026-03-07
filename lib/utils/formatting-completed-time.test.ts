import { formatCompletedTime } from "./formatting";

describe("formatCompletedTime", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-15T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return null for null input", () => {
    expect(formatCompletedTime(null)).toBeNull();
  });

  it("should return null for undefined input", () => {
    expect(formatCompletedTime(undefined)).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(formatCompletedTime("")).toBeNull();
  });

  it("should return null for invalid date string", () => {
    expect(formatCompletedTime("not-a-date")).toBeNull();
  });

  it("should return '1 minute ago' for very recent times", () => {
    expect(formatCompletedTime("2025-01-15T12:00:00")).toBe("1 minute ago");
    expect(formatCompletedTime("2025-01-15T11:59:50")).toBe("1 minute ago");
  });

  it("should return minutes ago for times under 1 hour", () => {
    expect(formatCompletedTime("2025-01-15T11:55:00")).toBe("5 minutes ago");
    expect(formatCompletedTime("2025-01-15T11:30:00")).toBe("30 minutes ago");
    expect(formatCompletedTime("2025-01-15T11:01:00")).toBe("59 minutes ago");
  });

  it("should return '1 minute ago' singular", () => {
    expect(formatCompletedTime("2025-01-15T11:59:00")).toBe("1 minute ago");
  });

  it("should return hours ago for times under 24 hours", () => {
    expect(formatCompletedTime("2025-01-15T11:00:00")).toBe("1 hour ago");
    expect(formatCompletedTime("2025-01-15T06:00:00")).toBe("6 hours ago");
    expect(formatCompletedTime("2025-01-14T13:00:00")).toBe("23 hours ago");
  });

  it("should return 'yesterday at' for times 24-47 hours ago", () => {
    const result = formatCompletedTime("2025-01-14T12:00:00");
    expect(result).toContain("yesterday at");
  });

  it("should return date and time for times 48+ hours ago", () => {
    const result = formatCompletedTime("2025-01-13T10:30:00");
    expect(result).toContain("Jan");
    expect(result).toContain("13");
    expect(result).toContain("at");
  });

  it("should return date for times many days ago", () => {
    const result = formatCompletedTime("2025-01-05T09:00:00");
    expect(result).toContain("Jan");
    expect(result).toContain("5");
    expect(result).toContain("at");
  });
});
