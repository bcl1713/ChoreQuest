import type { Page, BrowserContext } from "@playwright/test";
import { test, expect } from "./helpers/family-fixture";
import {
  setupTwoContextTest,
  cleanupTwoContextTest,
  waitForNewListItem,
  waitForListItemRemoved,
} from "./helpers/realtime-helpers";
import type { ExistingUserOptions } from "./helpers/realtime-helpers";
import { navigateToDashboard, navigateToHeroTab } from "./helpers/navigation-helpers";
import { deleteReward } from "./helpers/reward-helpers";

async function resetRewardManagement(gmPage: Page): Promise<void> {
  await navigateToDashboard(gmPage);
  await navigateToHeroTab(gmPage, "Reward Management");

  const pendingRedemptions = gmPage.locator(
    '[data-testid="pending-redemption-item"]',
  );
  while (await pendingRedemptions.count()) {
    await pendingRedemptions
      .first()
      .locator('[data-testid="deny-redemption-button"]')
      .click();
    await gmPage.waitForLoadState("networkidle");
  }

  const approvedRedemptions = gmPage.locator(
    '[data-testid="approved-redemption-item"]',
  );
  while (await approvedRedemptions.count()) {
    await approvedRedemptions
      .first()
      .locator('[data-testid="fulfill-redemption-button"]')
      .click();
    await gmPage.waitForLoadState("networkidle");
  }

  const rewardCards = gmPage.locator('[data-testid^="reward-card-"]');
  while (await rewardCards.count()) {
    const name = (await rewardCards.first().locator("h3").textContent())?.trim();
    if (!name) break;
    await deleteReward(gmPage, name);
  }

  await navigateToHeroTab(gmPage, "Quests & Adventures");
}

test.describe('Reward Realtime Updates', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser, workerFamily }) => {
    const { gmPage, gmEmail, gmPassword } = workerFamily;

    await resetRewardManagement(gmPage);

    const gmCredentials: ExistingUserOptions = {
      email: gmEmail,
      password: gmPassword,
    };

    const setup = await setupTwoContextTest(browser, gmCredentials);
    context1 = setup.context1;
    context2 = setup.context2;
    page1 = setup.page1;
    page2 = setup.page2;

    await navigateToDashboard(page1);
    await navigateToHeroTab(page1, "Reward Management");
    await expect(page1.getByTestId("reward-manager")).toBeVisible({
      timeout: 15000,
    });

    await navigateToDashboard(page2);
    await navigateToHeroTab(page2, "Reward Management");
    await expect(page2.getByTestId("reward-manager")).toBeVisible({
      timeout: 15000,
    });
  });

  test.afterEach(async () => {
    await cleanupTwoContextTest(context1, context2);
  });

  test('Reward creation appears in real-time across browser windows', async () => {
    // Page 1: Create a new reward
    await page1.click('[data-testid="create-reward-button"]');
    await page1.fill('[data-testid="reward-name-input"]', 'Realtime Reward');
    await page1.fill('[data-testid="reward-description-input"]', 'Created in real-time');
    await page1.selectOption('[data-testid="reward-type-select"]', 'EXPERIENCE');
    await page1.fill('[data-testid="reward-cost-input"]', '150');
    await page1.click('[data-testid="save-reward-button"]');
    await expect(page1.getByTestId('create-reward-modal')).not.toBeVisible();

    // Verify reward appears in page1
    const rewardCard1 = page1.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Realtime Reward',
    });
    await expect(rewardCard1).toBeVisible();

    // Page 2: Wait for realtime update
    await waitForNewListItem(page2, 'Realtime Reward');

    // Cleanup
    await deleteReward(page1, 'Realtime Reward');
    await waitForListItemRemoved(page2, 'Realtime Reward');
  });

  test('Reward updates appear in real-time', async () => {
    // Page 1: Create a reward first
    await page1.click('[data-testid="create-reward-button"]');
    await page1.fill('[data-testid="reward-name-input"]', 'Update Test');
    await page1.fill('[data-testid="reward-description-input"]', 'Original description');
    await page1.selectOption('[data-testid="reward-type-select"]', 'PRIVILEGE');
    await page1.fill('[data-testid="reward-cost-input"]', '100');
    await page1.click('[data-testid="save-reward-button"]');
    await expect(
      page1.locator('[data-testid^="reward-card-"]').filter({ hasText: 'Update Test' })
    ).toBeVisible();
    await waitForNewListItem(page2, 'Update Test');

    // Page 1: Edit the reward
    const rewardCard1 = page1.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Update Test',
    });
    await rewardCard1.locator('[data-testid="edit-reward-button"]').click();
    await page1.fill('[data-testid="reward-name-input"]', 'Updated Reward Name');
    await page1.fill('[data-testid="reward-cost-input"]', '200');
    await page1.click('[data-testid="save-reward-button"]');
    await expect(page1.getByTestId('edit-reward-modal')).not.toBeVisible();

    // Page 2: Wait for realtime update
    await waitForNewListItem(page2, 'Updated Reward Name');
    const updatedCard2 = page2.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Updated Reward Name',
    });
    await expect(updatedCard2.getByText('200 gold')).toBeVisible();

    // Cleanup
    await deleteReward(page1, 'Updated Reward Name');
    await waitForListItemRemoved(page2, 'Updated Reward Name');
  });

  test('Reward deletion appears in real-time', async () => {
    // Page 1: Create a reward first
    await page1.click('[data-testid="create-reward-button"]');
    await page1.fill('[data-testid="reward-name-input"]', 'Delete Test');
    await page1.fill('[data-testid="reward-description-input"]', 'Will be deleted');
    await page1.selectOption('[data-testid="reward-type-select"]', 'PURCHASE');
    await page1.fill('[data-testid="reward-cost-input"]', '50');
    await page1.click('[data-testid="save-reward-button"]');
    await expect(
      page1.locator('[data-testid^="reward-card-"]').filter({ hasText: 'Delete Test' })
    ).toBeVisible();
    await waitForNewListItem(page2, 'Delete Test');

    // Page 1: Delete the reward
    const rewardCard1 = page1.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Delete Test',
    });
    await rewardCard1.locator('[data-testid="delete-reward-button"]').click();
    await page1.click('[data-testid="confirm-delete-button"]');
    await expect(rewardCard1).not.toBeVisible();

    // Page 2: Wait for realtime deletion
    await waitForListItemRemoved(page2, 'Delete Test');
  });
});
