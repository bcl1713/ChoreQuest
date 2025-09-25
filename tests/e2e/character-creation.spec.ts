import { test, expect } from '@playwright/test';
import { setupUserAtCharacterCreation, setupUserWithCharacter, commonBeforeEach } from './helpers/setup-helpers';

test.describe('Character Creation', () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test('complete character creation flow', async ({ page }) => {
    const user = await setupUserWithCharacter(page, 'CharCreation');

    // Verify dashboard elements
    await expect(page.getByText(`Welcome back, ${user.characterName}!`)).toBeVisible();
    await expect(page.getByText('🛡️ Knight')).toBeVisible();
    await expect(page.getByText('Level 1')).toBeVisible();
    await expect(page.getByText('💰 0')).toBeVisible();
    await expect(page.getByText('⚡ 0')).toBeVisible();
    await expect(page.getByText('💎 0')).toBeVisible();
    await expect(page.getByText('🏅 0')).toBeVisible();
  });

  test('existing user redirects to dashboard', async ({ page }) => {
    // Create user with character
    const user = await setupUserWithCharacter(page, 'ExistingUser');

    // Navigate back to home - should show "Enter Your Realm"
    await page.goto('/');
    await expect(page.getByText('🏰 Enter Your Realm')).toBeVisible();

    // Clicking should redirect to dashboard
    await page.getByText('🏰 Enter Your Realm').click();
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(`Welcome back, ${user.characterName}!`)).toBeVisible();
  });

  test('character creation form validation', async ({ page }) => {
    await setupUserAtCharacterCreation(page, 'Validation');

    const submitButton = page.locator('button:text("Begin Your Quest")');

    // Form should be disabled initially
    await expect(submitButton).toBeDisabled();

    // Name only - still disabled
    await page.fill('input#characterName', 'Test Hero');
    await expect(submitButton).toBeDisabled();

    // Clear name, select class - still disabled
    await page.fill('input#characterName', '');
    await page.click('[data-testid="class-knight"]');
    await expect(submitButton).toBeDisabled();

    // Both name and class - should be enabled
    await page.fill('input#characterName', 'Valid Hero');
    await expect(submitButton).toBeEnabled();
  });
});