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
  test.skip("new family automatically receives template rewards", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    // Navigate to Reward Management to see all rewards
    await navigateToHeroTab(gmPage, "Reward Management");

    // Wait for page to load
    await expect(gmPage.getByTestId("reward-manager")).toBeVisible({
      timeout: 15000,
    });

    // Verify template rewards were copied (count > 0)
    const rewardCards = gmPage.locator('[data-testid^="reward-card-"]');
    await expect(rewardCards.first()).toBeVisible({ timeout: 15000 });

    const rewardCount = await rewardCards.count();
    expect(rewardCount).toBeGreaterThan(0);
  });
});
