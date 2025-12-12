export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

export const validateRequired = (value: string | null | undefined, fieldName?: string): ValidationResult => {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: fieldName ? `${fieldName} is required` : "This field is required" };
  }
  return { isValid: true };
};

export const validateLength = (
  value: string,
  min: number,
  max: number,
  fieldName?: string
): ValidationResult => {
  const length = value.trim().length;
  const prefix = fieldName ?? "This field";

  if (length < min || length > max) {
    return { isValid: false, error: `${prefix} must be between ${min} and ${max} characters` };
  }
  return { isValid: true };
};

export const validateMaxLength = (value: string, max: number, fieldName?: string): ValidationResult => {
  const length = value.trim().length;
  const prefix = fieldName ?? "This field";

  if (length > max) {
    return { isValid: false, error: `${prefix} must not exceed ${max} characters` };
  }
  return { isValid: true };
};

export const validateNumberRange = (
  value: number,
  min: number,
  max: number,
  fieldName?: string
): ValidationResult => {
  const prefix = fieldName ?? "This field";

  if (value < min || value > max) {
    return { isValid: false, error: `${prefix} must be between ${min} and ${max}` };
  }
  return { isValid: true };
};

export const validateMinNumber = (value: number, min: number, fieldName?: string): ValidationResult => {
  const prefix = fieldName ?? "This field";

  if (value < min) {
    return { isValid: false, error: `${prefix} must be at least ${min}` };
  }
  return { isValid: true };
};
