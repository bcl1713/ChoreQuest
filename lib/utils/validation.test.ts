import {
  validateRequired,
  validateLength,
  validateMaxLength,
  validateNumberRange,
  validateMinNumber,
  validateFutureDate,
  validateQuestTitle,
  validateQuestDescription,
  validateQuestReward,
  validateRewardName,
  validateRewardDescription,
  validateRewardCost,
  combineValidations,
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

describe("validateQuestTitle", () => {
  it("should accept valid quest titles", () => {
    expect(validateQuestTitle("Clean the kitchen").isValid).toBe(true);
    expect(validateQuestTitle("A").isValid).toBe(true);
    expect(validateQuestTitle("A".repeat(200)).isValid).toBe(true);
  });

  it("should reject empty quest titles", () => {
    const result = validateQuestTitle("");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Quest title is required");
  });

  it("should reject null quest titles", () => {
    const result = validateQuestTitle(null);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Quest title is required");
  });

  it("should reject quest titles exceeding 200 characters", () => {
    const result = validateQuestTitle("A".repeat(201));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Quest title must be between 1 and 200 characters");
  });
});

describe("validateQuestDescription", () => {
  it("should accept valid quest descriptions", () => {
    expect(validateQuestDescription("Wash dishes and wipe counters").isValid).toBe(true);
    expect(validateQuestDescription("A").isValid).toBe(true);
    expect(validateQuestDescription("A".repeat(1000)).isValid).toBe(true);
  });

  it("should reject empty quest descriptions", () => {
    const result = validateQuestDescription("");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Quest description is required");
  });

  it("should reject null quest descriptions", () => {
    const result = validateQuestDescription(null);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Quest description is required");
  });

  it("should reject quest descriptions exceeding 1000 characters", () => {
    const result = validateQuestDescription("A".repeat(1001));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Quest description must be between 1 and 1000 characters");
  });
});

describe("validateQuestReward", () => {
  it("should accept positive XP rewards", () => {
    expect(validateQuestReward(1, "XP").isValid).toBe(true);
    expect(validateQuestReward(50, "XP").isValid).toBe(true);
    expect(validateQuestReward(1000, "XP").isValid).toBe(true);
  });

  it("should accept positive Gold rewards", () => {
    expect(validateQuestReward(1, "Gold").isValid).toBe(true);
    expect(validateQuestReward(100, "Gold").isValid).toBe(true);
  });

  it("should reject zero XP rewards", () => {
    const result = validateQuestReward(0, "XP");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("XP reward must be at least 1");
  });

  it("should reject zero Gold rewards", () => {
    const result = validateQuestReward(0, "Gold");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Gold reward must be at least 1");
  });

  it("should reject negative rewards", () => {
    const resultXP = validateQuestReward(-5, "XP");
    const resultGold = validateQuestReward(-10, "Gold");

    expect(resultXP.isValid).toBe(false);
    expect(resultGold.isValid).toBe(false);
  });
});

describe("validateRewardName", () => {
  it("should accept valid reward names", () => {
    expect(validateRewardName("30 minutes of screen time").isValid).toBe(true);
    expect(validateRewardName("A").isValid).toBe(true);
    expect(validateRewardName("A".repeat(100)).isValid).toBe(true);
  });

  it("should reject empty reward names", () => {
    const result = validateRewardName("");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward name is required");
  });

  it("should reject null reward names", () => {
    const result = validateRewardName(null);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward name is required");
  });

  it("should reject reward names exceeding 100 characters", () => {
    const result = validateRewardName("A".repeat(101));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward name must be between 1 and 100 characters");
  });
});

describe("validateRewardDescription", () => {
  it("should accept valid reward descriptions", () => {
    expect(validateRewardDescription("Extra 30 minutes of gaming time").isValid).toBe(true);
    expect(validateRewardDescription("A").isValid).toBe(true);
    expect(validateRewardDescription("A".repeat(500)).isValid).toBe(true);
  });

  it("should reject empty reward descriptions", () => {
    const result = validateRewardDescription("");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward description is required");
  });

  it("should reject null reward descriptions", () => {
    const result = validateRewardDescription(null);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward description is required");
  });

  it("should reject reward descriptions exceeding 500 characters", () => {
    const result = validateRewardDescription("A".repeat(501));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward description must be between 1 and 500 characters");
  });
});

describe("validateRewardCost", () => {
  it("should accept positive costs", () => {
    expect(validateRewardCost(1).isValid).toBe(true);
    expect(validateRewardCost(100).isValid).toBe(true);
    expect(validateRewardCost(10000).isValid).toBe(true);
  });

  it("should reject zero cost", () => {
    const result = validateRewardCost(0);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward cost must be at least 1");
  });

  it("should reject negative costs", () => {
    const result = validateRewardCost(-50);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward cost must be at least 1");
  });
});

describe("combineValidations", () => {
  it("should return success when all validations pass", () => {
    const result = combineValidations([
      { isValid: true },
      { isValid: true },
      { isValid: true },
    ]);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return first error when validations fail", () => {
    const result = combineValidations([
      { isValid: true },
      { isValid: false, error: "First error" },
      { isValid: false, error: "Second error" },
    ]);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("First error");
  });

  it("should work with empty validation array", () => {
    const result = combineValidations([]);
    expect(result.isValid).toBe(true);
  });

  it("should work with single validation", () => {
    const passResult = combineValidations([{ isValid: true }]);
    expect(passResult.isValid).toBe(true);

    const failResult = combineValidations([{ isValid: false, error: "Error" }]);
    expect(failResult.isValid).toBe(false);
    expect(failResult.error).toBe("Error");
  });

  it("should combine multiple field validations", () => {
    const title = "Valid title";
    const description = ""; // Invalid

    const result = combineValidations([
      validateQuestTitle(title),
      validateQuestDescription(description),
    ]);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Quest description is required");
  });
});
