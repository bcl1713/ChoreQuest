import { test, expect } from '@playwright/test';

test.describe('Quest Debug', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear all browser storage and cookies before each test
    await context.clearCookies();
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Debug quest dashboard loading', async ({ page }) => {
    console.log('✅ [Setup] Starting quest dashboard debug test');
    const testEmail = `debug-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create a new family and user (Guild Master)
    await page.goto('http://localhost:3000');
    await page.screenshot({ path: 'test-quest-debug-setup.png' });
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Debug Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Debug Test Master');
    await page.click('button[type="submit"]');

    // Complete character creation
    console.log('✅ [Action] Completing character creation for debug test');
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir Debug');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Welcome back, Sir Debug!')).toBeVisible();

    // Wait for quest loading to complete
    console.log('✅ [Action] Waiting for quest system to fully load');
    await page.waitForTimeout(3000);

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-quest-debug-action.png', fullPage: true });

    // Check what's actually rendered
    console.log('🔍 [Debug] Analyzing page content for quest system state');
    const pageContent = await page.textContent('body');
    console.log('🔍 [Debug] Page content contains "Quest Dashboard":', pageContent?.includes('Quest Dashboard'));
    console.log('🔍 [Debug] Page content contains error "⚠️":', pageContent?.includes('⚠️'));
    console.log('🔍 [Debug] Page content contains "Loading quests":', pageContent?.includes('Loading quests'));

    // Check for any of these states
    console.log('✅ [Verification] Checking quest dashboard state indicators');
    const hasQuestDashboard = await page.locator('text=Quest Dashboard').isVisible().catch(() => false);
    const hasError = await page.locator('text=⚠️').isVisible().catch(() => false);
    const hasLoading = await page.locator('text=Loading quests').isVisible().catch(() => false);

    console.log('✅ [Verification] Has Quest Dashboard:', hasQuestDashboard);
    console.log('✅ [Verification] Has Error:', hasError);
    console.log('✅ [Verification] Has Loading:', hasLoading);

    if (hasError) {
      // Look for the full error message
      const errorDiv = await page.locator('.bg-red-600\\/20').textContent();
      console.log('❗ [Error] Full error message:', errorDiv);
    }

    // The quest service should load in one of these states
    console.log('✅ [Verification] Validating quest service loaded in some state');
    expect(hasQuestDashboard || hasError || hasLoading).toBe(true);

    await page.screenshot({ path: 'test-quest-debug-verification.png' });
    console.log('✅ [Verification] Quest dashboard debug test completed successfully');
  });
});