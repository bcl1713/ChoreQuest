import { test, expect, Page, BrowserContext } from '@playwright/test';
import { setupUserWithCharacter, loginUser } from './helpers/setup-helpers';

test.describe('Reward Realtime Updates', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;
  let testUser: { email: string; password: string };

  test.beforeEach(async ({ browser }) => {
    // Create two browser contexts to simulate two tabs
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // Setup family and login as Guild Master in first context
    testUser = await setupUserWithCharacter(page1, 'guildmaster-rewards');

    // Login as the same Guild Master in second context
    await loginUser(page2, testUser.email, testUser.password);

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
    await context1.close();
    await context2.close();
  });

  test('Reward creation appears in real-time across browser windows', async () => {
    // Page 1: Create a new reward
    await page1.click('[data-testid="create-reward-button"]');
    await page1.fill('[data-testid="reward-name-input"]', 'Realtime Reward');
    await page1.fill('[data-testid="reward-description-input"]', 'Created in real-time');
    await page1.selectOption('[data-testid="reward-type-select"]', 'EXPERIENCE');
    await page1.fill('[data-testid="reward-cost-input"]', '150');
    await page1.click('[data-testid="save-reward-button"]');

    // Wait for modal to close on page 1
    await expect(page1.getByTestId('create-reward-modal')).not.toBeVisible();

    // Verify reward appears in page1
    const rewardCard1 = page1.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Realtime Reward',
    });
    await expect(rewardCard1).toBeVisible();

    // Page 2: Verify reward appears automatically via realtime subscription
    const rewardCard2 = page2.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Realtime Reward',
    });
    await expect(rewardCard2).toBeVisible({ timeout: 5000 });
  });

  test('Reward updates appear in real-time', async () => {
    // Page 1: Create a reward first
    await page1.click('[data-testid="create-reward-button"]');
    await page1.fill('[data-testid="reward-name-input"]', 'Update Test');
    await page1.fill('[data-testid="reward-description-input"]', 'Original description');
    await page1.selectOption('[data-testid="reward-type-select"]', 'PRIVILEGE');
    await page1.fill('[data-testid="reward-cost-input"]', '100');
    await page1.click('[data-testid="save-reward-button"]');

    // Wait for reward to appear on both pages
    await expect(
      page1.locator('[data-testid^="reward-card-"]').filter({ hasText: 'Update Test' })
    ).toBeVisible();
    await expect(
      page2.locator('[data-testid^="reward-card-"]').filter({ hasText: 'Update Test' })
    ).toBeVisible({ timeout: 5000 });

    // Page 1: Edit the reward
    const rewardCard1 = page1.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Update Test',
    });
    await rewardCard1.locator('[data-testid="edit-reward-button"]').click();
    await page1.fill('[data-testid="reward-name-input"]', 'Updated Reward Name');
    await page1.fill('[data-testid="reward-cost-input"]', '200');
    await page1.click('[data-testid="save-reward-button"]');

    // Wait for modal to close on page 1
    await expect(page1.getByTestId('edit-reward-modal')).not.toBeVisible();

    // Page 2: Verify update appears automatically
    const updatedCard2 = page2.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Updated Reward Name',
    });
    await expect(updatedCard2).toBeVisible({ timeout: 5000 });
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

    // Wait for reward to appear on both pages
    await expect(
      page1.locator('[data-testid^="reward-card-"]').filter({ hasText: 'Delete Test' })
    ).toBeVisible();
    await expect(
      page2.locator('[data-testid^="reward-card-"]').filter({ hasText: 'Delete Test' })
    ).toBeVisible({ timeout: 5000 });

    // Page 1: Delete the reward
    const rewardCard1 = page1.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Delete Test',
    });
    await rewardCard1.locator('[data-testid="delete-reward-button"]').click();
    await page1.click('[data-testid="confirm-delete-button"]');

    // Verify reward is deactivated on page1 (soft delete - shown with opacity-50)
    await expect(rewardCard1).toHaveClass(/opacity-50/);

    // Page 2: Verify reward is deactivated automatically (soft delete)
    const rewardCard2 = page2.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Delete Test',
    });
    await expect(rewardCard2).toHaveClass(/opacity-50/, { timeout: 5000 });
  });
});
