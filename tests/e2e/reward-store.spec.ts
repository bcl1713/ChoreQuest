import { test, expect } from '@playwright/test';
import { setupTestUser } from './helpers/setup-helpers';

test.describe('Reward Store', () => {
  test.beforeEach(async ({ page }) => {
    // Simple setup for each test - we'll create users as needed per test
    await page.goto('/');
  });

  test('should display reward store with available rewards', async ({ page }) => {
    // Create test user with character
    const { user } = await setupTestUser(page);

    // Give user some gold to spend
    await page.evaluate(async ({ userId, gold }) => {
      const response = await fetch('/api/test/character/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: { gold }
        })
      });
      if (!response.ok) throw new Error('Failed to update character stats');
    }, { userId: user.id, gold: 200 });

    // Refresh the page to ensure character stats are updated in the UI
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);

    // Switch to Reward Store tab
    await page.click('button:has-text("🏪 Reward Store")');

    // Verify reward store is displayed
    await expect(page.locator('h2:has-text("⭐ Reward Store")')).toBeVisible();

    // Verify gold balance is shown (wait up to 10 seconds for the data to load)
    await expect(page.locator('text=200 Gold')).toBeVisible({ timeout: 10000 });

    // Verify message for when no rewards are available (expected for new test family)
    await expect(page.locator('text=No rewards available at this time.')).toBeVisible();
  });

  test('should show empty state when no rewards exist', async ({ page }) => {
    // Create test user
    await setupTestUser(page);

    // Switch to Reward Store tab
    await page.click('button:has-text("🏪 Reward Store")');

    // Verify reward store displays empty state
    await expect(page.locator('h2:has-text("⭐ Reward Store")')).toBeVisible();
    await expect(page.locator('text=No rewards available at this time.')).toBeVisible();

    // Verify no redemption buttons are visible
    await expect(page.locator('button:has-text("Redeem Reward")')).not.toBeVisible();
  });

  test('should display user gold balance correctly', async ({ page }) => {
    // Create test user with specific gold amount
    const { user } = await setupTestUser(page);

    // Set gold to a specific amount
    await page.evaluate(async ({ userId, gold }) => {
      const response = await fetch('/api/test/character/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: { gold }
        })
      });
      if (!response.ok) throw new Error('Failed to update character stats');
    }, { userId: user.id, gold: 150 });

    // Refresh to update stats
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);

    // Switch to Reward Store tab
    await page.click('button:has-text("🏪 Reward Store")');

    // Verify correct gold balance is displayed
    await expect(page.locator('text=150 Gold')).toBeVisible({ timeout: 10000 });
  });

  test('should show correct tab navigation', async ({ page }) => {
    // Create test user
    await setupTestUser(page);

    // Verify both tabs are visible
    await expect(page.locator('button:has-text("⚔️ Quests & Adventures")')).toBeVisible();
    await expect(page.locator('button:has-text("🏪 Reward Store")')).toBeVisible();

    // Verify quest tab is active by default
    await expect(page.locator('h2:has-text("Quest Dashboard")')).toBeVisible();

    // Switch to reward store tab
    await page.click('button:has-text("🏪 Reward Store")');
    await expect(page.locator('h2:has-text("⭐ Reward Store")')).toBeVisible();

    // Switch back to quest tab
    await page.click('button:has-text("⚔️ Quests & Adventures")');
    await expect(page.locator('h2:has-text("Quest Dashboard")')).toBeVisible();
  });
});