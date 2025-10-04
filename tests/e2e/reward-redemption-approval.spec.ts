import { test, expect } from "@playwright/test";
import {
  setupTestUser,
  giveCharacterGoldViaQuest,
} from "./helpers/setup-helpers";
import { createReward } from "./helpers/reward-helpers";
import { navigateToHeroTab } from "./helpers/navigation-helpers";

test.describe("Reward Redemption Approval Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("GM sees pending redemptions section in RewardManager", async ({
    page,
  }) => {
    // Setup: Create Guild Master with character
    await setupTestUser(page);

    // Create a reward
    await navigateToHeroTab(page, "Reward Management");
    await createReward(page, {
      name: "Approval Test Reward",
      description: "Test redemption approval",
      type: "SCREEN_TIME",
      cost: 50,
    });

    // Give hero gold and redeem reward
    await giveCharacterGoldViaQuest(page, 100);
    await navigateToHeroTab(page, "Reward Store");
    await page.click('button:has-text("Redeem Reward")');

    // Navigate to Reward Management
    await navigateToHeroTab(page, "Reward Management");

    // Verify pending redemptions section exists
    await expect(
      page.locator('[data-testid="pending-redemptions-section"]'),
    ).toBeVisible();
    await expect(page.locator("text=Pending Redemptions")).toBeVisible();

    // Verify redemption appears in pending list
    await expect(
      page.locator('[data-testid="pending-redemption-item"]'),
    ).toHaveCount(1);
  });

  test("GM can approve redemption", async ({ page }) => {
    // Setup and create redemption
    await setupTestUser(page);

    await navigateToHeroTab(page, "Reward Management");
    await createReward(page, {
      name: "Approve Test",
      description: "Test approval",
      type: "PRIVILEGE",
      cost: 75,
    });

    await giveCharacterGoldViaQuest(page, 150);
    await navigateToHeroTab(page, "Reward Store");
    await page.click('button:has-text("Redeem Reward")');

    // Go to Reward Management
    await navigateToHeroTab(page, "Reward Management");

    // Approve the redemption
    await page.click('[data-testid="approve-redemption-button"]');

    // Verify redemption moved from pending to approved section
    await expect(
      page.locator('[data-testid="pending-redemption-item"]'),
    ).toHaveCount(0);

    // Verify it appears in approved section with heading
    await expect(
      page.locator('h3:has-text("Approved - Awaiting Fulfillment")'),
    ).toBeVisible();
  });

  test("GM can deny redemption and gold is refunded", async ({ page }) => {
    // Setup and create redemption
    await setupTestUser(page);

    await navigateToHeroTab(page, "Reward Management");
    await createReward(page, {
      name: "Deny Test",
      description: "Test denial",
      type: "PURCHASE",
      cost: 60,
    });

    await giveCharacterGoldViaQuest(page, 100);
    await navigateToHeroTab(page, "Reward Store");
    await expect(page.locator('[data-testid="gold-balance"]')).not.toHaveText(
      "0 Gold",
    );

    // Capture gold before redemption
    const goldBeforeText = await page
      .locator('[data-testid="gold-balance"]')
      .textContent();
    const goldBefore = parseInt(goldBeforeText?.match(/\d+/)?.[0] || "0");

    await page.click('button:has-text("Redeem Reward")');
    await expect(page.locator('[data-testid="gold-balance"]')).not.toHaveText(
      goldBeforeText || "",
    );

    // Verify gold was deducted
    const goldAfterRedeemText = await page
      .locator('[data-testid="gold-balance"]')
      .textContent();
    const goldAfterRedeem = parseInt(
      goldAfterRedeemText?.match(/\d+/)?.[0] || "0",
    );
    expect(goldAfterRedeem).toBe(goldBefore - 60);

    // Go to Reward Management and deny
    await navigateToHeroTab(page, "Reward Management");
    await page.click('[data-testid="deny-redemption-button"]');

    // Verify redemption is removed from pending
    await expect(
      page.locator('[data-testid="pending-redemption-item"]'),
    ).toHaveCount(0);

    // Check gold was refunded
    await navigateToHeroTab(page, "Reward Store");
    const goldAfterDenyText = await page
      .locator('[data-testid="gold-balance"]')
      .textContent();
    const goldAfterDeny = parseInt(goldAfterDenyText?.match(/\d+/)?.[0] || "0");
    expect(goldAfterDeny).toBe(goldBefore); // Should be back to original
  });

  test("GM can fulfill approved redemption", async ({ page }) => {
    // Setup and create redemption
    await setupTestUser(page);

    await navigateToHeroTab(page, "Reward Management");
    await createReward(page, {
      name: "Fulfill Test",
      description: "Test fulfillment",
      type: "EXPERIENCE",
      cost: 80,
    });

    await giveCharacterGoldViaQuest(page, 150);
    await navigateToHeroTab(page, "Reward Store");
    await page.click('button:has-text("Redeem Reward")');

    // Go to Reward Management and approve
    await navigateToHeroTab(page, "Reward Management");
    await page.click('[data-testid="approve-redemption-button"]');

    // Now fulfill the approved redemption
    await page.click('[data-testid="fulfill-redemption-button"]');

    // Verify it appears in redemption history section
    await expect(
      page.locator('h3:has-text("Redemption History")'),
    ).toBeVisible();
  });

  test("Realtime updates when redemption status changes", async ({
    page,
    context,
  }) => {
    // Setup: Create Guild Master
    await setupTestUser(page);

    // Create reward
    await navigateToHeroTab(page, "Reward Management");
    await createReward(page, {
      name: "Realtime Test",
      description: "Test realtime",
      type: "SCREEN_TIME",
      cost: 50,
    });

    // Give gold and redeem
    await giveCharacterGoldViaQuest(page, 100);
    await navigateToHeroTab(page, "Reward Store");
    await page.click('button:has-text("Redeem Reward")');

    // Open second tab for same user
    const page2 = await context.newPage();
    await page2.goto("/dashboard");
    await navigateToHeroTab(page2, "Reward Management");

    // Verify redemption appears in second tab
    await expect(
      page2.locator('[data-testid="pending-redemption-item"]'),
    ).toHaveCount(1);

    // Approve in first tab
    await navigateToHeroTab(page, "Reward Management");
    await page.click('[data-testid="approve-redemption-button"]');

    // Verify realtime update in second tab - pending count goes to 0
    await expect(
      page2.locator('[data-testid="pending-redemption-item"]'),
    ).toHaveCount(0, { timeout: 5000 });

    await page2.close();
  });

  test("Hero sees status change in redemption history", async ({ page }) => {
    // Setup and create redemption
    await setupTestUser(page);

    await navigateToHeroTab(page, "Reward Management");
    await createReward(page, {
      name: "Hero View Test",
      description: "Test hero view",
      type: "PRIVILEGE",
      cost: 50,
    });

    await giveCharacterGoldViaQuest(page, 100);

    // Hero redeems
    await navigateToHeroTab(page, "Reward Store");
    await page.click('button:has-text("Redeem Reward")');

    // Verify hero sees pending status (button disabled with "Request Pending")
    await expect(
      page.locator('button:has-text("Request Pending")'),
    ).toBeVisible();

    // GM approves
    await navigateToHeroTab(page, "Reward Management");
    await page.click('[data-testid="approve-redemption-button"]');

    // Hero checks reward store
    await navigateToHeroTab(page, "Reward Store");

    // Verify request pending button is no longer visible (was approved)
    await expect(
      page.locator('button:has-text("Request Pending")'),
    ).not.toBeVisible();
  });
});
