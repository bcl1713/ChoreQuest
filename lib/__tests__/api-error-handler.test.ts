import { handleRouteError } from "@/lib/api-error-handler";
import { ValidationError } from "@/lib/errors";

describe("handleRouteError", () => {
  it("returns standardized AppError payloads", async () => {
    const response = handleRouteError(
      new ValidationError("Bad request", "BAD_REQUEST"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Bad request",
      code: "BAD_REQUEST",
    });
  });

  it("includes validation details when present", async () => {
    const details = { fieldErrors: { name: ["Required"] } };
    const response = handleRouteError(
      new ValidationError("Bad request", "BAD_REQUEST", details),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Bad request",
      code: "BAD_REQUEST",
      details,
    });
  });

  it("returns a 500 payload for unknown errors", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = handleRouteError(new Error("Unexpected"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });

    consoleSpy.mockRestore();
  });
});
