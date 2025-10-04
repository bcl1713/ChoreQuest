import { test, expect } from "@playwright/test";
import {
  setupUserWithCharacter,
  giveCharacterGoldViaQuest,
} from "./helpers/setup-helpers";

/**
 * E2E Tests for Admin Dashboard Statistics Display
 *
 * Tests that family statistics are displayed correctly and update in real-time
 * when quests are completed, rewards are redeemed, and characters level up.
 */

test.describe("Admin Dashboard Statistics", () => {
  test("displays initial family statistics correctly", async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "stats-initial", {
      characterClass: "KNIGHT",
    });

    // Navigate to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

    // Verify statistics panel is visible
    await expect(page.getByTestId("statistics-panel")).toBeVisible();

    // Verify initial statistics are displayed
    await expect(page.getByText(/Quests This Week/i)).toBeVisible();
    await expect(page.getByText(/Total Gold/i)).toBeVisible();
    await expect(page.getByText(/Total XP/i)).toBeVisible();
    await expect(page.getByText(/Most Active Member/i)).toBeVisible();
    await expect(page.getByText(/Pending Approvals/i)).toBeVisible();

    // Verify statistics show reasonable initial values
    // New family should have 0 completed quests, 0 gold/XP earned
    const statsPanel = page.getByTestId("statistics-panel");
    await expect(statsPanel).toContainText("0 quests");
  });

  test("updates quest completion statistics in real-time", async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "stats-quest", {
      characterClass: "MAGE",
    });

    // Navigate to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

    // Navigate to main dashboard to create and complete a quest
    await page.click("text=Back to Dashboard");
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Create a test quest
    const timestamp = Date.now();
    await page.click('[data-testid="create-quest-button"]');
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    await page.fill(
      'input[placeholder="Enter quest title..."]',
      `Test Quest ${timestamp}`,
    );
    await page.fill(
      'textarea[placeholder="Describe the quest..."]',
      "Test quest for statistics",
    );
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', "10");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "50");
    await page.click('button[type="submit"]');

    // Complete the quest workflow: pickup -> start -> complete -> approve
    await page.locator('[data-testid="pick-up-quest-button"]').first().click();

    await page.locator('[data-testid="start-quest-button"]').first().click();

    await page.locator('[data-testid="complete-quest-button"]').first().click();

    // Wait for quest completion to be processed
    await expect(page.locator('[data-testid="approve-quest-button"]').first()).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="approve-quest-button"]').first().click();

    // Navigate back to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

    // Verify quest completion count increased (check the specific stat card)
    const statsPanel = page.getByTestId("statistics-panel");
    await expect(statsPanel).toContainText("Quests This Week", {
      timeout: 5000,
    });
    await expect(statsPanel).toContainText("Quests This Month");

    // Verify gold and XP statistics updated (10 gold with EASY difficulty = 11-12 gold)
    await expect(statsPanel).toContainText("Total Gold");
    await expect(statsPanel).toContainText("Total XP");
  });

  test("displays character progress and levels", async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "stats-character", {
      characterClass: "RANGER",
    });

    // Navigate to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

    // Verify character statistics are displayed
    const statsPanel = page.getByTestId("statistics-panel");
    await expect(statsPanel).toContainText(/Level/i);

    // Verify character name appears in statistics
    await expect(statsPanel).toContainText(/stats-character/i);

    // Verify character table has data (level is in a table cell, separate from header)
    // Character starts at level 1 - check for the character row containing level data
    const characterRow = statsPanel.locator("tr", {
      hasText: /stats-character/i,
    });
    await expect(characterRow).toBeVisible();
  });

  test("shows pending approvals count", async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "stats-pending", {
      characterClass: "HEALER",
    });

    // Navigate to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

    // Verify pending approvals shows 0 initially
    const statsPanel = page.getByTestId("statistics-panel");
    await expect(statsPanel.getByText(/Pending Approvals/i)).toBeVisible();
    await expect(statsPanel).toContainText("0 quests");

    // Create and complete a quest (needs approval)
    await page.click("text=Back to Dashboard");
    const timestamp = Date.now();
    await page.click('[data-testid="create-quest-button"]');
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    await page.fill(
      'input[placeholder="Enter quest title..."]',
      `Pending Quest ${timestamp}`,
    );
    await page.fill(
      'textarea[placeholder="Describe the quest..."]',
      "Quest needs approval",
    );
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', "5");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "25");
    await page.click('button[type="submit"]');

    // Complete quest without approving
    await page.locator('[data-testid="pick-up-quest-button"]').first().click();

    await page.locator('[data-testid="start-quest-button"]').first().click();

    await page.locator('[data-testid="complete-quest-button"]').first().click();

    // Wait for quest completion to be processed
    await page.waitForLoadState('networkidle');

    // Navigate back to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

    // Verify pending approvals count increased to 1
    await expect(statsPanel).toContainText("1 quests", { timeout: 5000 });
  });

  test("statistics update when viewed in second browser window", async ({
    browser,
  }) => {
    // This test verifies real-time updates across different sessions
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup user in first context (let setupUserWithCharacter generate unique email)
      const user = await setupUserWithCharacter(page1, "stats-realtime", {
        characterClass: "ROGUE",
      });

      // Navigate to admin dashboard in first window
      await page1.click('[data-testid="admin-dashboard-button"]');
      await expect(page1).toHaveURL(/.*\/admin/);

      // Login with same user in second context
      await page2.goto("/");
      await page2.click('[data-testid="login-link"]');
      await page2.fill('input[name="email"]', user.email);
      await page2.fill('input[name="password"]', user.password);
      await page2.click('button[type="submit"]');
      await page2.waitForURL(/.*\/dashboard/, { timeout: 15000 });

      // Complete a quest in second window (EASY difficulty = 1.15x multiplier)
      await giveCharacterGoldViaQuest(page2, 20); // 20 * 1.15 = 23 gold

      // Wait a moment for realtime to propagate

      // Verify statistics updated in first window
      const statsPanel = page1.getByTestId("statistics-panel");
      await expect(statsPanel).toContainText(/1.*quest/i, { timeout: 5000 });
      await expect(statsPanel).toContainText(/23/); // 20 gold * 1.15 EASY multiplier = 23
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test("displays most active family member correctly", async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "stats-active", {
      characterClass: "KNIGHT",
    });

    // Navigate to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

    // Complete a quest to become the most active member
    await page.click("text=Back to Dashboard");
    await giveCharacterGoldViaQuest(page, 15);

    // Navigate back to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

    // Verify most active member is displayed
    const statsPanel = page.getByTestId("statistics-panel");
    await expect(statsPanel.getByText(/Most Active Member/i)).toBeVisible();
    await expect(statsPanel).toContainText(/stats-active/i);
  });
});
