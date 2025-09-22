import { test, expect } from '@playwright/test';

test.describe('Quest Dashboard - Simple Test', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear all browser storage and cookies before each test
    await context.clearCookies();
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Quest Dashboard loads with all elements', async ({ page }) => {
    console.log('✅ [Setup] Starting quest dashboard simple test');
    const testEmail = `dashboard-simple-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create a new family and user (Guild Master)
    await page.goto('http://localhost:3000');
    await page.screenshot({ path: 'test-quest-dashboard-simple-setup.png' });
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Dashboard Simple Test');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Dashboard Simple Master');
    await page.click('button[type="submit"]');

    // Complete character creation
    console.log('✅ [Action] Completing character creation for dashboard test');
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir SimpleTest');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Welcome back, Sir SimpleTest!')).toBeVisible();

    // Wait a bit for the quest service to load
    console.log('✅ [Action] Waiting for quest dashboard to fully load');
    await page.waitForTimeout(2000);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-quest-dashboard-simple-action.png', fullPage: true });

    // Check for quest dashboard elements - use more specific selectors
    console.log('✅ [Verification] Validating quest dashboard elements');
    await expect(page.locator('h2:has-text("Quest Dashboard")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3:has-text("🗡️ My Quests")')).toBeVisible();

    // Should see "No active quests" message for new user
    await expect(page.getByText('No active quests. Ready for adventure?')).toBeVisible();

    // Should have Create Quest button
    await expect(page.getByText('⚡ Create Quest')).toBeVisible();

    await page.screenshot({ path: 'test-quest-dashboard-simple-verification.png' });
    console.log('✅ [Verification] Quest Dashboard loaded successfully!');
  });
});