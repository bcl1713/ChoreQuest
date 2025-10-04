import { test, expect } from '@playwright/test';
import { setupUserWithCharacter, commonBeforeEach } from './helpers/setup-helpers';
import { createCustomQuest } from './helpers/quest-helpers';
import { openQuestCreationModal, closeModal } from './helpers/navigation-helpers';
import { expectOnDashboard } from './helpers/assertions';

test.describe('Quest System', () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test('Guild Master can create custom quests', async ({ page }) => {
    await setupUserWithCharacter(page, 'QuestMaster');

    // Verify Quest Dashboard is visible
    await expectOnDashboard(page);
    await expect(page.getByText('🗡️ My Quests')).toBeVisible();
    await expect(page.getByText('⚡ Create Quest')).toBeVisible();

    // Create custom quest using helper
    await createCustomQuest(page, {
      title: 'Test Custom Quest',
      description: 'Test quest for automation',
      difficulty: 'EASY',
      xpReward: 25,
      goldReward: 10,
    });

    // Verify quest appears in list
    await expect(page.getByRole('heading', { name: 'Test Custom Quest' }).first()).toBeVisible();
    await expect(page.getByText('Test quest for automation').first()).toBeVisible();
  });

  test('quest dashboard displays correctly', async ({ page }) => {
    await setupUserWithCharacter(page, 'QuestDashboard', { characterClass: 'MAGE' });

    // Verify quest dashboard elements
    await expectOnDashboard(page);
    await expect(page.getByText('🗡️ My Quests')).toBeVisible();
    await expect(page.getByText('No active quests. Ready for adventure?')).toBeVisible();
    await expect(page.getByText('⚡ Create Quest')).toBeVisible();
  });

  test('quest creation modal validation', async ({ page }) => {
    await setupUserWithCharacter(page, 'QuestValidation', { characterClass: 'RANGER' });

    // Open quest creation modal
    await openQuestCreationModal(page);
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
    await expect(page.getByRole('heading', { name: 'Valid Quest Title' }).first()).toBeVisible();
  });

  test('quest creation modal can be cancelled', async ({ page }) => {
    await setupUserWithCharacter(page, 'QuestCancel', { characterClass: 'HEALER' });

    // Open quest creation modal
    await openQuestCreationModal(page);
    await page.click('text=Custom Quest');

    // Fill some data
    await page.fill('input[placeholder="Enter quest title..."]', 'This will be cancelled');

    // Cancel modal by clicking Cancel button
    await page.click('button:has-text("Cancel")');

    // Verify cancellation
    await expect(page.getByText('Create New Quest')).not.toBeVisible();
    await expect(page.getByText('This will be cancelled')).not.toBeVisible();
  });
});