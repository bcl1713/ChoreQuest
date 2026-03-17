import { assertValidUuidParam } from "@/lib/api-route-params";
import { ValidationError } from "@/lib/errors";

describe("assertValidUuidParam", () => {
  it("accepts valid UUIDs", () => {
    expect(() =>
      assertValidUuidParam(
        "123e4567-e89b-12d3-a456-426614174000",
        "quest",
        "QUEST_ID_INVALID",
      ),
    ).not.toThrow();
  });

  it("rejects malformed UUIDs with a validation error", () => {
    expect(() =>
      assertValidUuidParam("not-a-uuid", "quest", "QUEST_ID_INVALID"),
    ).toThrow(
      new ValidationError("Invalid quest ID format", "QUEST_ID_INVALID"),
    );
  });
});
