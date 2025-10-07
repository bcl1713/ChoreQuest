import { test, expect } from "./helpers/family-fixture";
import {
  navigateToAdmin,
  navigateToAdminTab,
  navigateToDashboard,
} from "./helpers/navigation-helpers";

/**
 * E2E Tests for Admin Dashboard Tab Navigation
 *
 * Tests tab switching, URL persistence, and content rendering for each tab.
 * Verifies that tabs work correctly and maintain state across navigation.
 */

test.describe("Admin Dashboard Tab Navigation", () => {
  test.beforeEach(async ({ workerFamily }) => {
    await navigateToDashboard(workerFamily.gmPage);
  });

  test("navigates between all tabs successfully", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Verify Overview tab is active by default
    const overviewTab = gmPage.getByRole("tab", { name: /Overview/i });
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");
    await expect(gmPage.getByTestId("statistics-panel")).toBeVisible();
    await expect(gmPage.getByTestId("activity-feed")).toBeVisible();

    // Navigate to Quest Templates tab
    await navigateToAdminTab(gmPage, "Quest Templates");

    // Navigate to Rewards tab
    await navigateToAdminTab(gmPage, "Rewards");

    // Navigate to Guild Masters tab
    await navigateToAdminTab(gmPage, "Guild Masters");

    // Navigate to Family Settings tab
    await navigateToAdminTab(gmPage, "Family Settings");

    // Navigate back to Overview
    await navigateToAdminTab(gmPage, "Overview");
  });

  test("persists active tab in URL query params", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Click Rewards tab
    await navigateToAdminTab(gmPage, "Rewards");

    // Verify URL contains tab query param
    await expect(gmPage).toHaveURL(/.*\/admin\?tab=rewards/i);

    // Click Guild Masters tab
    await navigateToAdminTab(gmPage, "Guild Masters");
    await expect(gmPage).toHaveURL(/.*\/admin\?tab=guild-masters/i);

    // Navigate away and back
    await navigateToDashboard(gmPage);

    // Navigate to admin again
    await navigateToAdmin(gmPage);

    // Should return to Overview tab (default) when navigating back without query param
    await expect(gmPage.getByRole("tab", { name: /Overview/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("direct navigation to specific tab via URL", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // First navigate to admin via button (establishes auth state)
    await navigateToAdmin(gmPage);

    // Wait for page to be fully loaded before URL navigation
    await gmPage.waitForLoadState("networkidle");

    // Now test URL parameter changes to navigate to specific tabs
    await gmPage.goto("/admin?tab=guild-masters");

    // Verify Guild Masters tab is active
    await expect(gmPage.getByRole("tab", { name: /Guild Masters/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(gmPage.getByTestId("guild-master-manager")).toBeVisible();

    // Navigate directly to Family Settings tab via URL
    await gmPage.goto("/admin?tab=family-settings");

    // Verify Family Settings tab is active
    await expect(gmPage.getByRole("tab", { name: /Family Settings/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(gmPage.getByTestId("family-settings")).toBeVisible();

    // Navigate to invalid tab - should default to Overview
    await gmPage.goto("/admin?tab=invalid-tab");

    // Verify Overview tab is active (default for invalid tab)
    await expect(gmPage.getByRole("tab", { name: /Overview/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(gmPage.getByTestId("statistics-panel")).toBeVisible();
  });

  test("tab navigation is mobile responsive", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    const originalViewport = gmPage.viewportSize();

    // Set mobile viewport
    await gmPage.setViewportSize({ width: 375, height: 667 });

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Verify tabs are visible (on mobile they show only icons, not full labels)
    const tabs = gmPage.getByRole("tablist");
    await expect(tabs).toBeVisible();

    // Verify at least one tab is present
    const allTabs = gmPage.getByRole("tab");
    await expect(allTabs.first()).toBeVisible();

    // Navigate to different tabs using index (since mobile only shows icons)
    const questTemplatesTab = allTabs.nth(1); // Quest Templates is second tab
    await questTemplatesTab.click();
    await expect(gmPage.getByTestId("quest-template-manager")).toBeVisible();

    // Navigate to Family Settings tab (5th tab)
    const familySettingsTab = allTabs.nth(4);
    await familySettingsTab.scrollIntoViewIfNeeded();
    await familySettingsTab.click();
    await expect(gmPage.getByTestId("family-settings")).toBeVisible();

    // Reset viewport
    await gmPage.setViewportSize(originalViewport ?? { width: 1280, height: 720 });
  });

  test("each tab renders correct content and components", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Overview tab - verify statistics and activity feed
    await expect(gmPage.getByTestId("statistics-panel")).toBeVisible();
    await expect(gmPage.getByTestId("activity-feed")).toBeVisible();
    await expect(gmPage.getByText(/Family Statistics/i)).toBeVisible();
    await expect(gmPage.getByText(/Recent Activity/i)).toBeVisible();

    // Quest Templates tab - verify template manager
    await navigateToAdminTab(gmPage, "Quest Templates");
    await expect(gmPage.getByTestId("create-template-button")).toBeVisible();
    await expect(gmPage.getByTestId("template-list")).toBeVisible();

    // Rewards tab - verify reward manager
    await navigateToAdminTab(gmPage, "Rewards");
    await expect(gmPage.getByTestId("create-reward-button")).toBeVisible();

    // Guild Masters tab - verify role management
    await navigateToAdminTab(gmPage, "Guild Masters");
    await expect(gmPage.getByText(/Family Members/i)).toBeVisible();

    // Family Settings tab - verify family settings
    await navigateToAdminTab(gmPage, "Family Settings");
    await expect(gmPage.getByText(/Family Name/i)).toBeVisible();
    // Check for invite code label specifically to avoid strict mode violation
    await expect(
      gmPage.locator("label").filter({ hasText: /Invite Code/i }).first(),
    ).toBeVisible();
  });
});
