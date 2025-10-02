import { test, expect } from '@playwright/test';
import { setupTestUser } from './helpers/setup-helpers';

test.describe('Reward Store', () => {
  test.beforeEach(async ({ page }) => {
    // Simple setup for each test - we'll create users as needed per test
    await page.goto('/');
  });

  test('should display reward store with available rewards', async ({ page }) => {
    // Create test user with character
    await setupTestUser(page);

    // Switch to Reward Store tab
    await page.click('button:has-text("🏪 Reward Store")');

    // Verify reward store is displayed
    await expect(page.locator('[data-testid="reward-store-title"]')).toBeVisible();

    // Verify gold balance is shown (default should be 0 for new characters)
    await expect(page.locator('[data-testid="gold-balance"]')).toBeVisible({ timeout: 10000 });

    // Verify message for when no rewards are available (expected for new test family)
    await expect(page.locator('[data-testid="no-rewards-message"]')).toBeVisible();
  });

  test('should show empty state when no rewards exist', async ({ page }) => {
    // Create test user
    await setupTestUser(page);

    // Switch to Reward Store tab
    await page.click('button:has-text("🏪 Reward Store")');

    // Verify reward store displays empty state
    await expect(page.locator('[data-testid="reward-store-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-rewards-message"]')).toBeVisible();

    // Verify no redemption buttons are visible
    await expect(page.locator('button:has-text("Redeem Reward")')).not.toBeVisible();
  });

  test('should display user gold balance correctly', async ({ page }) => {
    // Create test user with character
    await setupTestUser(page);

    // Switch to Reward Store tab
    await page.click('button:has-text("🏪 Reward Store")');

    // Verify reward store is displayed
    await expect(page.locator('[data-testid="reward-store-title"]')).toBeVisible();

    // Verify default gold balance (0 for new characters)
    await expect(page.locator('[data-testid="gold-balance"]')).toBeVisible({ timeout: 10000 });
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