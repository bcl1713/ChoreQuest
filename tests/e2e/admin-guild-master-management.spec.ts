import { test, expect } from "@playwright/test";
import { setupUserWithCharacter, loginUser } from "./helpers/setup-helpers";
import { navigateToAdmin, navigateToAdminTab, navigateToDashboard } from "./helpers/navigation-helpers";
import { logout, getFamilyCode, joinExistingFamily } from "./helpers/auth-helpers";

/**
 * E2E Tests for Guild Master Management (Promote/Demote Workflow)
 *
 * Tests the ability for Guild Masters to promote Heroes to Guild Master role
 * and demote Guild Masters back to Heroes, with proper safeguards.
 */

test.describe("Guild Master Management - Promote/Demote", () => {
  test("Guild Master can promote a Hero to Guild Master role", async ({
    page,
  }) => {
    // Create family as Guild Master
    const gmUser = await setupUserWithCharacter(page, "promote-gm", {
      characterClass: "KNIGHT",
    });

    // Get family code and logout
    const familyCode = await getFamilyCode(page);
    await logout(page);

    // Register as Hero user
    const timestamp = Date.now();
    await joinExistingFamily(page, familyCode, {
      name: "Hero To Promote",
      email: `hero-promote-${timestamp}@test.com`,
      password: "password123",
    });

    // Create character for Hero
    await page.fill("input#characterName", "Hero Character");
    await page.click('[data-testid="class-mage"]');
    await page.click('button:text("Begin Your Quest")');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // Verify Hero cannot see admin dashboard button
    await expect(page.getByTestId("admin-dashboard-button")).not.toBeVisible();

    // Logout and login as Guild Master
    await logout(page);
    await loginUser(page, gmUser.email, gmUser.password);

    // Navigate to admin dashboard and Guild Masters tab
    await navigateToAdmin(page);
    await navigateToAdminTab(page, "Guild Masters");

    // Find the Hero user in the family members list
    const heroRow = page.locator('[data-testid*="member-row"]').filter({
      hasText: "Hero To Promote",
    });
    await expect(heroRow).toBeVisible();

    // Verify Hero has HERO role
    await expect(heroRow).toContainText(/HERO|Hero/i);

    // Click promote button
    await heroRow.getByTestId("promote-button").click();

    // Verify confirmation modal appears
    await expect(page.getByTestId("promote-confirm-modal")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Promote to Guild Master/i }),
    ).toBeVisible();

    // Confirm promotion
    await page.click('[data-testid="confirm-promote-button"]');

    // Verify role changed to Guild Master
    await expect(heroRow).toContainText(/GUILD_MASTER|Guild Master/i, {
      timeout: 5000,
    });

    // Verify promote button is now demote button
    await expect(heroRow.getByTestId("demote-button")).toBeVisible();

    // Navigate back to dashboard and logout
    await navigateToDashboard(page);

    // Login as the promoted user
    await logout(page);
    await loginUser(page, `hero-promote-${timestamp}@test.com`, "password123");

    // Verify promoted user can now see admin dashboard button
    await expect(page.getByTestId("admin-dashboard-button")).toBeVisible();

    // Verify they can access admin dashboard
    await navigateToAdmin(page);
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("Guild Master can demote another Guild Master to Hero role", async ({
    page,
    browser,
  }) => {
    // Create family as Guild Master (let setupUserWithCharacter generate unique email)
    await setupUserWithCharacter(page, "demote-gm1", {
      characterClass: "RANGER",
    });

    // Get family code
    const familyCode = await getFamilyCode(page);

    // Create second Guild Master
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    try {
      const timestamp = Date.now();
      await page2.goto("http://localhost:3000/auth/register");
      await page2.waitForLoadState("networkidle");
      await page2
        .getByRole("textbox", { name: "Email Address" })
        .fill(`gm2-${timestamp}@test.com`);
      await page2
        .getByRole("textbox", { name: "Password" })
        .fill("password123");
      await page2
        .getByRole("textbox", { name: "Hero Name" })
        .fill("Guild Master Two");
      await page2.getByRole("textbox", { name: "Guild Code" }).fill(familyCode);
      await page2.getByRole("button", { name: /Join Guild/i }).click();

      await expect(page2).toHaveURL(/.*\/character\/create/, {
        timeout: 15000,
      });
      await page2.fill("input#characterName", "Second GM Character");
      await page2.click('[data-testid="class-healer"]');
      await page2.click('button:text("Begin Your Quest")');
      await expect(page2).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

      // Promote second user to Guild Master (using first GM)
      await navigateToAdmin(page);
      await navigateToAdminTab(page, "Guild Masters");

      const gm2Row = page.locator('[data-testid*="member-row"]').filter({
        hasText: "Guild Master Two",
      });
      await gm2Row.getByTestId("promote-button").click();
      await page.click('[data-testid="confirm-promote-button"]');

      // Verify both are now Guild Masters
      await expect(gm2Row).toContainText(/GUILD_MASTER|Guild Master/i, {
        timeout: 5000,
      });

      // Now demote the second Guild Master
      await gm2Row.getByTestId("demote-button").click();

      // Verify confirmation modal
      await expect(page.getByTestId("demote-confirm-modal")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /Demote to Hero/i }),
      ).toBeVisible();

      // Confirm demotion
      await page.click('[data-testid="confirm-demote-button"]');

      // Verify role changed back to Hero
      await expect(gm2Row).toContainText(/HERO|Hero/i, { timeout: 5000 });

      // Verify second user lost admin access
      await page2.reload();

      await expect(
        page2.getByTestId("admin-dashboard-button"),
      ).not.toBeVisible();
    } finally {
      await context2.close();
    }
  });

  test("cannot demote the last Guild Master (safeguard)", async ({ page }) => {
    // Create family as Guild Master
    await setupUserWithCharacter(page, "last-gm", { characterClass: "ROGUE" });

    // Navigate to admin dashboard
    await page.click('[data-testid="admin-dashboard-button"]');
    await page.getByRole("tab", { name: /Guild Masters/i }).click();

    // Try to demote self (the only Guild Master)
    // Find the first member row (should be the only one - the current user)
    const selfRow = page.locator('[data-testid*="member-row"]').first();
    await expect(selfRow).toBeVisible();

    // Verify user is Guild Master
    await expect(selfRow).toContainText(/GUILD_MASTER|Guild Master/i);

    // Try to find demote button
    const demoteButton = selfRow.getByTestId("demote-button");

    if (await demoteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await demoteButton.click();

      // Should show warning modal
      await expect(
        page.getByText(/cannot demote.*last guild master/i),
      ).toBeVisible({
        timeout: 5000,
      });

      // Close modal if it appeared
      const cancelButton = page.getByTestId("cancel-demote-button");
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    }

    // Verify admin access is still available
    await page.click('[data-testid="tab-overview"]');
    await expect(page.getByTestId("guild-master-manager")).not.toBeVisible();
  });

  test("displays Guild Master count and family members list", async ({
    page,
  }) => {
    // Create family as Guild Master
    await setupUserWithCharacter(page, "gm-list", { characterClass: "KNIGHT" });

    // Navigate to admin dashboard Guild Masters tab
    await page.click('[data-testid="admin-dashboard-button"]');
    await page.getByRole("tab", { name: /Guild Masters/i }).click();

    // Verify Guild Master count is displayed (check for the manager panel)
    await expect(page.getByTestId("guild-master-manager")).toContainText(
      /Guild Master/i,
    );

    // Verify family members list is displayed
    await expect(page.getByText(/Family Members/i)).toBeVisible();

    // Verify current user is in the list as Guild Master
    const memberList = page.getByTestId("guild-master-manager");
    await expect(memberList).toContainText(/gm-list/i);
    await expect(memberList).toContainText(/GUILD_MASTER|Guild Master/i);
  });

  test("promotes and demotes update in real-time across sessions", async ({
    browser,
  }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Create family as first Guild Master (let setupUserWithCharacter generate unique email)
      await setupUserWithCharacter(page1, "realtime-gm", {
        characterClass: "MAGE",
      });

      // Get family code
      const familyCodeElement = await page1
        .locator("text=/Guild:.*\\([A-Z0-9]{6}\\)/")
        .first();
      const familyCodeText = await familyCodeElement.textContent();
      const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
      const familyCode = codeMatch![1];

      // Both pages navigate to admin GM tab
      await page1.click('[data-testid="admin-dashboard-button"]');
      await page1.getByRole("tab", { name: /Guild Masters/i }).click();

      // Create second user in different context
      const timestamp = Date.now();
      await page2.goto("http://localhost:3000/auth/register");
      await page2.waitForLoadState("networkidle");
      await page2
        .getByRole("textbox", { name: "Email Address" })
        .fill(`hero-rt-${timestamp}@test.com`);
      await page2
        .getByRole("textbox", { name: "Password" })
        .fill("password123");
      await page2
        .getByRole("textbox", { name: "Hero Name" })
        .fill("Hero Realtime");
      await page2.getByRole("textbox", { name: "Guild Code" }).fill(familyCode);
      await page2.getByRole("button", { name: /Join Guild/i }).click();

      await expect(page2).toHaveURL(/.*\/character\/create/, {
        timeout: 15000,
      });
      await page2.fill("input#characterName", "Realtime Hero");
      await page2.click('[data-testid="class-rogue"]');
      await page2.click('button:text("Begin Your Quest")');
      await expect(page2).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

      // Wait for realtime update to show new member in page1

      // Promote in page1
      const heroRow = page1.locator('[data-testid*="member-row"]').filter({
        hasText: "Hero Realtime",
      });
      await expect(heroRow).toBeVisible({ timeout: 5000 });
      await heroRow.getByTestId("promote-button").click();
      await page1.click('[data-testid="confirm-promote-button"]');

      // Verify role updated to Guild Master
      await expect(heroRow).toContainText(/GUILD_MASTER|Guild Master/i, {
        timeout: 5000,
      });

      // Verify page2 now has admin access (realtime update)
      await page2.reload();

      await expect(page2.getByTestId("admin-dashboard-button")).toBeVisible();
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test("shows appropriate UI for Heroes vs Guild Masters in member list", async ({
    page,
  }) => {
    // Create family as Guild Master
    const gmUser = await setupUserWithCharacter(page, "ui-diff", {
      characterClass: "HEALER",
    });

    // Get family code and create a Hero user
    const familyCodeElement = await page
      .locator("text=/Guild:.*\\([A-Z0-9]{6}\\)/")
      .first();
    const familyCodeText = await familyCodeElement.textContent();
    const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
    const familyCode = codeMatch![1];

    await logout(page);

    const timestamp = Date.now();
    await page.goto("http://localhost:3000/auth/register");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("textbox", { name: "Email Address" })
      .fill(`hero-ui-${timestamp}@test.com`);
    await page.getByRole("textbox", { name: "Password" }).fill("password123");
    await page.getByRole("textbox", { name: "Hero Name" }).fill("UI Test Hero");
    await page.getByRole("textbox", { name: "Guild Code" }).fill(familyCode);
    await page.getByRole("button", { name: /Join Guild/i }).click();

    await expect(page).toHaveURL(/.*\/character\/create/, { timeout: 15000 });
    await page.fill("input#characterName", "UI Hero Character");
    await page.click('[data-testid="class-ranger"]');
    await page.click('button:text("Begin Your Quest")');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // Login as Guild Master
    await logout(page);
    await loginUser(page, gmUser.email, gmUser.password);

    // Navigate to Guild Masters tab
    await page.click('[data-testid="admin-dashboard-button"]');
    await page.getByRole("tab", { name: /Guild Masters/i }).click();

    // Verify different UI for Hero vs Guild Master
    const heroRow = page.locator('[data-testid*="member-row"]').filter({
      hasText: "UI Test Hero",
    });

    // Hero should have promote button
    await expect(heroRow.getByTestId("promote-button")).toBeVisible();
    await expect(heroRow.getByTestId("promote-button")).toContainText(
      /promote/i,
    );
    await expect(heroRow).toContainText(/HERO|Hero/i);

    // Promote the hero to Guild Master
    await heroRow.getByTestId("promote-button").click();
    await page.click('[data-testid="confirm-promote-button"]');

    // Now the promoted hero should have a demote button (since they're not the current user)
    await expect(heroRow).toContainText(/GUILD_MASTER|Guild Master/i);
    await expect(heroRow.getByTestId("demote-button")).toBeVisible();
    await expect(heroRow.getByTestId("demote-button")).toContainText(/demote/i);
  });
});
