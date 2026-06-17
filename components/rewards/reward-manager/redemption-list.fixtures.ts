import { RewardRedemptionWithUser } from "@/lib/reward-service";

export const createRedemptionHandlers = () => ({
  onApprove: jest.fn(),
  onDeny: jest.fn(),
  onFulfill: jest.fn(),
});

export const createMockRedemption = (
  id: string,
  status: "PENDING" | "APPROVED" | "DENIED" | "FULFILLED",
  overrides?: Partial<RewardRedemptionWithUser>,
): RewardRedemptionWithUser => ({
  id,
  user_id: "user-1",
  reward_id: "reward-1",
  reward_name: "Extra Screen Time",
  reward_description: "30 minutes extra",
  reward_type: "SCREEN_TIME",
  cost: 100,
  status,
  requested_at: new Date("2024-01-15T10:00:00Z").toISOString(),
  approved_at:
    status === "APPROVED" || status === "FULFILLED"
      ? new Date("2024-01-15T11:00:00Z").toISOString()
      : null,
  fulfilled_at:
    status === "FULFILLED"
      ? new Date("2024-01-15T12:00:00Z").toISOString()
      : null,
  approved_by: null,
  notes: null,
  user_profiles: {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    role: "YOUNG_HERO",
    family_id: "family-1",
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  ...overrides,
});
