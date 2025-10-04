import { test, expect, Page, BrowserContext } from '@playwright/test';
import {
  setupTwoContextTest,
  cleanupTwoContextTest,
  waitForNewListItem,
  waitForListItemRemoved,
} from './helpers/realtime-helpers';

test.describe('Reward Realtime Updates', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    // Setup two-context test for realtime updates
    const setup = await setupTwoContextTest(browser, 'guildmaster-rewards');
    context1 = setup.context1;
    context2 = setup.context2;
    page1 = setup.page1;
    page2 = setup.page2;

    // Navigate both pages to Reward Management
    await page1.goto('http://localhost:3000/dashboard');
    await page1.waitForLoadState('networkidle');
    await page1.click('text=Reward Management');
    await page1.waitForSelector('[data-testid="reward-manager"]');

    await page2.goto('http://localhost:3000/dashboard');
    await page2.waitForLoadState('networkidle');
    await page2.click('text=Reward Management');
    await page2.waitForSelector('[data-testid="reward-manager"]');
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
