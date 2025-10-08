import { test, expect } from "./helpers/family-fixture";
import type { Page } from "@playwright/test";
import {
  createReward,
  approveRewardRedemption,
  denyRewardRedemption,
  markRedemptionFulfilled,
  deleteReward,
  ensureGoldBalance,
} from "./helpers/reward-helpers";
import {
  navigateToDashboard,
  navigateToHeroTab,
} from "./helpers/navigation-helpers";
import { waitForCountChange } from "./helpers/realtime-helpers";

function uniqueRewardName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix} ${timestamp}-${random}`;
}

async function redeemRewardByName(page: Page, rewardName: string): Promise<void> {
  await expect(page.getByTestId("reward-store-title")).toBeVisible({
    timeout: 15000,
  });

  const rewardList = page.locator('[data-testid="reward-store-grid"]');
  await expect(rewardList).toBeVisible({ timeout: 20000 });

  await expect(rewardList).toContainText(rewardName, { timeout: 20000 });

  const rewardCard = rewardList
    .locator('[data-testid^="reward-store-card-"]')
    .filter({ hasText: rewardName })
    .first();
  await expect(rewardCard).toBeVisible({ timeout: 20000 });

  const redeemButton = rewardCard.getByTestId("reward-store-redeem-button");
  await expect(redeemButton).toBeVisible({ timeout: 15000 });
  await expect(redeemButton).toBeEnabled({ timeout: 15000 });
  await redeemButton.click();
  await page.waitForLoadState("networkidle");
}

async function resetRewardState(gmPage: Page): Promise<void> {
  await navigateToHeroTab(gmPage, "Reward Management");

  // Clear pending redemptions
  const pendingRedemptions = gmPage.locator('[data-testid="pending-redemption-item"]');
  let pendingCount = await pendingRedemptions.count();
  while (pendingCount > 0) {
    const denyButton = pendingRedemptions
      .first()
      .locator('[data-testid="deny-redemption-button"]');

    // Check if button is visible before clicking
    if (await denyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await denyButton.click();
      await gmPage.waitForLoadState("networkidle");
    }

    // Re-check count to avoid infinite loop
    const newCount = await pendingRedemptions.count();
    if (newCount === pendingCount) {
      // Count didn't change, break to avoid infinite loop
      break;
    }
    pendingCount = newCount;
  }

  // Clear approved redemptions
  const approvedRedemptions = gmPage.locator('[data-testid="approved-redemption-item"]');
  let approvedCount = await approvedRedemptions.count();
  while (approvedCount > 0) {
    const fulfillButton = approvedRedemptions
      .first()
      .locator('[data-testid="fulfill-redemption-button"]');

    // Check if button is visible before clicking
    if (await fulfillButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fulfillButton.click();
      await gmPage.waitForLoadState("networkidle");
    }

    // Re-check count to avoid infinite loop
    const newCount = await approvedRedemptions.count();
    if (newCount === approvedCount) {
      // Count didn't change, break to avoid infinite loop
      break;
    }
    approvedCount = newCount;
  }

  // Delete all rewards
  const rewardCards = gmPage.locator('[data-testid^="reward-card-"]');
  let rewardCount = await rewardCards.count();
  while (rewardCount > 0) {
    const name = await rewardCards.first().locator("h3").innerText();
    await deleteReward(gmPage, name.trim());

    // Re-check count to avoid infinite loop
    const newCount = await rewardCards.count();
    if (newCount === rewardCount) {
      // Count didn't change, break to avoid infinite loop
      break;
    }
    rewardCount = newCount;
  }

  await navigateToHeroTab(gmPage, "Quests & Adventures");
}

async function readGoldBalance(page: Page): Promise<number> {
  // Try reward store gold balance first
  const goldBalanceLocator = page.locator('[data-testid="gold-balance"]');
  if (await goldBalanceLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
    const text = (await goldBalanceLocator.textContent()) || "";
    const numeric = text.match(/\d+/);
    return parseInt(numeric?.[0] || "0", 10);
  }

  // Fall back to character gold on dashboard
  const characterGoldLocator = page.locator('[data-testid="character-gold"]');
  if (await characterGoldLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
    const text = (await characterGoldLocator.textContent()) || "";
    const numeric = text.match(/\d+/);
    return parseInt(numeric?.[0] || "0", 10);
  }

  return 0;
}

test.describe("Reward Redemption Approval Workflow", () => {
  test.beforeEach(async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    await navigateToDashboard(gmPage);
    await resetRewardState(gmPage);
  });

  test("GM sees pending redemptions section in RewardManager", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;
    const rewardName = uniqueRewardName("Approval Test Reward");

    await navigateToHeroTab(gmPage, "Reward Management");
    await createReward(gmPage, {
      name: rewardName,
      description: "Test redemption approval",
      type: "SCREEN_TIME",
      cost: 50,
    });

    await ensureGoldBalance(gmPage, 100);
    await navigateToHeroTab(gmPage, "Reward Store");
    await redeemRewardByName(gmPage, rewardName);

    await navigateToHeroTab(gmPage, "Reward Management");

    await expect(
      gmPage.locator('[data-testid="pending-redemptions-section"]'),
    ).toBeVisible();
    await expect(gmPage.locator("text=Pending Redemptions")).toBeVisible();
    await expect(
      gmPage.locator('[data-testid="pending-redemption-item"]'),
    ).toHaveCount(1);

    await denyRewardRedemption(gmPage, rewardName);
    await deleteReward(gmPage, rewardName);
  });

  test("GM can approve redemption", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    const rewardName = uniqueRewardName("Approve Test");

    await navigateToHeroTab(gmPage, "Reward Management");
    await createReward(gmPage, {
      name: rewardName,
      description: "Test approval",
      type: "PRIVILEGE",
      cost: 75,
    });

    await ensureGoldBalance(gmPage, 150);
    await navigateToHeroTab(gmPage, "Reward Store");
    await redeemRewardByName(gmPage, rewardName);

    await navigateToHeroTab(gmPage, "Reward Management");
    await approveRewardRedemption(gmPage, rewardName);

    await expect(
      gmPage.locator('[data-testid="pending-redemption-item"]'),
    ).toHaveCount(0);
    await expect(
      gmPage.locator('h3:has-text("Approved - Awaiting Fulfillment")'),
    ).toBeVisible();

    await markRedemptionFulfilled(gmPage, rewardName);
    await deleteReward(gmPage, rewardName);
  });

  test("GM can deny redemption and gold is refunded", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;
    const rewardName = uniqueRewardName("Deny Test");

    await navigateToHeroTab(gmPage, "Reward Management");
    await createReward(gmPage, {
      name: rewardName,
      description: "Test denial",
      type: "PURCHASE",
      cost: 60,
    });

    await ensureGoldBalance(gmPage, 100);
    await navigateToHeroTab(gmPage, "Reward Store");

    const goldBefore = await readGoldBalance(gmPage);
    await redeemRewardByName(gmPage, rewardName);

    // Wait for gold to be deducted
    await expect(async () => {
      const currentGold = await readGoldBalance(gmPage);
      expect(goldBefore - currentGold).toBeGreaterThanOrEqual(60);
    }).toPass({ timeout: 15000 });
    const goldAfterRedeem = await readGoldBalance(gmPage);
    expect(goldBefore - goldAfterRedeem).toBeGreaterThanOrEqual(60);

    await navigateToHeroTab(gmPage, "Reward Management");
    await denyRewardRedemption(gmPage, rewardName);

    await navigateToHeroTab(gmPage, "Reward Store");
    await expect(async () => {
      const currentGold = await readGoldBalance(gmPage);
      expect(currentGold).toBeGreaterThanOrEqual(goldBefore);
    }).toPass({ timeout: 15000 });
    const goldAfterDeny = await readGoldBalance(gmPage);
    expect(goldAfterDeny).toBeGreaterThanOrEqual(goldBefore);

    await navigateToHeroTab(gmPage, "Reward Management");
    await deleteReward(gmPage, rewardName);
  });

  test("GM can fulfill approved redemption", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    const rewardName = uniqueRewardName("Fulfill Test");

    await navigateToHeroTab(gmPage, "Reward Management");
    await createReward(gmPage, {
      name: rewardName,
      description: "Test fulfillment",
      type: "EXPERIENCE",
      cost: 80,
    });

    await ensureGoldBalance(gmPage, 150);
    await navigateToHeroTab(gmPage, "Reward Store");
    await redeemRewardByName(gmPage, rewardName);

    await navigateToHeroTab(gmPage, "Reward Management");
    await approveRewardRedemption(gmPage, rewardName);
    await markRedemptionFulfilled(gmPage, rewardName);

    await expect(
      gmPage.locator('h3:has-text("Redemption History")'),
    ).toBeVisible();

    await deleteReward(gmPage, rewardName);
  });

  test("Realtime updates when redemption status changes", async ({
    workerFamily,
  }) => {
    const { gmPage, gmContext } = workerFamily;
    const rewardName = uniqueRewardName("Realtime Test");

    await navigateToHeroTab(gmPage, "Reward Management");
    await createReward(gmPage, {
      name: rewardName,
      description: "Test realtime",
      type: "SCREEN_TIME",
      cost: 50,
    });

    await ensureGoldBalance(gmPage, 100);
    await navigateToHeroTab(gmPage, "Reward Store");
    await redeemRewardByName(gmPage, rewardName);

    const gmPageSecondTab = await gmContext.newPage();
    try {
      await navigateToDashboard(gmPageSecondTab);
      await navigateToHeroTab(gmPageSecondTab, "Reward Management");

      await expect(
        gmPageSecondTab.locator('[data-testid="pending-redemption-item"]'),
      ).toHaveCount(1);

      await navigateToHeroTab(gmPage, "Reward Management");
      await approveRewardRedemption(gmPage, rewardName);

      await waitForCountChange(
        gmPageSecondTab,
        '[data-testid="pending-redemption-item"]',
        0,
      );
    } finally {
      await gmPageSecondTab.close();
    }

    await markRedemptionFulfilled(gmPage, rewardName);
    await deleteReward(gmPage, rewardName);
  });

  test("Hero sees status change in redemption history", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;
    const rewardName = uniqueRewardName("Hero View Test");

    await navigateToHeroTab(gmPage, "Reward Management");
    await createReward(gmPage, {
      name: rewardName,
      description: "Test hero view",
      type: "PRIVILEGE",
      cost: 50,
    });

    await ensureGoldBalance(gmPage, 100);
    await navigateToHeroTab(gmPage, "Reward Store");
    await redeemRewardByName(gmPage, rewardName);

    await expect(
      gmPage.locator('button:has-text("Request Pending")'),
    ).toBeVisible();

    await navigateToHeroTab(gmPage, "Reward Management");
    await approveRewardRedemption(gmPage, rewardName);

    await navigateToHeroTab(gmPage, "Reward Store");
    await expect(
      gmPage.locator('button:has-text("Request Pending")'),
    ).not.toBeVisible();

    await navigateToHeroTab(gmPage, "Reward Management");
    await markRedemptionFulfilled(gmPage, rewardName);
    await deleteReward(gmPage, rewardName);
  });
});
