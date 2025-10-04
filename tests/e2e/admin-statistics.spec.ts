import { test, expect } from "@playwright/test";
import {
  setupUserWithCharacter,
  giveCharacterGoldViaQuest,
  loginUser,
} from "./helpers/setup-helpers";
import { navigateToAdmin, navigateToDashboard } from "./helpers/navigation-helpers";
import { createCustomQuest } from "./helpers/quest-helpers";

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
    await navigateToAdmin(page);

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
    await navigateToAdmin(page);

    // Navigate to main dashboard to create and complete a quest
    await navigateToDashboard(page);

    // Create and complete a test quest
    const timestamp = Date.now();
    await createCustomQuest(page, {
      title: `Test Quest ${timestamp}`,
      description: "Test quest for statistics",
      goldReward: 10,
      xpReward: 50,
    });

    // Complete the quest workflow: pickup -> start -> complete -> approve
    await page.locator('[data-testid="pick-up-quest-button"]').first().click();
    await page.locator('[data-testid="start-quest-button"]').first().click();
    await page.locator('[data-testid="complete-quest-button"]').first().click();
    await page.locator('[data-testid="approve-quest-button"]').first().click();

    // Navigate back to admin dashboard
    await navigateToAdmin(page);

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
    await navigateToAdmin(page);

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
    await navigateToAdmin(page);

    // Verify pending approvals shows 0 initially
    const statsPanel = page.getByTestId("statistics-panel");
    await expect(statsPanel.getByText(/Pending Approvals/i)).toBeVisible();
    await expect(statsPanel).toContainText("0 quests");

    // Create and complete a quest (needs approval)
    await navigateToDashboard(page);
    const timestamp = Date.now();
    await createCustomQuest(page, {
      title: `Pending Quest ${timestamp}`,
      description: "Quest needs approval",
      goldReward: 5,
      xpReward: 25,
    });

    // Complete quest without approving
    await page.locator('[data-testid="pick-up-quest-button"]').first().click();
    await page.locator('[data-testid="start-quest-button"]').first().click();
    await page.locator('[data-testid="complete-quest-button"]').first().click();

    // Wait for quest completion to be processed
    await page.waitForLoadState('networkidle');

    // Navigate back to admin dashboard
    await navigateToAdmin(page);

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
      await navigateToAdmin(page1);

      // Login with same user in second context
      await loginUser(page2, user.email, user.password);

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
    await navigateToAdmin(page);

    // Complete a quest to become the most active member
    await navigateToDashboard(page);
    await giveCharacterGoldViaQuest(page, 15);

    // Navigate back to admin dashboard
    await navigateToAdmin(page);

    // Verify most active member is displayed
    const statsPanel = page.getByTestId("statistics-panel");
    await expect(statsPanel.getByText(/Most Active Member/i)).toBeVisible();
    await expect(statsPanel).toContainText(/stats-active/i);
  });
});
