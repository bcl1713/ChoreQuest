"use client";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PendingRedemptionList } from "../PendingRedemptionList";
import type { RewardRedemptionWithUser } from "@/lib/reward-service";

const buildRedemption = (overrides: Partial<RewardRedemptionWithUser> = {}): RewardRedemptionWithUser => ({
  id: "red-1",
  reward_id: "reward-1",
  user_id: "user-1",
  cost: 50,
  reward_name: "Extra Screen Time",
  reward_description: "30 minutes",
  reward_type: "SCREEN_TIME",
  status: "PENDING",
  requested_at: "2025-10-20T00:00:00Z",
  notes: null,
  user_profiles: {
    id: "user-1",
    name: "Hero",
    family_id: "family-1",
    email: "hero@example.com",
    role: "GUILD_MASTER",
    created_at: "2025-10-01T00:00:00Z",
    updated_at: "2025-10-01T00:00:00Z",
  } as RewardRedemptionWithUser["user_profiles"],
  ...overrides,
});

describe("PendingRedemptionList", () => {
  it("calls update handler with the selected status", async () => {
    const onUpdate = jest.fn();
    const redemption = buildRedemption();

    render(
      <PendingRedemptionList
        pendingRedemptions={[redemption]}
        onUpdate={onUpdate}
        updatingId={null}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /approve/i }));
    expect(onUpdate).toHaveBeenCalledWith(redemption, "APPROVED");

    await userEvent.click(screen.getByRole("button", { name: /deny/i }));
    expect(onUpdate).toHaveBeenCalledWith(redemption, "DENIED");
  });

  it("disables action buttons when an update is in flight", () => {
    const redemption = buildRedemption({ id: "red-2" });

    render(
      <PendingRedemptionList
        pendingRedemptions={[redemption]}
        onUpdate={jest.fn()}
        updatingId="red-2"
      />
    );

    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /deny/i })).toBeDisabled();
  });
});
