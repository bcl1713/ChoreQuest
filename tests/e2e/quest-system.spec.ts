import { test, expect } from '@playwright/test';
import { setupUserWithCharacter, commonBeforeEach } from './helpers/setup-helpers';

test.describe('Quest System', () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test('Guild Master can create custom quests', async ({ page }) => {
    await setupUserWithCharacter(page, 'QuestMaster');

    // Verify Quest Dashboard is visible
    await expect(page.getByText('Quest Dashboard')).toBeVisible();
    await expect(page.getByText('🗡️ My Quests')).toBeVisible();
    await expect(page.getByText('⚡ Create Quest')).toBeVisible();

    // Open quest creation modal
    await page.locator('header button:has-text("⚡ Create Quest")').click();
    await expect(page.getByText('Create New Quest')).toBeVisible();

    // Switch to Custom Quest mode
    await page.click('text=Custom Quest');

    // Fill quest details
    await page.fill('input[placeholder="Enter quest title..."]', 'Test Custom Quest');
    await page.fill('textarea[placeholder="Describe the quest..."]', 'Test quest for automation');

    // Verify difficulty defaults to Easy
    await expect(page.locator('select').filter({ has: page.locator('option[value="EASY"]') })).toHaveValue('EASY');

    // Set rewards
    await page.fill('input[type="number"]:near(:text("XP Reward"))', '25');
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', '10');

    // Submit quest
    await page.locator('.fantasy-card button:has-text("⚡ Create Quest")').click();

    // Verify quest creation success
    await expect(page.getByText('Create New Quest')).not.toBeVisible();
    await expect(page.getByText('Test Custom Quest')).toBeVisible();
    await expect(page.getByText('Test quest for automation')).toBeVisible();
  });

  test('quest dashboard displays correctly', async ({ page }) => {
    await setupUserWithCharacter(page, 'QuestDashboard', { characterClass: 'MAGE' });

    // Verify quest dashboard elements
    await expect(page.getByText('Quest Dashboard')).toBeVisible();
    await expect(page.getByText('🗡️ My Quests')).toBeVisible();
    await expect(page.getByText('No active quests. Ready for adventure?')).toBeVisible();
    await expect(page.getByText('⚡ Create Quest')).toBeVisible();
  });

  test('quest creation modal validation', async ({ page }) => {
    await setupUserWithCharacter(page, 'QuestValidation', { characterClass: 'RANGER' });

    // Open quest creation modal
    await page.locator('header button:has-text("⚡ Create Quest")').click();
    await expect(page.getByText('Create New Quest')).toBeVisible();
    await page.click('text=Custom Quest');

    // Try submitting empty form - should stay open
    await page.locator('.fantasy-card button:has-text("⚡ Create Quest")').click();
    await expect(page.getByText('Create New Quest')).toBeVisible();

    // Fill title only - should still stay open
    await page.fill('input[placeholder="Enter quest title..."]', 'Valid Quest Title');
    await page.locator('.fantasy-card button:has-text("⚡ Create Quest")').click();
    await expect(page.getByText('Create New Quest')).toBeVisible();

    // Add description - should now succeed
    await page.fill('textarea[placeholder="Describe the quest..."]', 'Valid quest description');
    await page.locator('.fantasy-card button:has-text("⚡ Create Quest")').click();

    // Verify success
    await expect(page.getByText('Create New Quest')).not.toBeVisible();
    await expect(page.getByText('Valid Quest Title')).toBeVisible();
  });

  test('quest creation modal can be cancelled', async ({ page }) => {
    await setupUserWithCharacter(page, 'QuestCancel', { characterClass: 'HEALER' });

    // Open quest creation modal
    await page.locator('header button:has-text("⚡ Create Quest")').click();
    await expect(page.getByText('Create New Quest')).toBeVisible();
    await page.click('text=Custom Quest');

    // Fill some data then cancel
    await page.fill('input[placeholder="Enter quest title..."]', 'This will be cancelled');
    await page.locator('.fixed button:has-text("Cancel")').click();

    // Verify cancellation
    await expect(page.getByText('Create New Quest')).not.toBeVisible();
    await expect(page.getByText('This will be cancelled')).not.toBeVisible();
  });
});