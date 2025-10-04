import { test, expect } from '@playwright/test';
import { setupUserWithCharacter } from './helpers/setup-helpers';
import { navigateToAdmin } from './helpers/navigation-helpers';
import { logout, getFamilyCode, joinExistingFamily } from './helpers/auth-helpers';

/**
 * E2E Tests for Admin Dashboard Access Control
 *
 * Tests that Guild Masters can access the admin dashboard while Heroes cannot.
 * Verifies role-based access control and proper redirects.
 */

test.describe('Admin Dashboard Access Control', () => {
  test('Guild Master can access admin dashboard', async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, 'gm-access', { characterClass: 'KNIGHT' });

    // Should be on dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Verify Admin button is visible for Guild Master
    await expect(page.getByTestId('admin-dashboard-button')).toBeVisible();

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Verify admin dashboard loads
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();

    // Verify tabbed interface exists
    await expect(page.getByRole('tab', { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Quest Templates/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Rewards/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Guild Masters/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Family Settings/i })).toBeVisible();
  });

  test('Hero cannot access admin dashboard', async ({ page }) => {
    // Create family as Guild Master
    await setupUserWithCharacter(page, 'gm-for-hero', { characterClass: 'MAGE' });

    // Get family code and logout
    const familyCode = await getFamilyCode(page);
    await logout(page);

    // Register as Hero (child) user
    const timestamp = Date.now();
    await joinExistingFamily(page, familyCode, {
      name: 'Hero User',
      email: `hero-access-${timestamp}@test.com`,
      password: 'password123',
    });

    // Create character for Hero
    await page.fill('input#characterName', 'Hero Character');
    await page.click('[data-testid="class-rogue"]');
    await page.click('button:text("Begin Your Quest")');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // Verify Hero cannot see admin button
    await expect(page.getByTestId('admin-dashboard-button')).not.toBeVisible();

    // Try to navigate directly to admin dashboard via URL
    await page.goto('/admin');

    // Should be redirected back to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Should see an error message about insufficient permissions
    await expect(page.getByText(/not authorized|insufficient permissions|guild master/i)).toBeVisible({ timeout: 5000 });
  });

  test('Unauthenticated user cannot access admin dashboard', async ({ page }) => {
    // Navigate directly to admin dashboard without logging in
    await page.goto('/admin');

    // Should be redirected to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('Admin button visible only for Guild Masters in header', async ({ page }) => {
    // Create family as Guild Master
    await setupUserWithCharacter(page, 'gm-header', { characterClass: 'RANGER' });

    // Verify admin button exists in navigation
    const adminButton = page.getByTestId('admin-dashboard-button');
    await expect(adminButton).toBeVisible();

    // Verify button has correct styling/icon
    await expect(adminButton).toContainText(/Admin|Settings|⚙️|🛡️/i);

    // Logout
    await logout(page);

    // Login page shouldn't show admin button
    await expect(page.getByTestId('admin-dashboard-button')).not.toBeVisible();
  });
});
