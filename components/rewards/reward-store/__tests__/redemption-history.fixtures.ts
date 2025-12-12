import { RewardRedemptionWithUser } from "@/lib/reward-service";

export const createMockRedemption = (
  id: string,
  status: "PENDING" | "APPROVED" | "DENIED" | "FULFILLED",
  overrides?: Partial<RewardRedemptionWithUser>
): RewardRedemptionWithUser => ({
  id,
  user_id: "user-1",
  reward_id: "reward-1",
  reward_name: "Dragon Plush",
  reward_description: "A plush dragon",
  reward_type: "PURCHASE",
  cost: 200,
  status,
  requested_at: new Date("2024-01-01T10:00:00Z").toISOString(),
  approved_at:
    status === "APPROVED" || status === "FULFILLED"
      ? new Date("2024-01-02T10:00:00Z").toISOString()
      : null,
  fulfilled_at: status === "FULFILLED" ? new Date("2024-01-03T10:00:00Z").toISOString() : null,
  notes: overrides?.notes ?? null,
  user_profiles: {
    id: "user-1",
    name: "Test Hero",
    email: "hero@example.com",
    role: "CHILD",
    family_id: "family-1",
    created_at: new Date().toISOString(),
  },
  ...overrides,
});

export const createRedemptionHandlers = () => ({
  onApprove: jest.fn(),
  onDeny: jest.fn(),
  onFulfill: jest.fn(),
});
