import { test, expect } from "./helpers/family-fixture";
import type { Page } from "@playwright/test";
import {
  createReward,
  deleteReward,
  ensureGoldBalance,
} from "./helpers/reward-helpers";
import {
  navigateToDashboard,
  navigateToHeroTab,
} from "./helpers/navigation-helpers";

async function clearAllRewards(gmPage: Page): Promise<void> {
  await navigateToHeroTab(gmPage, "Reward Management");

  const rewardCards = gmPage.locator('[data-testid^="reward-card-"]');

  while ((await rewardCards.count()) > 0) {
    const card = rewardCards.first();
    const name = await card.locator("h3").innerText();
    await deleteReward(gmPage, name.trim());
    await gmPage.waitForLoadState("networkidle");
  }

  await navigateToHeroTab(gmPage, "Quests & Adventures");
}

test.describe("Reward Store", () => {
  test.beforeEach(async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    await navigateToDashboard(gmPage);
    await expect(gmPage.getByTestId("welcome-message")).toBeVisible({
      timeout: 15000,
    });
    await clearAllRewards(gmPage);
  });

  test("should display reward store with available rewards", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;
    await navigateToHeroTab(gmPage, "Reward Store");

    await expect(gmPage.getByTestId("reward-store-title")).toBeVisible({
      timeout: 15000,
    });
    await expect(gmPage.getByTestId("gold-balance")).toBeVisible({
      timeout: 10000,
    });
    await expect(gmPage.getByTestId("no-rewards-message")).toBeVisible();
  });

  test("should show empty state when no rewards exist", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToHeroTab(gmPage, "Reward Store");

    await expect(gmPage.getByTestId("reward-store-title")).toBeVisible({
      timeout: 15000,
    });
    await expect(gmPage.getByTestId("no-rewards-message")).toBeVisible();
    await expect(
      gmPage.locator('button:has-text("Redeem Reward")'),
    ).not.toBeVisible();
  });

  test("should display user gold balance correctly", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;
    await navigateToHeroTab(gmPage, "Reward Store");

    await expect(gmPage.getByTestId("reward-store-title")).toBeVisible({
      timeout: 15000,
    });
    await expect(gmPage.getByTestId("gold-balance")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show correct tab navigation", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await expect(
      gmPage.locator('button:has-text("⚔️ Quests & Adventures")'),
    ).toBeVisible();
    await expect(
      gmPage.locator('button:has-text("🏪 Reward Store")'),
    ).toBeVisible();

    await expect(
      gmPage.locator('h2:has-text("Quest Dashboard")'),
    ).toBeVisible({
      timeout: 15000,
    });

    await navigateToHeroTab(gmPage, "Reward Store");
    await expect(
      gmPage.locator('h2:has-text("⭐ Reward Store")'),
    ).toBeVisible({
      timeout: 15000,
    });

    await navigateToHeroTab(gmPage, "Quests & Adventures");
    await expect(
      gmPage.locator('h2:has-text("Quest Dashboard")'),
    ).toBeVisible({
      timeout: 15000,
    });
  });

  test("should display redemption history with denormalized reward data", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToHeroTab(gmPage, "Reward Management");
    await createReward(gmPage, {
      name: "Test Reward for Redemption",
      description: "This reward will be redeemed and deleted",
      type: "SCREEN_TIME",
      cost: 50,
    });

    await ensureGoldBalance(gmPage, 75);

    await navigateToHeroTab(gmPage, "Reward Store");
    await gmPage.click('button:has-text("Redeem Reward")');

    await expect(
      gmPage.locator("text=Test Reward for Redemption").first(),
    ).toBeVisible();
    await expect(
      gmPage
        .locator("text=This reward will be redeemed and deleted")
        .first(),
    ).toBeVisible();

    await navigateToHeroTab(gmPage, "Reward Management");
    await deleteReward(gmPage, "Test Reward for Redemption");

    await navigateToHeroTab(gmPage, "Reward Store");

    await expect(
      gmPage.locator("text=Test Reward for Redemption").first(),
    ).toBeVisible();
  });

  test("should persist redemption history even after reward is deleted", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToHeroTab(gmPage, "Reward Management");
    await createReward(gmPage, {
      name: "Persistence Test Reward",
      description: "Testing redemption persistence",
      type: "PRIVILEGE",
      cost: 75,
    });

    await ensureGoldBalance(gmPage, 100);

    await navigateToHeroTab(gmPage, "Reward Store");
    await gmPage.click('button:has-text("Redeem Reward")');

    await navigateToHeroTab(gmPage, "Reward Management");
    await deleteReward(gmPage, "Persistence Test Reward");

    await navigateToHeroTab(gmPage, "Reward Store");
    await expect(
      gmPage.locator("text=Persistence Test Reward").first(),
    ).toBeVisible();
  });
});
