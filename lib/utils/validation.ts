import {
  validateLength,
  validateMinNumber,
  validateRequired,
  type ValidationResult,
} from "./validation-core";

/**
 * Validates that a date is in the future.
 *
 * @param dateString - ISO date string to validate
 * @param fieldName - Name of the field for error message (optional)
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateFutureDate("2099-12-31T10:00:00Z") // { isValid: true }
 * validateFutureDate("2020-01-01T10:00:00Z") // { isValid: false, error: "Must be in the future" }
 * validateFutureDate("2020-01-01", "Due date") // { isValid: false, error: "Due date must be in the future" }
 * ```
 */
export const validateFutureDate = (
  dateString: string | null | undefined,
  fieldName?: string
): ValidationResult => {
  if (!dateString) {
    return { isValid: true }; // Null/undefined dates are considered optional
  }

  const selectedDate = new Date(dateString);
  const now = new Date();
  const prefix = fieldName ?? "This field";

  if (Number.isNaN(selectedDate.getTime())) {
    return {
      isValid: false,
      error: `${prefix} must be a valid date`,
    };
  }

  if (selectedDate <= now) {
    return {
      isValid: false,
      error: `${prefix} must be in the future`,
    };
  }

  return { isValid: true };
};

/**
 * Validates quest title field.
 * Title must be 1-200 characters and not empty.
 *
 * @param title - The quest title to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateQuestTitle("Clean the kitchen") // { isValid: true }
 * validateQuestTitle("") // { isValid: false, error: "Quest title is required" }
 * validateQuestTitle("A".repeat(201)) // { isValid: false, error: "Quest title must be between 1 and 200 characters" }
 * ```
 */
export const validateQuestTitle = (title: string | null | undefined): ValidationResult => {
  const requiredCheck = validateRequired(title, "Quest title");
  if (!requiredCheck.isValid) {
    return requiredCheck;
  }

  return validateLength(title!, 1, 200, "Quest title");
};

/**
 * Validates quest description field.
 * Description must be 1-1000 characters and not empty.
 *
 * @param description - The quest description to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateQuestDescription("Wash dishes and wipe counters") // { isValid: true }
 * validateQuestDescription("") // { isValid: false, error: "Quest description is required" }
 * validateQuestDescription("A".repeat(1001)) // { isValid: false, error: "Quest description must be between 1 and 1000 characters" }
 * ```
 */
export const validateQuestDescription = (
  description: string | null | undefined
): ValidationResult => {
  const requiredCheck = validateRequired(description, "Quest description");
  if (!requiredCheck.isValid) {
    return requiredCheck;
  }

  return validateLength(description!, 1, 1000, "Quest description");
};

/**
 * Validates quest reward values (XP and Gold).
 * Rewards must be positive integers.
 *
 * @param value - The reward value to validate
 * @param rewardType - Type of reward ("XP" or "Gold")
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateQuestReward(50, "XP") // { isValid: true }
 * validateQuestReward(0, "Gold") // { isValid: false, error: "Gold reward must be at least 1" }
 * validateQuestReward(-5, "XP") // { isValid: false, error: "XP reward must be at least 1" }
 * ```
 */
export const validateQuestReward = (
  value: number,
  rewardType: "XP" | "Gold"
): ValidationResult => {
  return validateMinNumber(value, 1, `${rewardType} reward`);
};

/**
 * Validates reward name field.
 * Name must be 1-100 characters and not empty.
 *
 * @param name - The reward name to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateRewardName("30 minutes of screen time") // { isValid: true }
 * validateRewardName("") // { isValid: false, error: "Reward name is required" }
 * validateRewardName("A".repeat(101)) // { isValid: false, error: "Reward name must be between 1 and 100 characters" }
 * ```
 */
export const validateRewardName = (name: string | null | undefined): ValidationResult => {
  const requiredCheck = validateRequired(name, "Reward name");
  if (!requiredCheck.isValid) {
    return requiredCheck;
  }

  return validateLength(name!, 1, 100, "Reward name");
};

/**
 * Validates reward description field.
 * Description must be 1-500 characters and not empty.
 *
 * @param description - The reward description to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateRewardDescription("Extra 30 minutes of gaming time") // { isValid: true }
 * validateRewardDescription("") // { isValid: false, error: "Reward description is required" }
 * validateRewardDescription("A".repeat(501)) // { isValid: false, error: "Reward description must be between 1 and 500 characters" }
 * ```
 */
export const validateRewardDescription = (
  description: string | null | undefined
): ValidationResult => {
  const requiredCheck = validateRequired(description, "Reward description");
  if (!requiredCheck.isValid) {
    return requiredCheck;
  }

  return validateLength(description!, 1, 500, "Reward description");
};

/**
 * Validates reward cost field.
 * Cost must be at least 1 gold.
 *
 * @param cost - The reward cost to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateRewardCost(100) // { isValid: true }
 * validateRewardCost(0) // { isValid: false, error: "Reward cost must be at least 1" }
 * validateRewardCost(-50) // { isValid: false, error: "Reward cost must be at least 1" }
 * ```
 */
export const validateRewardCost = (cost: number): ValidationResult => {
  return validateMinNumber(cost, 1, "Reward cost");
};

/**
 * Combines multiple validation results.
 * Returns the first error encountered, or success if all validations pass.
 *
 * @param results - Array of validation results to combine
 * @returns Combined validation result
 *
 * @example
 * ```ts
 * combineValidations([
 *   validateRequired("Hello"),
 *   validateLength("Hello", 1, 10)
 * ]) // { isValid: true }
 *
 * combineValidations([
 *   validateRequired(""),
 *   validateLength("Hello", 1, 10)
 * ]) // { isValid: false, error: "This field is required" }
 * ```
 */
export const combineValidations = (results: ValidationResult[]): ValidationResult => {
  for (const result of results) {
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
};
