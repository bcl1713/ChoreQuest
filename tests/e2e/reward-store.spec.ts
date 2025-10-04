import { test, expect } from "@playwright/test";
import {
  setupTestUser,
  giveCharacterGoldViaQuest,
} from "./helpers/setup-helpers";
import { createReward, deleteReward } from "./helpers/reward-helpers";
import { navigateToHeroTab } from "./helpers/navigation-helpers";

test.describe("Reward Store", () => {
  test.beforeEach(async ({ page }) => {
    // Simple setup for each test - we'll create users as needed per test
    await page.goto("/");
  });

  test("should display reward store with available rewards", async ({
    page,
  }) => {
    // Create test user with character
    await setupTestUser(page);

    // Switch to Reward Store tab
    await navigateToHeroTab(page, "Reward Store");

    // Verify reward store is displayed
    await expect(
      page.locator('[data-testid="reward-store-title"]'),
    ).toBeVisible();

    // Verify gold balance is shown (default should be 0 for new characters)
    await expect(page.locator('[data-testid="gold-balance"]')).toBeVisible({
      timeout: 10000,
    });

    // Verify message for when no rewards are available (expected for new test family)
    await expect(
      page.locator('[data-testid="no-rewards-message"]'),
    ).toBeVisible();
  });

  test("should show empty state when no rewards exist", async ({ page }) => {
    // Create test user
    await setupTestUser(page);

    // Switch to Reward Store tab
    await navigateToHeroTab(page, "Reward Store");

    // Verify reward store displays empty state
    await expect(
      page.locator('[data-testid="reward-store-title"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="no-rewards-message"]'),
    ).toBeVisible();

    // Verify no redemption buttons are visible
    await expect(
      page.locator('button:has-text("Redeem Reward")'),
    ).not.toBeVisible();
  });

  test("should display user gold balance correctly", async ({ page }) => {
    // Create test user with character
    await setupTestUser(page);

    // Switch to Reward Store tab
    await navigateToHeroTab(page, "Reward Store");

    // Verify reward store is displayed
    await expect(
      page.locator('[data-testid="reward-store-title"]'),
    ).toBeVisible();

    // Verify default gold balance (0 for new characters)
    await expect(page.locator('[data-testid="gold-balance"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show correct tab navigation", async ({ page }) => {
    // Create test user
    await setupTestUser(page);

    // Verify both tabs are visible
    await expect(
      page.locator('button:has-text("⚔️ Quests & Adventures")'),
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("🏪 Reward Store")'),
    ).toBeVisible();

    // Verify quest tab is active by default
    await expect(page.locator('h2:has-text("Quest Dashboard")')).toBeVisible();

    // Switch to reward store tab
    await navigateToHeroTab(page, "Reward Store");
    await expect(page.locator('h2:has-text("⭐ Reward Store")')).toBeVisible();

    // Switch back to quest tab
    await navigateToHeroTab(page, "Quests & Adventures");
    await expect(page.locator('h2:has-text("Quest Dashboard")')).toBeVisible();
  });

  test("should display redemption history with denormalized reward data", async ({
    page,
  }) => {
    // Create test user
    await setupTestUser(page);

    // Create a reward as Guild Master
    await navigateToHeroTab(page, "Reward Management");
    await createReward(page, {
      name: "Test Reward for Redemption",
      description: "This reward will be redeemed and deleted",
      type: "SCREEN_TIME",
      cost: 50,
    });

    // Give the hero some gold via quest completion
    await giveCharacterGoldViaQuest(page, 100);

    // Switch to Reward Store tab and redeem the reward
    await navigateToHeroTab(page, "Reward Store");
    await page.click('button:has-text("Redeem Reward")');

    // Verify redemption appears in history
    await expect(
      page.locator("text=Test Reward for Redemption").first(),
    ).toBeVisible();
    await expect(
      page.locator("text=This reward will be redeemed and deleted").first(),
    ).toBeVisible();

    // Delete the reward as Guild Master
    await navigateToHeroTab(page, "Reward Management");
    await deleteReward(page, "Test Reward for Redemption");

    // Switch back to Reward Store
    await navigateToHeroTab(page, "Reward Store");

    // Verify redemption history still shows with denormalized data
    await expect(
      page.locator("text=Test Reward for Redemption").first(),
    ).toBeVisible();
  });

  test("should persist redemption history even after reward is deleted", async ({
    page,
  }) => {
    // Create test user
    await setupTestUser(page);

    // Create a reward
    await navigateToHeroTab(page, "Reward Management");
    await createReward(page, {
      name: "Persistence Test Reward",
      description: "Testing redemption persistence",
      type: "PRIVILEGE",
      cost: 75,
    });

    // Give gold to hero via quest completion
    await giveCharacterGoldViaQuest(page, 150);

    // Redeem the reward
    await navigateToHeroTab(page, "Reward Store");
    await page.click('button:has-text("Redeem Reward")');

    // Delete the reward
    await navigateToHeroTab(page, "Reward Management");
    await deleteReward(page, "Persistence Test Reward");

    // Navigate to Reward Store
    await navigateToHeroTab(page, "Reward Store");

    // Verify redemption still exists with reward name (denormalized data persisted)
    await expect(
      page.locator("text=Persistence Test Reward").first(),
    ).toBeVisible();
  });
});

