import {
  AppError,
  AuthError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";

describe("errors", () => {
  it("creates AppError with statusCode and code", () => {
    const error = new AppError("Boom", 418, "TEAPOT");

    expect(error.message).toBe("Boom");
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe("TEAPOT");
    expect(error).toBeInstanceOf(Error);
  });

  it.each([
    [AuthError, 401, "AUTH_ERROR"],
    [ForbiddenError, 403, "FORBIDDEN"],
    [NotFoundError, 404, "NOT_FOUND"],
    [ValidationError, 400, "VALIDATION_ERROR"],
    [ConflictError, 409, "CONFLICT"],
  ])(
    "creates %p with the expected defaults",
    (Ctor, expectedStatus, expectedCode) => {
      const error = new Ctor();

      expect(error.statusCode).toBe(expectedStatus);
      expect(error.code).toBe(expectedCode);
      expect(error).toBeInstanceOf(AppError);
    },
  );

  it("stores validation details when provided", () => {
    const details = { fieldErrors: { name: ["Required"] } };
    const error = new ValidationError(
      "Invalid payload",
      "VALIDATION_ERROR",
      details,
    );

    expect(error.details).toEqual(details);
  });
});
