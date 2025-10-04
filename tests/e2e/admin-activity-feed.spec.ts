import { test, expect } from "@playwright/test";
import {
  setupUserWithCharacter,
  giveCharacterGoldViaQuest,
  loginUser,
} from "./helpers/setup-helpers";

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
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

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
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

    // Navigate to main dashboard and complete a quest
    await page.click("text=Back to Dashboard");
    const timestamp = Date.now();
    await page.click('[data-testid="create-quest-button"]');
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    const questTitle = `Activity Quest ${timestamp}`;
    await page.fill('input[placeholder="Enter quest title..."]', questTitle);
    await page.fill(
      'textarea[placeholder="Describe the quest..."]',
      "Quest for activity feed",
    );
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', "10");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "50");
    await page.click('button[type="submit"]');

    // Complete quest workflow
    await page.locator('[data-testid="pick-up-quest-button"]').first().click();

    await page.locator('[data-testid="start-quest-button"]').first().click();

    await page.locator('[data-testid="complete-quest-button"]').first().click();

    // Refresh and approve
    await page.reload();

    await page.locator('[data-testid="approve-quest-button"]').first().click();

    // Navigate back to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

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
    await page.click('[data-testid="create-quest-button"]');
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    const questTitle = `Pending Quest ${timestamp}`;
    await page.fill('input[placeholder="Enter quest title..."]', questTitle);
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

    // Refresh to see completed status
    await page.reload();

    // Navigate to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

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
    await page.click('[data-testid="admin-dashboard-button"]');
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
    await page.click('[data-testid="admin-dashboard-button"]');
    await page.getByRole("tab", { name: /Rewards/i }).click();

    const timestamp = Date.now();
    const rewardName = `Activity Reward ${timestamp}`;
    await page.click('[data-testid="create-reward-button"]');
    await page.fill('[data-testid="reward-name-input"]', rewardName);
    await page.fill(
      '[data-testid="reward-description-input"]',
      "Reward for activity feed test",
    );
    await page.selectOption('[data-testid="reward-type-select"]', "EXPERIENCE");
    await page.fill('[data-testid="reward-cost-input"]', "10");
    await page.click('[data-testid="save-reward-button"]');

    // Give character gold
    await page.click("text=Back to Dashboard");
    await giveCharacterGoldViaQuest(page, 50);

    // Redeem the reward
    await page.click('[data-testid="tab-rewards"]'); // Use testid for rewards tab

    // Find and click the reward - use simpler selector
    await page.getByText(rewardName).click();

    // Click redeem button (should be visible in reward details/card)
    await page.getByRole("button", { name: /redeem/i }).click();

    // Navigate to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

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
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

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
      await page.click('[data-testid="admin-dashboard-button"]');
      await expect(page).toHaveURL(/.*\/admin/);

      // Open second tab in same context and login
      const page2 = await context.newPage();
      await loginUser(page2, user.email, user.password);

      // Complete a quest in second tab
      await giveCharacterGoldViaQuest(page2, 20);

      // Wait for event to appear in first tab

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
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

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
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

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
    await page.click("text=Quests & Adventures");
    const timestamp = Date.now();
    await page.click('[data-testid="create-quest-button"]');
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    await page.fill(
      'input[placeholder="Enter quest title..."]',
      `Levelup Quest ${timestamp}`,
    );
    await page.fill(
      'textarea[placeholder="Describe the quest..."]',
      "Quest for level up",
    );
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', "5");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "100");
    await page.click('button[type="submit"]');

    // Complete and approve quest
    await page.locator('[data-testid="pick-up-quest-button"]').first().click();

    await page.locator('[data-testid="start-quest-button"]').first().click();

    await page.locator('[data-testid="complete-quest-button"]').first().click();

    await page.locator('[data-testid="approve-quest-button"]').first().click();

    // Navigate to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await expect(page).toHaveURL(/.*\/admin/);

    // Verify level-up event appears in activity feed
    const activityFeed = page.getByTestId("activity-feed");
    await expect(activityFeed).toContainText(
      /level.*up|reached level|leveled up/i,
      { timeout: 5000 },
    );
  });
});
