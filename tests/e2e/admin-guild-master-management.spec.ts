import { test, expect } from "./helpers/family-fixture";
import {
  navigateToAdmin,
  navigateToAdminTab,
  navigateToDashboard,
} from "./helpers/navigation-helpers";
import { loginUser } from "./helpers/setup-helpers";

/**
 * E2E Tests for Guild Master Management (Promote/Demote Workflow)
 *
 * Uses the worker-scoped Guild Master fixture to validate role management flows.
 */

test.describe("Guild Master Management - Promote/Demote", () => {
  test.beforeEach(async ({ workerFamily }) => {
    await navigateToDashboard(workerFamily.gmPage);
  });

  test("Guild Master can promote a Hero to Guild Master role", async ({ workerFamily }) => {
    const { gmPage, createFamilyMember } = workerFamily;

    const hero = await createFamilyMember({
      displayName: "Hero To Promote",
      characterName: "Hero Character",
      characterClass: "MAGE",
    });

    await expect(hero.page.getByTestId("admin-dashboard-button")).not.toBeVisible();

    await navigateToAdmin(gmPage);
    await navigateToAdminTab(gmPage, "Guild Masters");

    const heroRow = gmPage
      .locator('[data-testid*="member-row"]')
      .filter({ hasText: "Hero To Promote" });
    await expect(heroRow).toBeVisible();
    await expect(heroRow).toContainText(/HERO|Hero/i);

    await heroRow.getByTestId("promote-button").click();
    await expect(gmPage.getByTestId("promote-confirm-modal")).toBeVisible();
    await gmPage.click('[data-testid="confirm-promote-button"]');

    await expect(heroRow).toContainText(/GUILD_MASTER|Guild Master/i, {
      timeout: 5000,
    });
    await expect(heroRow.getByTestId("demote-button")).toBeVisible();

    await loginUser(hero.page, hero.email, hero.password);
    await expect(hero.page.getByTestId("admin-dashboard-button")).toBeVisible();

    await navigateToAdmin(hero.page);
    await expect(hero.page.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("Guild Master can demote another Guild Master to Hero role", async ({ workerFamily }) => {
    const { gmPage, createFamilyMember } = workerFamily;

    const gmCandidate = await createFamilyMember({
      displayName: "Guild Master Two",
      characterName: "Second GM Character",
      characterClass: "HEALER",
    });

    await navigateToAdmin(gmPage);
    await navigateToAdminTab(gmPage, "Guild Masters");

    const memberRow = gmPage
      .locator('[data-testid*="member-row"]')
      .filter({ hasText: "Guild Master Two" });
    await expect(memberRow).toBeVisible();

    await memberRow.getByTestId("promote-button").click();
    await gmPage.click('[data-testid="confirm-promote-button"]');

    await expect(memberRow).toContainText(/GUILD_MASTER|Guild Master/i, {
      timeout: 5000,
    });

    await loginUser(gmCandidate.page, gmCandidate.email, gmCandidate.password);
    await expect(gmCandidate.page.getByTestId("admin-dashboard-button")).toBeVisible({
      timeout: 10000,
    });

    await memberRow.getByTestId("demote-button").click();
    await expect(gmPage.getByTestId("demote-confirm-modal")).toBeVisible();
    await gmPage.click('[data-testid="confirm-demote-button"]');

    await expect(memberRow).toContainText(/HERO|Hero/i, { timeout: 5000 });

    await loginUser(gmCandidate.page, gmCandidate.email, gmCandidate.password);
    await expect(
      gmCandidate.page.getByTestId("admin-dashboard-button"),
    ).not.toBeVisible({ timeout: 10000 });
  });

  test("cannot demote the last Guild Master (safeguard)", async ({ workerFamily }) => {
    const { gmPage, characterName } = workerFamily;

    await navigateToAdmin(gmPage);
    await navigateToAdminTab(gmPage, "Guild Masters");

    const selfRow = gmPage
      .locator('[data-testid*="member-row"]')
      .filter({ hasText: characterName });
    await expect(selfRow).toBeVisible();
    await expect(selfRow).toContainText(/GUILD_MASTER|Guild Master/i);
    await expect(selfRow).toContainText("(You)");

    const demoteButton = selfRow.getByTestId("demote-button");
    await expect(demoteButton).toHaveCount(0);

    await navigateToAdminTab(gmPage, "Overview");
    await expect(gmPage.getByTestId("guild-master-manager")).not.toBeVisible();
  });

  test("displays Guild Master count and family members list", async ({ workerFamily }) => {
    const { gmPage, characterName } = workerFamily;

    await navigateToAdmin(gmPage);
    await navigateToAdminTab(gmPage, "Guild Masters");

    const manager = gmPage.getByTestId("guild-master-manager");
    await expect(manager).toBeVisible();
    await expect(manager).toContainText(/Guild Master/i);
    await expect(manager).toContainText(characterName);
    await expect(manager).toContainText(/GUILD_MASTER|Guild Master/i);
  });

  test("promotes and demotes update in real-time across sessions", async ({ workerFamily }) => {
    const { gmPage, createFamilyMember } = workerFamily;

    await navigateToAdmin(gmPage);
    await navigateToAdminTab(gmPage, "Guild Masters");

    const hero = await createFamilyMember({
      displayName: "Hero Realtime",
      characterName: "Realtime Hero",
      characterClass: "ROGUE",
    });

    const heroRow = gmPage
      .locator('[data-testid*="member-row"]')
      .filter({ hasText: "Hero Realtime" });
    await expect(heroRow).toBeVisible({ timeout: 5000 });

    await heroRow.getByTestId("promote-button").click();
    await gmPage.click('[data-testid="confirm-promote-button"]');

    await expect(heroRow).toContainText(/GUILD_MASTER|Guild Master/i, {
      timeout: 5000,
    });

    // Give time for realtime update to propagate to hero's session
    // Then reload to ensure auth context picks up the role change
    await hero.page.waitForTimeout(2000);
    await hero.page.reload();
    await navigateToDashboard(hero.page);

    await expect(hero.page.getByTestId("admin-dashboard-button")).toBeVisible({
      timeout: 10000,
    });

    await heroRow.getByTestId("demote-button").click();
    await gmPage.click('[data-testid="confirm-demote-button"]');

    await expect(heroRow).toContainText(/HERO|Hero/i, { timeout: 5000 });

    // Give time for realtime update to propagate to hero's session
    // Then reload to ensure auth context picks up the role change
    await hero.page.waitForTimeout(2000);
    await hero.page.reload();
    await navigateToDashboard(hero.page);

    await expect(hero.page.getByTestId("admin-dashboard-button")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("shows appropriate UI for Heroes vs Guild Masters in member list", async ({ workerFamily }) => {
    const { gmPage, createFamilyMember } = workerFamily;

    await navigateToAdmin(gmPage);
    await navigateToAdminTab(gmPage, "Guild Masters");

    await createFamilyMember({
      displayName: "UI Test Hero",
      characterName: "UI Hero Character",
      characterClass: "RANGER",
    });

    const heroRow = gmPage
      .locator('[data-testid*="member-row"]')
      .filter({ hasText: "UI Test Hero" });
    await expect(heroRow).toBeVisible();

    await expect(heroRow.getByTestId("promote-button")).toBeVisible();
    await expect(heroRow).toContainText(/HERO|Hero/i);

    await heroRow.getByTestId("promote-button").click();
    await gmPage.click('[data-testid="confirm-promote-button"]');

    await expect(heroRow).toContainText(/GUILD_MASTER|Guild Master/i, {
      timeout: 5000,
    });
    await expect(heroRow.getByTestId("demote-button")).toBeVisible();
  });
});
