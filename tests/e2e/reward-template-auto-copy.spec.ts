/**
 * E2E tests for Reward Template Auto-Copy System
 * Verifies that template rewards are automatically copied to new families
 *
 * Note: These tests use the worker family which gets template rewards automatically
 * when created. Tests verify that template rewards exist and can be used.
 */

import { test, expect } from "./helpers/family-fixture";
import { navigateToHeroTab } from "./helpers/navigation-helpers";

test.describe("Reward Template Auto-Copy", () => {
  test("new family should automatically receive template rewards", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    // Navigate to Reward Management to see all rewards (including inactive)
    await navigateToHeroTab(gmPage, "Reward Management");

    // Wait for page to load
    await expect(gmPage.getByTestId("reward-manager")).toBeVisible({
      timeout: 15000,
    });

    // Count reward cards (should have at least 15 from the migration)
    const rewardCards = gmPage.locator('[data-testid^="reward-card-"]');
    await expect(rewardCards.first()).toBeVisible({ timeout: 15000 });

    const rewardCount = await rewardCards.count();
    expect(rewardCount).toBeGreaterThanOrEqual(15);

    // Verify some specific template rewards exist
    await expect(
      gmPage.locator('text="30 Minutes Extra Screen Time"'),
    ).toBeVisible();
    await expect(gmPage.locator('text="Skip One Chore"')).toBeVisible();
    await expect(gmPage.locator('text="Small Treat"')).toBeVisible();
    await expect(gmPage.locator('text="Ice Cream Outing"')).toBeVisible();
  });

  test("template rewards should span multiple categories", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    // Navigate to Reward Store (Hero view)
    await navigateToHeroTab(gmPage, "Reward Store");

    // Wait for page to load
    await expect(gmPage.getByTestId("reward-store-title")).toBeVisible({
      timeout: 15000,
    });

    // Check for rewards from different categories by looking for category-specific names
    // SCREEN_TIME category
    const screenTimeReward = gmPage.locator(
      'text="30 Minutes Extra Screen Time"',
    );
    await expect(screenTimeReward).toBeVisible({ timeout: 10000 });

    // PRIVILEGE category
    const privilegeReward = gmPage.locator('text="Skip One Chore"');
    await expect(privilegeReward).toBeVisible({ timeout: 10000 });

    // PURCHASE category
    const purchaseReward = gmPage.locator('text="Small Treat"');
    await expect(purchaseReward).toBeVisible({ timeout: 10000 });

    // EXPERIENCE category
    const experienceReward = gmPage.locator('text="Ice Cream Outing"');
    await expect(experienceReward).toBeVisible({ timeout: 10000 });
  });

  test("template rewards should have correct costs", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    // Navigate to Reward Store
    await navigateToHeroTab(gmPage, "Reward Store");

    await expect(gmPage.getByTestId("reward-store-title")).toBeVisible({
      timeout: 15000,
    });

    // Verify some rewards have the expected costs
    // Find "Small Treat" (25 gold - small)
    const smallTreatCard = gmPage
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Small Treat" });
    await expect(smallTreatCard).toBeVisible();
    await expect(smallTreatCard.locator('text="25 💰"')).toBeVisible();

    // Find "Skip One Chore" (100 gold - medium)
    const skipChoreCard = gmPage
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Skip One Chore" });
    await expect(skipChoreCard).toBeVisible();
    await expect(skipChoreCard.locator('text="100 💰"')).toBeVisible();

    // Find "Friend Sleepover" (250 gold - large)
    const sleepoCard = gmPage
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Friend Sleepover" });
    await expect(sleepoCard).toBeVisible();
    await expect(sleepoCard.locator('text="250 💰"')).toBeVisible();
  });

  test("template rewards should be immediately visible after family creation", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    // This test uses the worker family which was just created
    // Rewards should be immediately visible without any manual setup

    // Navigate to Reward Store
    await navigateToHeroTab(gmPage, "Reward Store");

    await expect(gmPage.getByTestId("reward-store-title")).toBeVisible({
      timeout: 15000,
    });

    // Should NOT see the "no rewards" message
    await expect(gmPage.getByTestId("no-rewards-message")).not.toBeVisible();

    // Should see multiple reward cards
    const rewardCards = gmPage.locator('[data-testid^="reward-card-"]');
    const count = await rewardCards.count();
    expect(count).toBeGreaterThanOrEqual(15);
  });

  test("template rewards should have descriptions", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    // Navigate to Reward Management to see descriptions
    await navigateToHeroTab(gmPage, "Reward Management");

    await expect(gmPage.getByTestId("reward-manager")).toBeVisible({
      timeout: 15000,
    });

    // Click on a reward to see details (if cards are clickable) or check for visible descriptions
    // Find "Small Treat" and verify it has a description
    const smallTreatCard = gmPage
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Small Treat" });

    await expect(smallTreatCard).toBeVisible();

    // Check that a description exists (specific text may vary)
    await expect(
      smallTreatCard.locator(
        'text=/.*snack.*|.*candy.*|.*drink.*/i',
      ),
    ).toBeVisible();
  });
});
