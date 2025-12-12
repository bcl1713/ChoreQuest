import {
  validateRequired,
  validateLength,
  validateMaxLength,
  validateNumberRange,
  validateMinNumber,
  validateFutureDate,
} from "./validation";

describe("validateRequired", () => {
  it("should accept non-empty strings", () => {
    expect(validateRequired("Hello").isValid).toBe(true);
    expect(validateRequired("A").isValid).toBe(true);
  });

  it("should reject empty strings", () => {
    const result = validateRequired("");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("This field is required");
  });

  it("should reject whitespace-only strings", () => {
    const result = validateRequired("   ");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("This field is required");
  });

  it("should reject null values", () => {
    const result = validateRequired(null);
    expect(result.isValid).toBe(false);
  });

  it("should reject undefined values", () => {
    const result = validateRequired(undefined);
    expect(result.isValid).toBe(false);
  });

  it("should include field name in error message when provided", () => {
    const result = validateRequired("", "Title");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Title is required");
  });
});

describe("validateLength", () => {
  it("should accept strings within length bounds", () => {
    expect(validateLength("Hello", 3, 10).isValid).toBe(true);
    expect(validateLength("Hi!", 3, 10).isValid).toBe(true);
    expect(validateLength("1234567890", 3, 10).isValid).toBe(true);
  });

  it("should reject strings too short", () => {
    const result = validateLength("Hi", 3, 10);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("This field must be between 3 and 10 characters");
  });

  it("should reject strings too long", () => {
    const result = validateLength("This is too long", 3, 10);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("This field must be between 3 and 10 characters");
  });

  it("should trim whitespace before checking length", () => {
    expect(validateLength("  Hi  ", 2, 5).isValid).toBe(true);
    expect(validateLength("  H  ", 2, 5).isValid).toBe(false);
  });

  it("should include field name in error message when provided", () => {
    const result = validateLength("Hi", 3, 10, "Title");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Title must be between 3 and 10 characters");
  });
});

describe("validateMaxLength", () => {
  it("should accept strings within max length", () => {
    expect(validateMaxLength("Hello", 10).isValid).toBe(true);
    expect(validateMaxLength("Hi", 10).isValid).toBe(true);
    expect(validateMaxLength("", 10).isValid).toBe(true);
  });

  it("should reject strings exceeding max length", () => {
    const result = validateMaxLength("This is too long", 5);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("This field must not exceed 5 characters");
  });

  it("should trim whitespace before checking length", () => {
    expect(validateMaxLength("  Hello  ", 5).isValid).toBe(true);
    expect(validateMaxLength("  Hello  ", 4).isValid).toBe(false);
  });

  it("should include field name in error message when provided", () => {
    const result = validateMaxLength("Too long text", 5, "Description");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Description must not exceed 5 characters");
  });
});

describe("validateNumberRange", () => {
  it("should accept numbers within range", () => {
    expect(validateNumberRange(5, 1, 10).isValid).toBe(true);
    expect(validateNumberRange(1, 1, 10).isValid).toBe(true);
    expect(validateNumberRange(10, 1, 10).isValid).toBe(true);
  });

  it("should reject numbers below minimum", () => {
    const result = validateNumberRange(0, 1, 10);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("This field must be between 1 and 10");
  });

  it("should reject numbers above maximum", () => {
    const result = validateNumberRange(15, 1, 10);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("This field must be between 1 and 10");
  });

  it("should include field name in error message when provided", () => {
    const result = validateNumberRange(0, 1, 10, "Cost");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Cost must be between 1 and 10");
  });
});

describe("validateMinNumber", () => {
  it("should accept numbers at or above minimum", () => {
    expect(validateMinNumber(5, 1).isValid).toBe(true);
    expect(validateMinNumber(1, 1).isValid).toBe(true);
    expect(validateMinNumber(100, 1).isValid).toBe(true);
  });

  it("should reject numbers below minimum", () => {
    const result = validateMinNumber(0, 1);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("This field must be at least 1");
  });

  it("should include field name in error message when provided", () => {
    const result = validateMinNumber(0, 1, "Gold reward");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Gold reward must be at least 1");
  });
});

describe("validateFutureDate", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-10T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should accept future dates", () => {
    expect(validateFutureDate("2025-12-31T10:00:00").isValid).toBe(true);
    expect(validateFutureDate("2025-01-11T10:00:00").isValid).toBe(true);
  });

  it("should reject past dates", () => {
    const result = validateFutureDate("2024-01-01T10:00:00");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("This field must be in the future");
  });

  it("should reject current time (not in future)", () => {
    const result = validateFutureDate("2025-01-10T12:00:00");
    expect(result.isValid).toBe(false);
  });

  it("should accept null dates (optional)", () => {
    expect(validateFutureDate(null).isValid).toBe(true);
  });

  it("should accept undefined dates (optional)", () => {
    expect(validateFutureDate(undefined).isValid).toBe(true);
  });

  it("should reject invalid date strings", () => {
    const result = validateFutureDate("invalid-date");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("This field must be a valid date");
  });

  it("should include field name in error message when provided", () => {
    const result = validateFutureDate("2024-01-01", "Due date");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Due date must be in the future");
  });
});
