import { Page, expect } from "@playwright/test";

/**
 * Reward Helper Functions for E2E Tests
 *
 * This module provides reusable reward creation, redemption, and management helpers
 * to reduce code duplication across E2E tests.
 */

export interface RewardData {
  name: string;
  description: string;
  type?: "SCREEN_TIME" | "EXPERIENCE" | "PURCHASE" | "PRIVILEGE";
  cost: number;
}

/**
 * Creates a reward with the specified data
 *
 * Assumes user is on a page with access to Reward Management. Opens the reward
 * creation modal, fills in the form, and submits it.
 *
 * @param page - Playwright page object
 * @param rewardData - Reward details (name, description, type, cost)
 *
 * @example
 * ```typescript
 * await createReward(page, {
 *   name: "Extra Screen Time",
 *   description: "30 minutes of bonus screen time",
 *   type: "SCREEN_TIME",
 *   cost: 100
 * });
 * ```
 */
export async function createReward(
  page: Page,
  rewardData: RewardData,
): Promise<void> {
  const { name, description, type = "SCREEN_TIME", cost } = rewardData;

  // Click Create Reward button
  await page.click('[data-testid="create-reward-button"]');
  await expect(page.getByTestId("create-reward-modal")).toBeVisible();

  // Fill in reward details
  await page.fill('[data-testid="reward-name-input"]', name);
  await page.fill('[data-testid="reward-description-input"]', description);
  await page.selectOption('[data-testid="reward-type-select"]', type);
  await page.fill('[data-testid="reward-cost-input"]', cost.toString());

  // Save the reward
  await page.click('[data-testid="save-reward-button"]');

  // Wait for modal to close
  await expect(page.getByTestId("create-reward-modal")).not.toBeVisible();

  // Verify the reward appears in the list
  const newRewardCard = page.locator('[data-testid^="reward-card-"]').filter({
    hasText: name,
  });
  await expect(newRewardCard).toBeVisible();
}

/**
 * Redeems a reward from the reward store
 *
 * Assumes user is on the Reward Store page with sufficient gold.
 * Finds the reward by name and clicks the redeem button.
 *
 * @param page - Playwright page object
 * @param rewardName - The name of the reward to redeem (optional, defaults to first "Redeem Reward" button)
 *
 * @example
 * ```typescript
 * // Navigate to reward store first
 * await page.click('button:has-text("🏪 Reward Store")');
 * await redeemReward(page, "Extra Screen Time");
 * ```
 */
export async function redeemReward(
  page: Page,
  rewardName?: string,
): Promise<void> {
  if (rewardName) {
    // Find the specific reward and click its redeem button
    await page.getByText(rewardName).click();
    await page.getByRole("button", { name: /redeem/i }).click();
  } else {
    // Click first "Redeem Reward" button
    await page.click('button:has-text("Redeem Reward")');
  }

  // Wait for redemption to process
  await page.waitForLoadState("networkidle");
}

/**
 * Approves a pending reward redemption (Guild Master action)
 *
 * Assumes user is on the Reward Management page with pending redemptions visible.
 * Clicks the approve button for the first (or specified) pending redemption.
 *
 * @param page - Playwright page object
 * @param rewardName - Optional reward name to target specific redemption
 *
 * @example
 * ```typescript
 * // Navigate to Reward Management first
 * await page.click('button:has-text("⚙️ Reward Management")');
 * await approveRewardRedemption(page);
 * ```
 */
export async function approveRewardRedemption(
  page: Page,
  rewardName?: string,
): Promise<void> {
  if (rewardName) {
    const redemptionItem = page
      .locator('[data-testid="pending-redemption-item"]')
      .filter({ hasText: rewardName });
    await redemptionItem
      .locator('[data-testid="approve-redemption-button"]')
      .click();
  } else {
    await page.click('[data-testid="approve-redemption-button"]');
  }

  // Wait for approval to process
  await page.waitForLoadState("networkidle");

  // Verify it moved from pending
  await expect(
    page.locator('[data-testid="pending-redemption-item"]'),
  ).toHaveCount(0);
}

/**
 * Denies a pending reward redemption (Guild Master action)
 *
 * Assumes user is on the Reward Management page with pending redemptions visible.
 * Clicks the deny button and refunds gold to the hero.
 *
 * @param page - Playwright page object
 * @param rewardName - Optional reward name to target specific redemption
 *
 * @example
 * ```typescript
 * await page.click('button:has-text("⚙️ Reward Management")');
 * await denyRewardRedemption(page);
 * ```
 */
export async function denyRewardRedemption(
  page: Page,
  rewardName?: string,
): Promise<void> {
  if (rewardName) {
    const redemptionItem = page
      .locator('[data-testid="pending-redemption-item"]')
      .filter({ hasText: rewardName });
    await redemptionItem
      .locator('[data-testid="deny-redemption-button"]')
      .click();
  } else {
    await page.click('[data-testid="deny-redemption-button"]');
  }

  // Wait for denial to process
  await page.waitForLoadState("networkidle");

  // Verify it was removed from pending
  await expect(
    page.locator('[data-testid="pending-redemption-item"]'),
  ).toHaveCount(0);
}

/**
 * Marks an approved redemption as fulfilled (Guild Master action)
 *
 * Assumes user is on the Reward Management page with approved redemptions visible.
 * Moves the redemption to history.
 *
 * @param page - Playwright page object
 * @param rewardName - Optional reward name to target specific redemption
 *
 * @example
 * ```typescript
 * await page.click('button:has-text("⚙️ Reward Management")');
 * await markRedemptionFulfilled(page, "Extra Screen Time");
 * ```
 */
export async function markRedemptionFulfilled(
  page: Page,
  rewardName?: string,
): Promise<void> {
  if (rewardName) {
    const approvedItem = page
      .locator('[data-testid="approved-redemption-item"]')
      .filter({ hasText: rewardName });
    await approvedItem
      .locator('[data-testid="fulfill-redemption-button"]')
      .click();
  } else {
    await page.click('[data-testid="fulfill-redemption-button"]');
  }

  // Wait for fulfillment to process
  await page.waitForLoadState("networkidle");

  // Verify it appears in redemption history
  await expect(
    page.locator('h3:has-text("Redemption History")'),
  ).toBeVisible();
}

/**
 * Toggles a reward's active/inactive status (Guild Master action)
 *
 * Assumes user is on the Reward Management page. Inactive rewards are not
 * visible in the hero's reward store.
 *
 * @param page - Playwright page object
 * @param rewardName - The name of the reward to toggle
 *
 * @example
 * ```typescript
 * await page.click('text=Reward Management');
 * await toggleRewardActive(page, "Pizza Party");
 * ```
 */
export async function toggleRewardActive(
  page: Page,
  rewardName: string,
): Promise<void> {
  const rewardCard = page.locator('[data-testid^="reward-card-"]').filter({
    hasText: rewardName,
  });

  await expect(rewardCard).toBeVisible();
  await rewardCard.locator('[data-testid="toggle-reward-active"]').click();

  // Wait for toggle to process
  await page.waitForLoadState("networkidle");
}

/**
 * Deletes a reward (Guild Master action)
 *
 * Assumes user is on the Reward Management page. Clicks delete and confirms
 * the deletion in the confirmation modal.
 *
 * @param page - Playwright page object
 * @param rewardName - The name of the reward to delete
 *
 * @example
 * ```typescript
 * await page.click('text=Reward Management');
 * await deleteReward(page, "Old Reward");
 * ```
 */
export async function deleteReward(
  page: Page,
  rewardName: string,
): Promise<void> {
  const rewardCard = page.locator('[data-testid^="reward-card-"]').filter({
    hasText: rewardName,
  });

  await expect(rewardCard).toBeVisible();
  await rewardCard.locator('[data-testid="delete-reward-button"]').click();

  // Confirm deletion in modal (if there's a confirmation)
  const confirmButton = page.getByTestId("confirm-delete-button");
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.click();
  }

  // Wait for deletion to process
  await page.waitForLoadState("networkidle");

  // Verify the reward is no longer visible
  await expect(rewardCard).not.toBeVisible();
}

/**
 * Edits an existing reward (Guild Master action)
 *
 * Assumes user is on the Reward Management page. Opens the edit modal,
 * updates the specified fields, and saves.
 *
 * @param page - Playwright page object
 * @param rewardName - The current name of the reward to edit
 * @param updates - Partial reward data with fields to update
 *
 * @example
 * ```typescript
 * await page.click('text=Reward Management');
 * await editReward(page, "Movie Night", {
 *   name: "Family Movie Night",
 *   cost: 150
 * });
 * ```
 */
export async function editReward(
  page: Page,
  rewardName: string,
  updates: Partial<RewardData>,
): Promise<void> {
  const rewardCard = page.locator('[data-testid^="reward-card-"]').filter({
    hasText: rewardName,
  });

  await expect(rewardCard).toBeVisible();
  await rewardCard.locator('[data-testid="edit-reward-button"]').click();

  await expect(page.getByTestId("edit-reward-modal")).toBeVisible();

  // Update fields if provided
  if (updates.name !== undefined) {
    await page.fill('[data-testid="reward-name-input"]', updates.name);
  }
  if (updates.description !== undefined) {
    await page.fill(
      '[data-testid="reward-description-input"]',
      updates.description,
    );
  }
  if (updates.type !== undefined) {
    await page.selectOption('[data-testid="reward-type-select"]', updates.type);
  }
  if (updates.cost !== undefined) {
    await page.fill(
      '[data-testid="reward-cost-input"]',
      updates.cost.toString(),
    );
  }

  // Save changes
  await page.click('[data-testid="save-reward-button"]');
  await expect(page.getByTestId("edit-reward-modal")).not.toBeVisible();

  // Verify updated reward appears
  const updatedName = updates.name ?? rewardName;
  const updatedRewardCard = page.locator('[data-testid^="reward-card-"]').filter({
    hasText: updatedName,
  });
  await expect(updatedRewardCard).toBeVisible();
}
