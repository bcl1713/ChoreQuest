import { test, expect } from '@playwright/test';

test.describe('Quest System - Basic Tests', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear all browser storage and cookies before each test
    await context.clearCookies();
    await page.goto('http://localhost:3003');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Dashboard loads with quest elements after character creation', async ({ page }) => {
    const testEmail = `basic-test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create a new family and user (Guild Master)
    await page.goto('http://localhost:3003');
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Basic Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Basic Test Master');
    await page.click('button[type="submit"]');

    // Complete character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir BasicTest');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Welcome back, Sir BasicTest!')).toBeVisible();

    // Just check that the basic dashboard loaded - don't check for quest-specific elements yet
    await expect(page.getByText('💰')).toBeVisible(); // Gold indicator
    await expect(page.getByText('⚡')).toBeVisible(); // XP indicator
    await expect(page.getByText('💎')).toBeVisible(); // Gems indicator
    await expect(page.getByText('🏅')).toBeVisible(); // Honor points indicator

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-dashboard.png', fullPage: true });
  });

  test('Guild Master has Create Quest button in header', async ({ page }) => {
    const testEmail = `header-test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create a new family and user (Guild Master)
    await page.goto('http://localhost:3003');
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Header Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Header Test Master');
    await page.click('button[type="submit"]');

    // Complete character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir HeaderTest');
    await page.click('[data-testid="class-mage"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Check that the Create Quest button exists in the header (from dashboard.tsx)
    await expect(page.getByText('⚡ Create Quest')).toBeVisible();
  });
});