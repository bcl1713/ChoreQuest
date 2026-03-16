export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication failed", code = "AUTH_ERROR") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ValidationError extends AppError {
  readonly details?: unknown;

  constructor(
    message = "Validation failed",
    code = "VALIDATION_ERROR",
    details?: unknown,
  ) {
    super(message, 400, code);
    this.details = details;
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", code = "CONFLICT") {
    super(message, 409, code);
  }
}
