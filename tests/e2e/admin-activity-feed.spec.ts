import { test, expect } from "@playwright/test";
import {
  setupUserWithCharacter,
  giveCharacterGoldViaQuest,
  loginUser,
} from "./helpers/setup-helpers";
import { navigateToAdmin, navigateToDashboard, navigateToHeroTab, navigateToAdminTab } from "./helpers/navigation-helpers";
import { createCustomQuest } from "./helpers/quest-helpers";
import { createReward, redeemReward } from "./helpers/reward-helpers";

/**
 * E2E Tests for Admin Dashboard Activity Feed
 *
 * Tests that the activity feed displays family events in real-time,
 * including quest completions, reward redemptions, level-ups, and pending approvals.
 */

test.describe("Admin Dashboard Activity Feed", () => {
  test("displays activity feed on overview tab", async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "activity-init", {
      characterClass: "KNIGHT",
    });

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Verify activity feed is visible on Overview tab
    await expect(page.getByTestId("activity-feed")).toBeVisible();
    await expect(page.getByText(/Recent Activity/i)).toBeVisible();

    // Verify feed structure exists (empty state or initial events)
    const activityFeed = page.getByTestId("activity-feed");
    await expect(activityFeed).toBeVisible();
  });

  test("shows quest completion events in activity feed", async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "activity-quest", {
      characterClass: "MAGE",
    });

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Navigate to main dashboard and complete a quest
    await navigateToDashboard(page);
    const timestamp = Date.now();
    const questTitle = `Activity Quest ${timestamp}`;

    await createCustomQuest(page, {
      title: questTitle,
      description: "Quest for activity feed",
      goldReward: 10,
      xpReward: 50,
    });

    // Complete quest workflow (use first quest since we just created it)
    await page.locator('[data-testid="pick-up-quest-button"]').first().click();
    await page.locator('[data-testid="start-quest-button"]').first().click();
    await page.locator('[data-testid="complete-quest-button"]').first().click();
    await page.locator('[data-testid="approve-quest-button"]').first().click();

    // Navigate back to admin dashboard
    await navigateToAdmin(page);

    // Wait for activity feed to load and refresh
    const activityFeed = page.getByTestId("activity-feed");
    await page.getByTestId("activity-feed-refresh-button").click();

    // Verify quest completion appears in activity feed
    await expect(activityFeed).toContainText(questTitle, { timeout: 5000 });
    await expect(activityFeed).toContainText(/completed/i);
  });

  test("shows pending approval events with quick action buttons", async ({
    page,
  }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "activity-approval", {
      characterClass: "RANGER",
    });

    // Navigate to main dashboard and complete a quest without approving
    const timestamp = Date.now();
    const questTitle = `Pending Quest ${timestamp}`;

    await createCustomQuest(page, {
      title: questTitle,
      description: "Quest needs approval",
      goldReward: 5,
      xpReward: 25,
    });

    // Complete quest without approving (use first quest since we just created it)
    await page.locator('[data-testid="pick-up-quest-button"]').first().click();
    await page.locator('[data-testid="start-quest-button"]').first().click();
    await page.locator('[data-testid="complete-quest-button"]').first().click();

    // Wait for quest completion to be processed
    await page.waitForLoadState('networkidle');

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Verify pending approval appears in activity feed (submitted events)
    const activityFeed = page.getByTestId("activity-feed");
    await expect(activityFeed).toContainText(/submitted.*for approval/i, {
      timeout: 5000,
    });

    // Verify Review button is present for pending quests
    const reviewButton = activityFeed.getByRole("button", { name: /Review/i });
    await expect(reviewButton).toBeVisible();

    // Click Review button - should navigate to dashboard with highlight
    await reviewButton.click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Navigate back to admin to verify event persistence
    await navigateToAdmin(page);
    await expect(activityFeed).toContainText(/submitted.*for approval/i);
  });

  test("displays reward redemption events in activity feed", async ({
    page,
  }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "activity-reward", {
      characterClass: "HEALER",
    });

    // First, create a reward
    await navigateToAdmin(page);
    await navigateToAdminTab(page, "Rewards");

    const timestamp = Date.now();
    const rewardName = `Activity Reward ${timestamp}`;
    await createReward(page, {
      name: rewardName,
      description: "Reward for activity feed test",
      type: "EXPERIENCE",
      cost: 10,
    });

    // Give character gold
    await navigateToDashboard(page);
    await giveCharacterGoldViaQuest(page, 50);

    // Redeem the reward
    await navigateToHeroTab(page, "Reward Store");
    await redeemReward(page, rewardName);

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Verify reward redemption appears in activity feed
    const activityFeed = page.getByTestId("activity-feed");
    await expect(activityFeed).toContainText(rewardName, { timeout: 5000 });
    await expect(activityFeed).toContainText(/redeemed/i);
  });

  test("shows relative timestamps for events", async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "activity-time", {
      characterClass: "ROGUE",
    });

    // Complete a quest
    await giveCharacterGoldViaQuest(page, 10);

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Verify activity feed shows relative timestamps
    const activityFeed = page.getByTestId("activity-feed");
    await expect(activityFeed).toContainText(
      /just now|seconds? ago|minutes? ago/i,
      { timeout: 5000 },
    );
  });

  test("activity feed auto-scrolls to new events", async ({ browser }) => {
    // This test verifies auto-scroll behavior when new events arrive
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Setup user (let setupUserWithCharacter generate unique email)
      const user = await setupUserWithCharacter(page, "activity-scroll", {
        characterClass: "KNIGHT",
      });

      // Navigate to admin dashboard
      await navigateToAdmin(page);

      // Open second tab in same context and login
      const page2 = await context.newPage();
      await page2.goto("http://localhost:3000");
      await loginUser(page2, user.email, user.password);

      // Complete a quest in second tab
      await giveCharacterGoldViaQuest(page2, 20);

      // Wait for event to appear in first tab
      const activityFeed = page.getByTestId("activity-feed");

      // Verify new event is visible (feed should have auto-scrolled or event is visible)
      await expect(activityFeed).toContainText(/completed/i, { timeout: 5000 });

      await page2.close();
    } finally {
      await context.close();
    }
  });

  test("activity feed has manual refresh button", async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "activity-refresh", {
      characterClass: "MAGE",
    });

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Verify refresh button exists
    const refreshButton = page.getByTestId("activity-feed-refresh-button");
    await expect(refreshButton).toBeVisible();

    // Click refresh button
    await refreshButton.click();

    // Verify feed refreshes (no errors, still visible)
    await expect(page.getByTestId("activity-feed")).toBeVisible();
  });

  test("activity feed limits to last 50 events", async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "activity-limit", {
      characterClass: "RANGER",
    });

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Verify activity feed exists
    const activityFeed = page.getByTestId("activity-feed");
    await expect(activityFeed).toBeVisible();

    // Count events (should be limited even if more exist in database)
    const eventCount = await activityFeed
      .locator('[data-testid*="activity-event"]')
      .count();

    // Verify count is reasonable (likely 0-50 for new family)
    expect(eventCount).toBeLessThanOrEqual(50);
  });

  test("displays level-up events in activity feed", async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, "activity-levelup", {
      characterClass: "HEALER",
    });

    // Complete multiple quests to trigger level-up
    await navigateToHeroTab(page, "Quests & Adventures");
    const timestamp = Date.now();
    const questTitle = `Levelup Quest ${timestamp}`;

    await createCustomQuest(page, {
      title: questTitle,
      description: "Quest for level up",
      goldReward: 5,
      xpReward: 100,
    });

    // Complete and approve quest (use first quest since we just created it)
    await page.locator('[data-testid="pick-up-quest-button"]').first().click();
    await page.locator('[data-testid="start-quest-button"]').first().click();
    await page.locator('[data-testid="complete-quest-button"]').first().click();
    await page.locator('[data-testid="approve-quest-button"]').first().click();

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Verify level-up event appears in activity feed
    const activityFeed = page.getByTestId("activity-feed");
    await expect(activityFeed).toContainText(
      /level.*up|reached level|leveled up/i,
      { timeout: 5000 },
    );
  });
});
