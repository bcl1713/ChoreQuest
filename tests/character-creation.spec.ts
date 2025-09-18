import { test, expect } from '@playwright/test';

test.describe('Character Creation Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpass123';

  test('complete character creation flow for new user', async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3002');

    // Should see the landing page
    await expect(page.locator('h1')).toContainText('ChoreQuest');
    await expect(page.getByText('Create Family Guild')).toBeVisible();

    // Click Create Family Guild
    await page.getByText('Create Family Guild').click();

    // Should navigate to create family page
    await expect(page).toHaveURL(/.*\/auth\/create-family/);
    await expect(page.getByText('Create Your Family Guild')).toBeVisible();

    // Fill in family creation form
    await page.fill('input[name="name"]', 'Test Family Guild');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Test Guild Master');

    // Submit form
    await page.click('button[type="submit"]');

    // Should automatically redirect to character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await expect(page.getByText('Create Your Hero')).toBeVisible();

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
    await page.click('button:text("Begin Adventure")');

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
    // Navigate to home page
    await page.goto('http://localhost:3002');

    // Click Join Existing Guild (login)
    await page.getByText('Join Existing Guild').click();

    // Should navigate to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Login with existing user
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect directly to dashboard (bypassing character creation)
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Welcome back, Sir TestHero!')).toBeVisible();
  });

  test('character creation validation works', async ({ page }) => {
    // Navigate directly to character creation (simulate fresh user)
    await page.goto('http://localhost:3002/character/create');

    // Try to submit without filling anything
    await page.click('button:text("Begin Adventure")');

    // Should show validation error
    await expect(page.getByText('Please enter a character name and select a class')).toBeVisible();

    // Fill name but no class
    await page.fill('input#characterName', 'Test Hero');
    await page.click('button:text("Begin Adventure")');

    // Should still show validation error
    await expect(page.getByText('Please enter a character name and select a class')).toBeVisible();

    // Select class but clear name
    await page.click('[data-testid="class-knight"]');
    await page.fill('input#characterName', '');
    await page.click('button:text("Begin Adventure")');

    // Should still show validation error
    await expect(page.getByText('Please enter a character name and select a class')).toBeVisible();
  });
});