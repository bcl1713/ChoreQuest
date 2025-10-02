import { test, expect, Browser } from '@playwright/test';
import { setupUserWithCharacter } from './helpers/setup-helpers';

test.describe('Reward Realtime Updates', () => {
  test('Reward creation appears in real-time across browser windows', async ({ browser }) => {
    // Create two browser contexts (simulating two users in same family)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup first user (Guild Master)
      const familyInfo = await setupUserWithCharacter(page1, 'reward-realtime-1', {
        characterClass: 'KNIGHT',
      });

      // Navigate to reward management
      await page1.click('text=Reward Management');
      await expect(page1.getByTestId('reward-manager')).toBeVisible();

      // Get family code from page1
      await page1.goto('/dashboard');
      const familyCodeElement = await page1
        .locator('text=/Guild:.*\\([A-Z0-9]{6}\\)/')
        .first();
      const familyCodeText = await familyCodeElement.textContent();
      const codeMatch = familyCodeText!.match(/\(([A-Z0-9]{6})\)/);
      const familyCode = codeMatch![1];

      // Setup second user in same family
      await page2.goto('/auth/login');
      await page2.click('text=Create Account');
      await page2.fill('input[type="email"]', 'reward-realtime-2@example.com');
      await page2.fill('input[type="password"]', 'password123');
      await page2.fill('input[name="name"]', 'User Two');
      await page2.click('button[type="submit"]');

      // Join the same family
      await page2.waitForURL(/.*character/);
      await page2.click('text=Join Existing Family');
      await page2.fill('input[placeholder*="family code" i]', familyCode);
      await page2.click('button:has-text("Join Family")');

      // Create character for second user
      await page2.fill('input[placeholder*="character name" i]', 'Character Two');
      await page2.click('text=MAGE');
      await page2.click('button:has-text("Create Character")');

      // Navigate both to reward management
      await page2.click('text=Reward Management');
      await page1.click('text=Reward Management');

      await expect(page1.getByTestId('reward-manager')).toBeVisible();
      await expect(page2.getByTestId('reward-manager')).toBeVisible();

      // Create reward in page1
      await page1.click('[data-testid="create-reward-button"]');
      await page1.fill('[data-testid="reward-name-input"]', 'Realtime Reward');
      await page1.fill('[data-testid="reward-description-input"]', 'Created in real-time');
      await page1.selectOption('[data-testid="reward-type-select"]', 'EXPERIENCE');
      await page1.fill('[data-testid="reward-cost-input"]', '150');
      await page1.click('[data-testid="save-reward-button"]');

      // Verify reward appears in page1
      const rewardCard1 = page1.locator('[data-testid^="reward-card-"]').filter({
        hasText: 'Realtime Reward',
      });
      await expect(rewardCard1).toBeVisible();

      // Verify reward appears in page2 via realtime subscription
      const rewardCard2 = page2.locator('[data-testid^="reward-card-"]').filter({
        hasText: 'Realtime Reward',
      });
      await expect(rewardCard2).toBeVisible({ timeout: 10000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('Reward updates appear in real-time', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup first user
      await setupUserWithCharacter(page1, 'reward-update-1', { characterClass: 'ROGUE' });

      // Navigate and get family code
      await page1.click('text=Reward Management');
      await page1.goto('/dashboard');
      const familyCodeElement = await page1
        .locator('text=/Guild:.*\\([A-Z0-9]{6}\\)/')
        .first();
      const familyCodeText = await familyCodeElement.textContent();
      const familyCode = familyCodeText!.match(/\(([A-Z0-9]{6})\)/)![1];

      // Setup second user
      await page2.goto('/auth/login');
      await page2.click('text=Create Account');
      await page2.fill('input[type="email"]', 'reward-update-2@example.com');
      await page2.fill('input[type="password"]', 'password123');
      await page2.fill('input[name="name"]', 'User Two');
      await page2.click('button[type="submit"]');

      await page2.waitForURL(/.*character/);
      await page2.click('text=Join Existing Family');
      await page2.fill('input[placeholder*="family code" i]', familyCode);
      await page2.click('button:has-text("Join Family")');

      await page2.fill('input[placeholder*="character name" i]', 'Character Two');
      await page2.click('text=HEALER');
      await page2.click('button:has-text("Create Character")');

      // Navigate both to rewards
      await page1.click('text=Reward Management');
      await page2.click('text=Reward Management');

      // Create reward in page1
      await page1.click('[data-testid="create-reward-button"]');
      await page1.fill('[data-testid="reward-name-input"]', 'Update Test');
      await page1.fill('[data-testid="reward-description-input"]', 'Original description');
      await page1.selectOption('[data-testid="reward-type-select"]', 'PRIVILEGE');
      await page1.fill('[data-testid="reward-cost-input"]', '100');
      await page1.click('[data-testid="save-reward-button"]');

      // Wait for reward to appear in both pages
      await expect(
        page1.locator('[data-testid^="reward-card-"]').filter({ hasText: 'Update Test' })
      ).toBeVisible();
      await expect(
        page2.locator('[data-testid^="reward-card-"]').filter({ hasText: 'Update Test' })
      ).toBeVisible({ timeout: 10000 });

      // Edit reward in page1
      const rewardCard1 = page1.locator('[data-testid^="reward-card-"]').filter({
        hasText: 'Update Test',
      });
      await rewardCard1.locator('[data-testid="edit-reward-button"]').click();
      await page1.fill('[data-testid="reward-name-input"]', 'Updated Reward Name');
      await page1.fill('[data-testid="reward-cost-input"]', '200');
      await page1.click('[data-testid="save-reward-button"]');

      // Verify update appears in page2
      const updatedCard2 = page2.locator('[data-testid^="reward-card-"]').filter({
        hasText: 'Updated Reward Name',
      });
      await expect(updatedCard2).toBeVisible({ timeout: 10000 });
      await expect(updatedCard2.getByText('200 gold')).toBeVisible();
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('Reward deletion appears in real-time', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup first user
      await setupUserWithCharacter(page1, 'reward-delete-1', { characterClass: 'KNIGHT' });

      // Get family code
      await page1.click('text=Reward Management');
      await page1.goto('/dashboard');
      const familyCodeText = await page1
        .locator('text=/Guild:.*\\([A-Z0-9]{6}\\)/')
        .first()
        .textContent();
      const familyCode = familyCodeText!.match(/\(([A-Z0-9]{6})\)/)![1];

      // Setup second user
      await page2.goto('/auth/login');
      await page2.click('text=Create Account');
      await page2.fill('input[type="email"]', 'reward-delete-2@example.com');
      await page2.fill('input[type="password"]', 'password123');
      await page2.fill('input[name="name"]', 'User Two');
      await page2.click('button[type="submit"]');

      await page2.waitForURL(/.*character/);
      await page2.click('text=Join Existing Family');
      await page2.fill('input[placeholder*="family code" i]', familyCode);
      await page2.click('button:has-text("Join Family")');

      await page2.fill('input[placeholder*="character name" i]', 'Character Two');
      await page2.click('text=RANGER');
      await page2.click('button:has-text("Create Character")');

      // Navigate to rewards
      await page1.click('text=Reward Management');
      await page2.click('text=Reward Management');

      // Create reward
      await page1.click('[data-testid="create-reward-button"]');
      await page1.fill('[data-testid="reward-name-input"]', 'Delete Test');
      await page1.fill('[data-testid="reward-description-input"]', 'Will be deleted');
      await page1.selectOption('[data-testid="reward-type-select"]', 'PURCHASE');
      await page1.fill('[data-testid="reward-cost-input"]', '50');
      await page1.click('[data-testid="save-reward-button"]');

      // Wait for reward in both pages
      await expect(
        page1.locator('[data-testid^="reward-card-"]').filter({ hasText: 'Delete Test' })
      ).toBeVisible();
      await expect(
        page2.locator('[data-testid^="reward-card-"]').filter({ hasText: 'Delete Test' })
      ).toBeVisible({ timeout: 10000 });

      // Delete reward in page1
      const rewardCard1 = page1.locator('[data-testid^="reward-card-"]').filter({
        hasText: 'Delete Test',
      });
      await rewardCard1.locator('[data-testid="delete-reward-button"]').click();
      await page1.click('[data-testid="confirm-delete-button"]');

      // Verify reward disappears from page1
      await expect(rewardCard1).not.toBeVisible();

      // Verify reward disappears from page2 via realtime
      const rewardCard2 = page2.locator('[data-testid^="reward-card-"]').filter({
        hasText: 'Delete Test',
      });
      await expect(rewardCard2).not.toBeVisible({ timeout: 10000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
