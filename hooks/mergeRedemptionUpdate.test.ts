import { mergeRedemptionUpdate } from "./mergeRedemptionUpdate";
import type { RewardRedemptionWithUser } from "@/lib/reward-service";
import type { RewardRedemption } from "@/lib/types/database";

const baseUser = {
  id: "user-1",
  name: "Hero",
  family_id: "family-1",
  email: "hero@example.com",
  role: "CHILD" as const,
  created_at: "2024-01-01T00:00:00Z",
};

const makeRedemption = (
  overrides: Partial<RewardRedemptionWithUser> = {},
): RewardRedemptionWithUser => ({
  id: "r-1",
  user_id: "user-1",
  reward_id: "reward-1",
  reward_name: "Dragon Plush",
  reward_description: "A plush dragon",
  reward_type: "PURCHASE",
  cost: 200,
  status: "PENDING",
  requested_at: "2024-01-01T00:00:00Z",
  approved_at: null,
  approved_by: null,
  fulfilled_at: null,
  family_id: "family-1",
  notes: null,
  user_profiles: baseUser,
  ...overrides,
});

const makeUpdatedRow = (
  overrides: Partial<RewardRedemption> = {},
): RewardRedemption => ({
  id: "r-1",
  user_id: "user-1",
  reward_id: "reward-1",
  reward_name: "Dragon Plush",
  reward_description: "A plush dragon",
  reward_type: "PURCHASE",
  cost: 200,
  status: "APPROVED",
  requested_at: "2024-01-01T00:00:00Z",
  approved_at: "2024-01-02T00:00:00Z",
  approved_by: "admin-1",
  fulfilled_at: null,
  family_id: "family-1",
  notes: null,
  ...overrides,
});

describe("mergeRedemptionUpdate", () => {
  it("updates matching redemption scalar fields", () => {
    const redemptions = [makeRedemption()];
    const updated = makeUpdatedRow({
      status: "APPROVED",
      approved_at: "2024-01-02T00:00:00Z",
    });

    const result = mergeRedemptionUpdate(redemptions, updated);

    expect(result[0].status).toBe("APPROVED");
    expect(result[0].approved_at).toBe("2024-01-02T00:00:00Z");
  });

  it("preserves the user_profiles sub-object", () => {
    const redemptions = [makeRedemption()];
    const updated = makeUpdatedRow();

    const result = mergeRedemptionUpdate(redemptions, updated);

    expect(result[0].user_profiles).toEqual(baseUser);
  });

  it("does not modify non-matching redemptions", () => {
    const other = makeRedemption({ id: "r-2", reward_name: "Other Reward" });
    const redemptions = [makeRedemption(), other];
    const updated = makeUpdatedRow({ status: "DENIED" });

    const result = mergeRedemptionUpdate(redemptions, updated);

    expect(result[1].id).toBe("r-2");
    expect(result[1].status).toBe("PENDING");
  });

  it("is idempotent — applying the same update twice produces the same result", () => {
    const redemptions = [makeRedemption()];
    const updated = makeUpdatedRow({ status: "APPROVED" });

    const once = mergeRedemptionUpdate(redemptions, updated);
    const twice = mergeRedemptionUpdate(once, updated);

    expect(twice[0].status).toBe("APPROVED");
    expect(twice[0].user_profiles).toEqual(baseUser);
  });

  it("returns original array unchanged when ID not found", () => {
    const redemptions = [makeRedemption({ id: "r-99" })];
    const updated = makeUpdatedRow({ id: "r-1" });

    const result = mergeRedemptionUpdate(redemptions, updated);

    expect(result[0].id).toBe("r-99");
    expect(result[0].status).toBe("PENDING");
  });

  it("handles fulfilled status correctly", () => {
    const redemptions = [makeRedemption({ status: "APPROVED" })];
    const updated = makeUpdatedRow({
      status: "FULFILLED",
      fulfilled_at: "2024-01-03T00:00:00Z",
    });

    const result = mergeRedemptionUpdate(redemptions, updated);

    expect(result[0].status).toBe("FULFILLED");
    expect(result[0].fulfilled_at).toBe("2024-01-03T00:00:00Z");
  });
});
