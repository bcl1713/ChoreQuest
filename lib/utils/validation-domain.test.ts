import {
  validateQuestTitle,
  validateQuestDescription,
  validateQuestReward,
  validateRewardName,
  validateRewardDescription,
  validateRewardCost,
  combineValidations,
} from "./validation";

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
    expect(validateQuestDescription("Detailed description").isValid).toBe(true);
  });

  it("should accept empty descriptions (optional)", () => {
    expect(validateQuestDescription("").isValid).toBe(true);
    expect(validateQuestDescription(null).isValid).toBe(true);
    expect(validateQuestDescription(undefined).isValid).toBe(true);
  });

  it("should reject descriptions exceeding 1000 characters", () => {
    const result = validateQuestDescription("A".repeat(1001));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Quest description must not exceed 1000 characters");
  });
});

describe("validateQuestReward", () => {
  it("should accept valid rewards", () => {
    expect(validateQuestReward(10, 100).isValid).toBe(true);
  });

  it("should reject negative XP or gold", () => {
    expect(validateQuestReward(-1, 10).isValid).toBe(false);
    expect(validateQuestReward(10, -1).isValid).toBe(false);
  });

  it("should reject XP over 1000", () => {
    const result = validateQuestReward(1001, 100);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("XP reward must be between 0 and 1000");
  });

  it("should reject gold over 10000", () => {
    const result = validateQuestReward(100, 10001);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Gold reward must be between 0 and 10000");
  });
});

describe("validateRewardName", () => {
  it("should accept valid reward names", () => {
    expect(validateRewardName("Magic Sword").isValid).toBe(true);
  });

  it("should reject empty reward names", () => {
    const result = validateRewardName("");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward name is required");
  });

  it("should reject names exceeding 100 characters", () => {
    const result = validateRewardName("A".repeat(101));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward name must be between 1 and 100 characters");
  });
});

describe("validateRewardDescription", () => {
  it("should accept valid descriptions", () => {
    expect(validateRewardDescription("A shiny new reward").isValid).toBe(true);
  });

  it("should accept empty descriptions", () => {
    expect(validateRewardDescription("").isValid).toBe(true);
    expect(validateRewardDescription(null).isValid).toBe(true);
    expect(validateRewardDescription(undefined).isValid).toBe(true);
  });

  it("should reject descriptions exceeding 500 characters", () => {
    const result = validateRewardDescription("A".repeat(501));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward description must not exceed 500 characters");
  });
});

describe("validateRewardCost", () => {
  it("should accept valid costs", () => {
    expect(validateRewardCost(10).isValid).toBe(true);
    expect(validateRewardCost(0).isValid).toBe(true);
  });

  it("should reject negative costs", () => {
    const result = validateRewardCost(-1);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward cost must be at least 0");
  });

  it("should reject excessively high costs", () => {
    const result = validateRewardCost(100001);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward cost must be 100000 or less");
  });
});

describe("combineValidations", () => {
  it("should return first error encountered", () => {
    const validators = [
      () => ({ isValid: false, error: "First error" }),
      () => ({ isValid: false, error: "Second error" }),
    ];
    const result = combineValidations(validators);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("First error");
  });

  it("should return success when all validations pass", () => {
    const validators = [
      () => ({ isValid: true }),
      () => ({ isValid: true }),
    ];
    const result = combineValidations(validators);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
