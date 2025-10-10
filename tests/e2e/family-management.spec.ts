import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/family-fixture";
import { navigateToDashboard } from "./helpers/navigation-helpers";

async function openFamilyManagementTab(page: Page): Promise<void> {
  await navigateToDashboard(page);
  await expect(page.getByTestId("tab-family")).toBeVisible({
    timeout: 15000,
  });
  await page.getByTestId("tab-family").click();
  await expect(
    page.getByRole("heading", { name: "Family Management" }),
  ).toBeVisible({ timeout: 15000 });
}

test.describe("Family Management", () => {
  test("Guild Master promotes Hero to Guild Master successfully", async ({
    workerFamily,
  }) => {
    const { gmPage, createFamilyMember } = workerFamily;

    const heroMember = await createFamilyMember({
      displayName: "Hero User",
      characterClass: "MAGE",
      characterName: "Hero Character",
    });

    await gmPage.reload({ waitUntil: "networkidle" });
    await openFamilyManagementTab(gmPage);

    const heroRow = gmPage.locator("tr").filter({ hasText: heroMember.email });
    await expect(heroRow).toBeVisible({ timeout: 20000 });
    const heroRoleCell = heroRow.locator("td").nth(2);
    await expect(heroRoleCell).toContainText("Young Hero");

    await heroRow.getByRole("button", { name: /Promote to GM/i }).click();

    await expect(
      gmPage.getByRole("heading", { name: "Promote to Guild Master" }),
    ).toBeVisible();
    await expect(
      gmPage.getByText(/Are you sure you want to promote/),
    ).toBeVisible();
    await gmPage.getByRole("button", { name: /Confirm Promotion/i }).click();

    await expect(heroRoleCell).toContainText("Guild Master", {
      timeout: 15000,
    });
    await expect(heroRoleCell).toContainText("👑");
    await expect(
      heroRow.getByRole("button", { name: /Promote to GM/i }),
    ).toHaveCount(0, { timeout: 15000 });
  });

  test("Guild Master demotes another GM to Hero successfully", async ({
    workerFamily,
  }) => {
    const { gmPage, createFamilyMember } = workerFamily;

    const secondGmCandidate = await createFamilyMember({
      displayName: "Second GM",
      characterClass: "RANGER",
      characterName: "Second Character",
    });

    await gmPage.reload({ waitUntil: "networkidle" });
    await openFamilyManagementTab(gmPage);

    const secondUserRow = gmPage
      .locator("tr")
      .filter({ hasText: secondGmCandidate.email });
    await expect(secondUserRow).toBeVisible({ timeout: 20000 });
    const secondUserRoleCell = secondUserRow.locator("td").nth(2);

    await secondUserRow
      .getByRole("button", { name: /Promote to GM/i })
      .click();
    await gmPage
      .getByRole("button", { name: /Confirm Promotion/i })
      .click();

    await expect(secondUserRoleCell).toContainText("Guild Master", {
      timeout: 15000,
    });
    await expect(secondUserRoleCell).toContainText("👑");

    await secondUserRow
      .getByRole("button", { name: /Demote to Hero/i })
      .click();
    await expect(
      gmPage.getByRole("heading", { name: "Demote to Hero" }),
    ).toBeVisible();
    await expect(
      gmPage.getByText(/Are you sure you want to demote/),
    ).toBeVisible();
    await gmPage.getByRole("button", { name: /Confirm Demotion/i }).click();

    await expect(secondUserRoleCell).toContainText("Hero", {
      timeout: 15000,
    });
    await expect(secondUserRoleCell).toContainText("🛡️");
    await expect(
      secondUserRow.getByRole("button", { name: /Demote to Hero/i }),
    ).toHaveCount(0, { timeout: 15000 });
    await expect(
      secondUserRow.getByRole("button", { name: /Promote to GM/i }),
    ).toBeVisible();
  });

  test("GM cannot see demote button for themselves", async ({
    workerFamily,
  }) => {
    const { gmPage, gmEmail } = workerFamily;

    await gmPage.reload({ waitUntil: "networkidle" });
    await openFamilyManagementTab(gmPage);

    const ownRow = gmPage.locator("tr").filter({ hasText: gmEmail });
    await expect(ownRow).toBeVisible({ timeout: 20000 });
    await expect(ownRow.getByText("Guild Master")).toBeVisible();

    await expect(
      ownRow.getByRole("button", { name: /Demote/i }),
    ).toHaveCount(0);
    await expect(ownRow.locator("td").last()).toContainText("-");
  });

  test("Non-GM cannot access Family Management tab", async ({
    workerFamily,
  }) => {
    const heroUser = await workerFamily.createFamilyMember({
      displayName: "Hero User",
      characterClass: "MAGE",
      characterName: "Hero Character",
    });

    const heroPage = heroUser.page;

    await expect(heroPage.getByTestId("tab-family")).not.toBeVisible();
    await expect(heroPage.getByTestId("tab-quests")).toBeVisible();
    await expect(heroPage.getByTestId("tab-rewards")).toBeVisible();
    await expect(heroPage.getByTestId("tab-templates")).not.toBeVisible();
  });

  test("Role badges display correctly throughout app", async ({
    workerFamily,
  }) => {
    const { gmPage, gmEmail } = workerFamily;

    await expect(gmPage.getByText("👑 Guild Master")).toBeVisible();

    await openFamilyManagementTab(gmPage);

    const gmRow = gmPage.locator("tr").filter({ hasText: gmEmail });
    await expect(gmRow).toBeVisible({ timeout: 20000 });
    const gmRoleCell = gmRow.locator("td").nth(2);
    await expect(gmRoleCell).toContainText("Guild Master");
    await expect(gmRoleCell).toContainText("👑");
  });
});
