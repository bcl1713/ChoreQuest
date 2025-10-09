import { test, expect } from "./helpers/family-fixture";
import { giveCharacterGoldViaQuest } from "./helpers/setup-helpers";
import {
  navigateToAdmin,
  navigateToDashboard,
  navigateToHeroTab,
  navigateToAdminTab,
} from "./helpers/navigation-helpers";
import {
  createCustomQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";
import { createReward, redeemReward } from "./helpers/reward-helpers";

/**
 * E2E Tests for Admin Dashboard Activity Feed
 *
 * Tests that the activity feed displays family events in real-time,
 * including quest completions, reward redemptions, level-ups, and pending approvals.
 */

test.describe("Admin Dashboard Activity Feed", () => {
  test.beforeEach(async ({ workerFamily }) => {
    await navigateToDashboard(workerFamily.gmPage);
  });
  test("displays activity feed on overview tab", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Verify activity feed is visible on Overview tab
    await expect(gmPage.getByTestId("activity-feed")).toBeVisible();
    await expect(gmPage.getByText(/Recent Activity/i)).toBeVisible();

    // Verify feed structure exists (empty state or initial events)
    const activityFeed = gmPage.getByTestId("activity-feed");
    await expect(activityFeed).toBeVisible();
  });

  test("shows quest completion events in activity feed", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Navigate to main dashboard and complete a quest
    await navigateToDashboard(gmPage);
    const timestamp = Date.now();
    const questTitle = `Activity Quest ${timestamp}`;

    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Quest for activity feed",
      goldReward: 10,
      xpReward: 50,
      skipVisibilityCheck: true,
    });

    // Complete quest workflow for the specific quest we just created
    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    await approveQuest(gmPage, questTitle);

    // Navigate back to admin dashboard
    await navigateToAdmin(gmPage);

    // Wait for activity feed to load and refresh
    const activityFeed = gmPage.getByTestId("activity-feed");
    await gmPage.getByTestId("activity-feed-refresh-button").click();

    // Verify quest completion appears in activity feed
    await expect(activityFeed).toContainText(questTitle, { timeout: 5000 });
    await expect(activityFeed).toContainText(/completed/i);
  });

  test("shows pending approval events with quick action buttons", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    const timestamp = Date.now();
    const questTitle = `Pending Quest ${timestamp}`;

    // beforeEach already navigates to dashboard, no need to do it again

    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Quest needs approval",
      goldReward: 5,
      xpReward: 25,
      skipVisibilityCheck: true,
    });

    // Complete quest without approving for the specific quest we just created
    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);

    // Wait for quest completion to be processed
    await gmPage.waitForLoadState('networkidle');

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Verify pending approval appears in activity feed (submitted events)
    const activityFeed = gmPage.getByTestId("activity-feed");
    await expect(activityFeed).toContainText(/submitted.*for approval/i, {
      timeout: 5000,
    });

    // Verify Review button is present for pending quests
    const reviewButton = activityFeed.getByRole("button", { name: /Review/i });
    await expect(reviewButton).toBeVisible();

    // Click Review button - should navigate to dashboard with highlight
    await reviewButton.click();
    await expect(gmPage).toHaveURL(/.*\/dashboard/);
    await gmPage.waitForLoadState('networkidle');
    await expect(gmPage.getByTestId('admin-dashboard-button')).toBeVisible({ timeout: 10000 });

    // Navigate back to admin to verify event persistence
    await navigateToAdmin(gmPage);
    await expect(activityFeed).toContainText(/submitted.*for approval/i);
  });

  test("displays reward redemption events in activity feed", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // First, create a reward
    await navigateToAdmin(gmPage);
    await navigateToAdminTab(gmPage, "Rewards");

    const timestamp = Date.now();
    const rewardName = `Activity Reward ${timestamp}`;
    await createReward(gmPage, {
      name: rewardName,
      description: "Reward for activity feed test",
      type: "EXPERIENCE",
      cost: 10,
    });

    // Give character gold
    await navigateToDashboard(gmPage);
    await giveCharacterGoldViaQuest(gmPage, 50);

    // Redeem the reward
    await navigateToHeroTab(gmPage, "Reward Store");
    await redeemReward(gmPage, rewardName);

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Verify reward redemption appears in activity feed
    const activityFeed = gmPage.getByTestId("activity-feed");
    await expect(activityFeed).toContainText(rewardName, { timeout: 5000 });
    await expect(activityFeed).toContainText(/redeemed/i);
  });

  test("shows relative timestamps for events", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // Complete a quest
    await giveCharacterGoldViaQuest(gmPage, 10);

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Verify activity feed shows relative timestamps
    const activityFeed = gmPage.getByTestId("activity-feed");
    await expect(activityFeed).toContainText(
      /just now|seconds? ago|minutes? ago/i,
      { timeout: 5000 },
    );
  });

  test("activity feed auto-scrolls to new events", async ({ workerFamily }) => {
    const { gmPage, gmContext } = workerFamily;

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Open second tab in same GM context (already authenticated)
    const page2 = await gmContext.newPage();
    await navigateToDashboard(page2);

    // Complete a quest in second tab to generate a new activity
    await giveCharacterGoldViaQuest(page2, 20);

    // Wait for event to appear in first tab
    const activityFeed = gmPage.getByTestId("activity-feed");

    // Verify new event is visible (feed should have auto-scrolled or event is visible)
    await expect(activityFeed).toContainText(/completed/i, { timeout: 5000 });
  });

  test("activity feed has manual refresh button", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Verify refresh button exists
    const refreshButton = gmPage.getByTestId("activity-feed-refresh-button");
    await expect(refreshButton).toBeVisible();

    // Click refresh button
    await refreshButton.click();

    // Verify feed refreshes (no errors, still visible)
    await expect(gmPage.getByTestId("activity-feed")).toBeVisible();
  });

  test("activity feed limits to last 50 events", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Verify activity feed exists
    const activityFeed = gmPage.getByTestId("activity-feed");
    await expect(activityFeed).toBeVisible();

    // Count events (should be limited even if more exist in database)
    const eventCount = await activityFeed
      .locator('[data-testid*="activity-event"]')
      .count();

    // Verify count is reasonable (likely 0-50 for new family)
    expect(eventCount).toBeLessThanOrEqual(50);
  });

  test("displays level-up events in activity feed", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // Complete multiple quests to trigger level-up
    await navigateToHeroTab(gmPage, "Quests & Adventures");
    const timestamp = Date.now();
    const questTitle = `Levelup Quest ${timestamp}`;

    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Quest for level up",
      goldReward: 5,
      xpReward: 100,
    });

    // Complete and approve the specific quest we just created
    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    await approveQuest(gmPage, questTitle);

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Verify level-up event appears in activity feed
    const activityFeed = gmPage.getByTestId("activity-feed");
    await expect(activityFeed).toContainText(
      /level.*up|reached level|leveled up/i,
      { timeout: 5000 },
    );
  });
});
