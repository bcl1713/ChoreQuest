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
    expect(result.error).toBe(
      "Quest title must be between 1 and 200 characters",
    );
  });
});

describe("validateQuestDescription", () => {
  it("should accept valid quest descriptions", () => {
    expect(validateQuestDescription("Detailed description").isValid).toBe(true);
  });

  it("should reject empty descriptions", () => {
    expect(validateQuestDescription("").isValid).toBe(false);
    expect(validateQuestDescription(null).isValid).toBe(false);
    expect(validateQuestDescription(undefined).isValid).toBe(false);
  });

  it("should reject descriptions exceeding 1000 characters", () => {
    const result = validateQuestDescription("A".repeat(1001));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(
      "Quest description must be between 1 and 1000 characters",
    );
  });
});

describe("validateQuestReward", () => {
  it("should accept valid rewards", () => {
    expect(validateQuestReward(10, "XP").isValid).toBe(true);
    expect(validateQuestReward(100, "Gold").isValid).toBe(true);
  });

  it("should reject values below minimum", () => {
    expect(validateQuestReward(0, "XP").isValid).toBe(false);
    expect(validateQuestReward(-1, "Gold").isValid).toBe(false);
  });

  it("should reject XP below 1", () => {
    const result = validateQuestReward(0, "XP");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("XP reward must be at least 1");
  });

  it("should reject Gold below 1", () => {
    const result = validateQuestReward(0, "Gold");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Gold reward must be at least 1");
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
    expect(result.error).toBe(
      "Reward name must be between 1 and 100 characters",
    );
  });
});

describe("validateRewardDescription", () => {
  it("should accept valid descriptions", () => {
    expect(validateRewardDescription("A shiny new reward").isValid).toBe(true);
  });

  it("should reject empty descriptions", () => {
    expect(validateRewardDescription("").isValid).toBe(false);
    expect(validateRewardDescription(null).isValid).toBe(false);
    expect(validateRewardDescription(undefined).isValid).toBe(false);
  });

  it("should reject descriptions exceeding 500 characters", () => {
    const result = validateRewardDescription("A".repeat(501));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(
      "Reward description must be between 1 and 500 characters",
    );
  });
});

describe("validateRewardCost", () => {
  it("should accept valid costs", () => {
    expect(validateRewardCost(10).isValid).toBe(true);
    expect(validateRewardCost(1).isValid).toBe(true);
  });

  it("should reject zero cost", () => {
    const result = validateRewardCost(0);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward cost must be at least 1");
  });

  it("should reject negative costs", () => {
    const result = validateRewardCost(-1);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Reward cost must be at least 1");
  });

  it("should accept high costs (no upper limit enforced)", () => {
    const result = validateRewardCost(100001);
    expect(result.isValid).toBe(true);
  });
});

describe("combineValidations", () => {
  it("should return first error encountered", () => {
    const results = [
      { isValid: false as const, error: "First error" },
      { isValid: false as const, error: "Second error" },
    ];
    const result = combineValidations(results);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("First error");
  });

  it("should return success when all validations pass", () => {
    const results = [{ isValid: true as const }, { isValid: true as const }];
    const result = combineValidations(results);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
