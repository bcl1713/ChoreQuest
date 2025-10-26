/**
 * Form validation utilities for quest and reward forms.
 * Provides reusable validation functions with consistent error messages.
 */

/**
 * Validation result containing success status and optional error message.
 */
export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

/**
 * Validates that a string is not empty or only whitespace.
 *
 * @param value - The string to validate
 * @param fieldName - Name of the field for error message (optional)
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateRequired("Hello") // { isValid: true }
 * validateRequired("   ") // { isValid: false, error: "This field is required" }
 * validateRequired("", "Title") // { isValid: false, error: "Title is required" }
 * ```
 */
export const validateRequired = (
  value: string | null | undefined,
  fieldName?: string
): ValidationResult => {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: fieldName ? `${fieldName} is required` : "This field is required",
    };
  }
  return { isValid: true };
};

/**
 * Validates that a string length is within specified bounds.
 *
 * @param value - The string to validate
 * @param min - Minimum length (inclusive)
 * @param max - Maximum length (inclusive)
 * @param fieldName - Name of the field for error message (optional)
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateLength("Hello", 3, 10) // { isValid: true }
 * validateLength("Hi", 3, 10) // { isValid: false, error: "Must be between 3 and 10 characters" }
 * validateLength("Very long text...", 3, 10, "Title") // { isValid: false, error: "Title must be between 3 and 10 characters" }
 * ```
 */
export const validateLength = (
  value: string,
  min: number,
  max: number,
  fieldName?: string
): ValidationResult => {
  const length = value.trim().length;
  const prefix = fieldName ?? "This field";

  if (length < min || length > max) {
    return {
      isValid: false,
      error: `${prefix} must be between ${min} and ${max} characters`,
    };
  }
  return { isValid: true };
};

/**
 * Validates that a string does not exceed a maximum length.
 *
 * @param value - The string to validate
 * @param max - Maximum length (inclusive)
 * @param fieldName - Name of the field for error message (optional)
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateMaxLength("Hello", 10) // { isValid: true }
 * validateMaxLength("Very long text", 5) // { isValid: false, error: "Must not exceed 5 characters" }
 * ```
 */
export const validateMaxLength = (
  value: string,
  max: number,
  fieldName?: string
): ValidationResult => {
  const length = value.trim().length;
  const prefix = fieldName ?? "This field";

  if (length > max) {
    return {
      isValid: false,
      error: `${prefix} must not exceed ${max} characters`,
    };
  }
  return { isValid: true };
};

/**
 * Validates that a number is within specified bounds.
 *
 * @param value - The number to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param fieldName - Name of the field for error message (optional)
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateNumberRange(5, 1, 10) // { isValid: true }
 * validateNumberRange(0, 1, 10) // { isValid: false, error: "Must be between 1 and 10" }
 * validateNumberRange(15, 1, 10, "Cost") // { isValid: false, error: "Cost must be between 1 and 10" }
 * ```
 */
export const validateNumberRange = (
  value: number,
  min: number,
  max: number,
  fieldName?: string
): ValidationResult => {
  const prefix = fieldName ?? "This field";

  if (value < min || value > max) {
    return {
      isValid: false,
      error: `${prefix} must be between ${min} and ${max}`,
    };
  }
  return { isValid: true };
};

/**
 * Validates that a number is greater than or equal to a minimum value.
 *
 * @param value - The number to validate
 * @param min - Minimum value (inclusive)
 * @param fieldName - Name of the field for error message (optional)
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * validateMinNumber(5, 1) // { isValid: true }
 * validateMinNumber(0, 1) // { isValid: false, error: "Must be at least 1" }
 * validateMinNumber(0, 1, "Gold reward") // { isValid: false, error: "Gold reward must be at least 1" }
 * ```
 */
export const validateMinNumber = (
  value: number,
  min: number,
  fieldName?: string
): ValidationResult => {
  const prefix = fieldName ?? "This field";

  if (value < min) {
    return {
      isValid: false,
      error: `${prefix} must be at least ${min}`,
    };
  }
  return { isValid: true };
};

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
