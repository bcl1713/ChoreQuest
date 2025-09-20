import { test, expect } from '@playwright/test';

test.describe('Character Creation Flow', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear all browser storage and cookies before each test
    await context.clearCookies();
    await page.goto('http://localhost:3003');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('complete character creation flow for new user', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Navigate to home page
    await page.goto('http://localhost:3003');

    // Should see the landing page
    await expect(page.locator('h1')).toContainText('ChoreQuest');
    await expect(page.getByText('🏰 Create Family Guild')).toBeVisible();

    // Click Create Family Guild
    await page.getByText('🏰 Create Family Guild').click();

    // Should navigate to create family page
    await expect(page).toHaveURL(/.*\/auth\/create-family/);
    await expect(page.getByText('Found New Guild')).toBeVisible();

    // Fill in family creation form
    await page.fill('input[name="name"]', 'Test Family Guild');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Test Guild Master');

    // Submit form
    await page.click('button[type="submit"]');

    // Should automatically redirect to character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Create Your Hero' }).first()).toBeVisible();

    // Should see all 5 character classes
    await expect(page.getByText('Knight')).toBeVisible();
    await expect(page.getByText('Mage')).toBeVisible();
    await expect(page.getByText('Ranger')).toBeVisible();
    await expect(page.getByText('Rogue')).toBeVisible();
    await expect(page.getByText('Healer')).toBeVisible();

    // Fill in character name
    await page.fill('input#characterName', 'Sir TestHero');

    // Select Knight class
    await page.click('[data-testid="class-knight"]');

    // Submit character creation
    await page.click('button:text("Begin Your Quest")');

    // Should redirect to dashboard
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Welcome back, Sir TestHero!')).toBeVisible();

    // Should show character stats in dashboard
    await expect(page.getByText('🛡️ Knight')).toBeVisible();
    await expect(page.getByText('Level 1')).toBeVisible();
    await expect(page.getByText('💰 0')).toBeVisible(); // Gold
    await expect(page.getByText('⚡ 0')).toBeVisible(); // XP
    await expect(page.getByText('💎 0')).toBeVisible(); // Gems
    await expect(page.getByText('🏅 0')).toBeVisible(); // Honor Points
  });

  test('existing user redirects directly to dashboard', async ({ page }) => {
    const testEmail = `test-existing-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // First create a user with character
    await page.goto('http://localhost:3003');
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Existing Family Guild');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Existing Guild Master');
    await page.click('button[type="submit"]');

    // Complete character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir TestHero');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // The user is already logged in and has a character,
    // so visiting the home page should show the "Enter Your Realm" button
    // which redirects directly to dashboard
    await page.goto('http://localhost:3003');

    // Should see the "Enter Your Realm" link since user is logged in
    await expect(page.getByText('🏰 Enter Your Realm')).toBeVisible();

    // Click on Enter Your Realm
    await page.getByText('🏰 Enter Your Realm').click();

    // Should redirect directly to dashboard (bypassing character creation)
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Welcome back, Sir TestHero!')).toBeVisible();
  });

  test('character creation validation works', async ({ page }) => {
    const testEmail = `test-validation-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create a user first (without character) to test validation
    await page.goto('http://localhost:3003');
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Validation Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Validation Test User');
    await page.click('button[type="submit"]');

    // Should automatically redirect to character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });

    // Try to submit without filling anything (button should be disabled)
    const submitButton = page.locator('button:text("Begin Your Quest")');
    await expect(submitButton).toBeDisabled();

    // Fill name to enable button, then try without class selection
    await page.fill('input#characterName', 'Test Hero');
    await expect(submitButton).toBeDisabled(); // Still disabled without class

    // Clear name and select class, button should still be disabled
    await page.fill('input#characterName', '');
    await page.click('[data-testid="class-knight"]');
    await expect(submitButton).toBeDisabled(); // Still disabled without name

    // Fill both name and select class to enable button
    await page.fill('input#characterName', 'Valid Hero');
    await expect(submitButton).toBeEnabled(); // Now it should be enabled
  });
});