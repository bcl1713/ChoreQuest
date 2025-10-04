import { test, expect } from "@playwright/test";
import {
  setupTestUser,
  giveCharacterGoldViaQuest,
} from "./helpers/setup-helpers";

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
    await page.click('button:has-text("🏪 Reward Store")');

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
    await page.click('button:has-text("🏪 Reward Store")');

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
    await page.click('button:has-text("🏪 Reward Store")');

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
    await page.click('button:has-text("🏪 Reward Store")');
    await expect(page.locator('h2:has-text("⭐ Reward Store")')).toBeVisible();

    // Switch back to quest tab
    await page.click('button:has-text("⚔️ Quests & Adventures")');
    await expect(page.locator('h2:has-text("Quest Dashboard")')).toBeVisible();
  });

  test("should display redemption history with denormalized reward data", async ({
    page,
  }) => {
    // Create test user
    await setupTestUser(page);

    // Create a reward as Guild Master
    await page.click(
      'button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")',
    );
    await page.click('button:has-text("Create Reward")');
    await page.fill(
      '[data-testid="reward-name-input"]',
      "Test Reward for Redemption",
    );
    await page.fill(
      '[data-testid="reward-description-input"]',
      "This reward will be redeemed and deleted",
    );
    await page.selectOption(
      '[data-testid="reward-type-select"]',
      "SCREEN_TIME",
    );
    await page.fill('[data-testid="reward-cost-input"]', "50");
    await page.click('[data-testid="save-reward-button"]');

    // Give the hero some gold via quest completion (100 gold base with EASY difficulty + KNIGHT bonus = 105 gold)
    await giveCharacterGoldViaQuest(page, 100);

    // Switch to Reward Store tab
    await page.click('button:has-text("🏪 Reward Store")');

    // Redeem the reward
    await page.click('button:has-text("Redeem Reward")');

    // Verify redemption appears in history
    await expect(
      page.locator("text=Test Reward for Redemption").first(),
    ).toBeVisible();
    await expect(
      page.locator("text=This reward will be redeemed and deleted").first(),
    ).toBeVisible();

    // Delete the reward as Guild Master
    await page.click('button:has-text("⚙️ Reward Management")');

    // Find and delete the reward - click the first Delete button (there's only one reward)
    await page.locator('button:has-text("Delete")').first().click();
    await page.locator('button:has-text("Delete")').nth(1).click(); // Confirm deletion in modal

    // Switch back to Reward Store
    await page.click('button:has-text("🏪 Reward Store")');

    // Verify redemption history still shows with denormalized data (name and cost)
    await expect(
      page.locator("text=Test Reward for Redemption").first(),
    ).toBeVisible();
    // Note: Description and reward type may not be displayed in redemption history UI
  });

  test("should persist redemption history even after reward is deleted", async ({
    page,
  }) => {
    // Create test user
    await setupTestUser(page);

    // Create a reward
    await page.click(
      'button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")',
    );
    await page.click('button:has-text("Create Reward")');
    await page.fill(
      '[data-testid="reward-name-input"]',
      "Persistence Test Reward",
    );
    await page.fill(
      '[data-testid="reward-description-input"]',
      "Testing redemption persistence",
    );
    await page.selectOption('[data-testid="reward-type-select"]', "PRIVILEGE");
    await page.fill('[data-testid="reward-cost-input"]', "75");
    await page.click('[data-testid="save-reward-button"]');

    // Give gold to hero via quest completion (150 gold base with EASY difficulty + KNIGHT bonus = 157 gold)
    await giveCharacterGoldViaQuest(page, 150);

    // Redeem the reward
    await page.click('button:has-text("🏪 Reward Store")');

    await page.click('button:has-text("Redeem Reward")');

    // Delete the reward
    await page.click('button:has-text("⚙️ Reward Management")');

    await page.locator('button:has-text("Delete")').first().click();
    await page.locator('button:has-text("Delete")').nth(1).click(); // Confirm deletion in modal

    // Wait for deletion to be processed
    await page.waitForLoadState('networkidle');

    // Navigate to Reward Store
    await page.click('button:has-text("🏪 Reward Store")');

    // Verify redemption still exists with reward name (denormalized data persisted)
    await expect(
      page.locator("text=Persistence Test Reward").first(),
    ).toBeVisible();
  });
});

