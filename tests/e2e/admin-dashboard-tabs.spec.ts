import { test, expect } from '@playwright/test';
import { setupUserWithCharacter } from './helpers/setup-helpers';
import { navigateToAdmin, navigateToAdminTab, navigateToDashboard } from './helpers/navigation-helpers';

/**
 * E2E Tests for Admin Dashboard Tab Navigation
 *
 * Tests tab switching, URL persistence, and content rendering for each tab.
 * Verifies that tabs work correctly and maintain state across navigation.
 */

test.describe('Admin Dashboard Tab Navigation', () => {
  test('navigates between all tabs successfully', async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, 'tab-nav', { characterClass: 'KNIGHT' });

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Verify Overview tab is active by default
    const overviewTab = page.getByRole('tab', { name: /Overview/i });
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('statistics-panel')).toBeVisible();
    await expect(page.getByTestId('activity-feed')).toBeVisible();

    // Navigate to Quest Templates tab
    await navigateToAdminTab(page, 'Quest Templates');

    // Navigate to Rewards tab
    await navigateToAdminTab(page, 'Rewards');

    // Navigate to Guild Masters tab
    await navigateToAdminTab(page, 'Guild Masters');

    // Navigate to Family Settings tab
    await navigateToAdminTab(page, 'Family Settings');

    // Navigate back to Overview
    await navigateToAdminTab(page, 'Overview');
  });

  test('persists active tab in URL query params', async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, 'tab-url', { characterClass: 'MAGE' });

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Click Rewards tab
    await navigateToAdminTab(page, 'Rewards');

    // Verify URL contains tab query param
    await expect(page).toHaveURL(/.*\/admin\?tab=rewards/i);

    // Click Guild Masters tab
    await navigateToAdminTab(page, 'Guild Masters');
    await expect(page).toHaveURL(/.*\/admin\?tab=guild-masters/i);

    // Navigate away and back
    await navigateToDashboard(page);

    // Navigate to admin again
    await navigateToAdmin(page);

    // Should return to Overview tab (default) when navigating back without query param
    await expect(page.getByRole('tab', { name: /Overview/i })).toHaveAttribute('aria-selected', 'true');
  });

  test('direct navigation to specific tab via URL', async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, 'tab-direct', { characterClass: 'RANGER' });

    // First navigate to admin via button (establishes auth state)
    await navigateToAdmin(page);

    // Wait for page to be fully loaded before URL navigation
    await page.waitForLoadState('networkidle');

    // Now test URL parameter changes to navigate to specific tabs
    await page.goto('/admin?tab=guild-masters');

    // Verify Guild Masters tab is active
    await expect(page.getByRole('tab', { name: /Guild Masters/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('guild-master-manager')).toBeVisible();

    // Navigate directly to Family Settings tab via URL
    await page.goto('/admin?tab=family-settings');

    // Verify Family Settings tab is active
    await expect(page.getByRole('tab', { name: /Family Settings/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('family-settings')).toBeVisible();

    // Navigate to invalid tab - should default to Overview
    await page.goto('/admin?tab=invalid-tab');

    // Verify Overview tab is active (default for invalid tab)
    await expect(page.getByRole('tab', { name: /Overview/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('statistics-panel')).toBeVisible();
  });

  test('tab navigation is mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Create family and character as Guild Master
    await setupUserWithCharacter(page, 'tab-mobile', { characterClass: 'HEALER' });

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Verify tabs are visible (on mobile they show only icons, not full labels)
    const tabs = page.getByRole('tablist');
    await expect(tabs).toBeVisible();

    // Verify at least one tab is present
    const allTabs = page.getByRole('tab');
    await expect(allTabs.first()).toBeVisible();

    // Navigate to different tabs using index (since mobile only shows icons)
    const questTemplatesTab = allTabs.nth(1); // Quest Templates is second tab
    await questTemplatesTab.click();
    await expect(page.getByTestId('quest-template-manager')).toBeVisible();

    // Navigate to Family Settings tab (5th tab)
    const familySettingsTab = allTabs.nth(4);
    await familySettingsTab.scrollIntoViewIfNeeded();
    await familySettingsTab.click();
    await expect(page.getByTestId('family-settings')).toBeVisible();

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('each tab renders correct content and components', async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, 'tab-content', { characterClass: 'ROGUE' });

    // Navigate to admin dashboard
    await navigateToAdmin(page);

    // Overview tab - verify statistics and activity feed
    await expect(page.getByTestId('statistics-panel')).toBeVisible();
    await expect(page.getByTestId('activity-feed')).toBeVisible();
    await expect(page.getByText(/Family Statistics/i)).toBeVisible();
    await expect(page.getByText(/Recent Activity/i)).toBeVisible();

    // Quest Templates tab - verify template manager
    await navigateToAdminTab(page, 'Quest Templates');
    await expect(page.getByTestId('create-template-button')).toBeVisible();
    await expect(page.getByTestId('template-list')).toBeVisible();

    // Rewards tab - verify reward manager
    await navigateToAdminTab(page, 'Rewards');
    await expect(page.getByTestId('create-reward-button')).toBeVisible();

    // Guild Masters tab - verify role management
    await navigateToAdminTab(page, 'Guild Masters');
    await expect(page.getByText(/Family Members/i)).toBeVisible();

    // Family Settings tab - verify family settings
    await navigateToAdminTab(page, 'Family Settings');
    await expect(page.getByText(/Family Name/i)).toBeVisible();
    // Check for invite code label specifically to avoid strict mode violation
    await expect(page.locator('label').filter({ hasText: /Invite Code/i }).first()).toBeVisible();
  });
});
