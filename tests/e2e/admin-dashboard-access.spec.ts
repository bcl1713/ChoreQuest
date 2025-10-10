import { test, expect } from "./helpers/family-fixture";
import { navigateToAdmin, navigateToDashboard } from "./helpers/navigation-helpers";
import { getFamilyCode, joinExistingFamily } from "./helpers/auth-helpers";

/**
 * E2E Tests for Admin Dashboard Access Control
 *
 * Tests that Guild Masters can access the admin dashboard while Heroes cannot.
 * Verifies role-based access control and proper redirects.
 */

test.describe("Admin Dashboard Access Control", () => {
  test.beforeEach(async ({ workerFamily }) => {
    await navigateToDashboard(workerFamily.gmPage);
  });

  test("Guild Master can access admin dashboard", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    // Verify Admin button is visible for Guild Master
    await expect(gmPage.getByTestId("admin-dashboard-button")).toBeVisible();

    // Navigate to admin dashboard
    await navigateToAdmin(gmPage);

    // Verify admin dashboard loads
    await expect(gmPage.getByTestId("admin-dashboard")).toBeVisible();

    // Verify tabbed interface exists
    await expect(gmPage.getByRole("tab", { name: /Overview/i })).toBeVisible();
    await expect(gmPage.getByRole("tab", { name: /Quest Templates/i })).toBeVisible();
    await expect(gmPage.getByRole("tab", { name: /Rewards/i })).toBeVisible();
    await expect(gmPage.getByRole("tab", { name: /Guild Masters/i })).toBeVisible();
    await expect(gmPage.getByRole("tab", { name: /Family Settings/i })).toBeVisible();
  });

  test("Hero cannot access admin dashboard", async ({ workerFamily, browser }) => {
    const { gmPage } = workerFamily;
    const familyCode = await getFamilyCode(gmPage);
    const heroContext = await browser.newContext();
    const heroPage = await heroContext.newPage();

    try {
      // Register as Hero (child) user in the GM's family
      const timestamp = Date.now();
      await joinExistingFamily(heroPage, familyCode, {
        name: "Hero User",
        email: `hero-access-${timestamp}@test.com`,
        password: "password123",
      });

      // Create character for Hero
      await heroPage.fill("input#characterName", "Hero Character");
      await heroPage.click('[data-testid="class-rogue"]');
      await heroPage.click('button:text("Begin Your Quest")');
      await expect(heroPage).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

      // Verify Hero cannot see admin button
      await expect(heroPage.getByTestId("admin-dashboard-button")).not.toBeVisible();

      // Try to navigate directly to admin dashboard via URL
      await heroPage.goto("/admin");

      // Wait for page to load and process the access control check
      await heroPage.waitForLoadState("domcontentloaded");

      // Should be redirected back to dashboard
      await expect(heroPage).toHaveURL(/.*\/dashboard/, { timeout: 10000 });

      // Should see an error message about insufficient permissions
      await expect(
        heroPage.getByText(/not authorized|insufficient permissions|guild master/i),
      ).toBeVisible({ timeout: 5000 });
    } finally {
      await heroContext.close();
    }
  });

  test("Unauthenticated user cannot access admin dashboard", async ({ page }) => {
    // Navigate directly to admin dashboard without logging in
    await page.goto("/admin");

    // Should be redirected to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test("Admin button visible only for Guild Masters in header", async ({ workerFamily, page }) => {
    const { gmPage } = workerFamily;

    // Verify admin button exists in navigation
    const adminButton = gmPage.getByTestId("admin-dashboard-button");
    await expect(adminButton).toBeVisible();

    // Verify button has correct styling/icon
    await expect(adminButton).toContainText(/Admin|Settings|⚙️|🛡️/i);

    // Login page shouldn't show admin button
    await page.goto("/auth/login");
    await expect(page.getByTestId("admin-dashboard-button")).not.toBeVisible();
  });
});
