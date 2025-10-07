import { test, expect } from "./helpers/family-fixture";
import {
  createCustomQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";
import {
  openQuestCreationModal,
  navigateToDashboard,
} from "./helpers/navigation-helpers";
import { expectOnDashboard } from "./helpers/assertions";

test.describe("Quest System", () => {
  test.beforeEach(async ({ workerFamily }) => {
    await navigateToDashboard(workerFamily.gmPage);
  });

  test("Guild Master can create custom quests", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    const questTitle = `Test Custom Quest ${Date.now()}`;

    await expectOnDashboard(gmPage);
    await expect(gmPage.getByText("🗡️ My Quests")).toBeVisible();
    await expect(gmPage.getByText("⚡ Create Quest")).toBeVisible();

    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Test quest for automation",
      difficulty: "EASY",
      xpReward: 25,
      goldReward: 10,
    });

    await expect(gmPage.getByText("Create New Quest")).not.toBeVisible();
    const questHeading = gmPage
      .getByRole("heading", { name: questTitle })
      .first();
    await expect(questHeading).toBeVisible({ timeout: 10000 });
    await expect(
      gmPage.getByText("Test quest for automation").first(),
    ).toBeVisible({ timeout: 10000 });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    await approveQuest(gmPage, questTitle);
  });

  test("quest dashboard displays correctly", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await expectOnDashboard(gmPage);
    await expect(gmPage.getByText("🗡️ My Quests")).toBeVisible();
    await expect(gmPage.getByText("⚡ Create Quest")).toBeVisible();

    const emptyState = gmPage.getByText("No active quests. Ready for adventure?");
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(
        gmPage.locator(".quest-card").first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("quest creation modal validation", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    const questTitle = `Valid Quest Title ${Date.now()}`;

    // Open quest creation modal
    await openQuestCreationModal(gmPage);
    await gmPage.locator('button:has-text("Custom Quest")').click();

    // Try submitting empty form - should stay open
    await gmPage
      .locator('.fantasy-card button:has-text("⚡ Create Quest")')
      .click();
    await expect(gmPage.getByText("Create New Quest")).toBeVisible();

    // Fill title only - should still stay open
    await gmPage
      .fill('input[placeholder="Enter quest title..."]', questTitle);
    await gmPage
      .locator('.fantasy-card button:has-text("⚡ Create Quest")')
      .click();
    await expect(gmPage.getByText("Create New Quest")).toBeVisible();

    // Add description - should now succeed
    await gmPage.fill(
      'textarea[placeholder="Describe the quest..."]',
      "Valid quest description",
    );
    await gmPage
      .locator('.fantasy-card button:has-text("⚡ Create Quest")')
      .click();

    try {
      await expect(gmPage.getByText("Create New Quest")).not.toBeVisible();
      await expect(
        gmPage.getByRole("heading", { name: questTitle }).first(),
      ).toBeVisible();
    } finally {
      await pickupQuest(gmPage, questTitle).catch(() => undefined);
      await startQuest(gmPage, questTitle).catch(() => undefined);
      await completeQuest(gmPage, questTitle).catch(() => undefined);
      await approveQuest(gmPage, questTitle).catch(() => undefined);
    }
  });

  test("quest creation modal can be cancelled", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await openQuestCreationModal(gmPage);
    const customQuestButton = gmPage.getByTestId("adhoc-mode-button");
    await customQuestButton.waitFor({ state: "visible" });
    await customQuestButton.click();

    await gmPage.fill(
      'input[placeholder="Enter quest title..."]',
      "This will be cancelled",
    );
    await gmPage.click('button:has-text("Cancel")');

    await expect(gmPage.getByText("Create New Quest")).not.toBeVisible();
    await expect(
      gmPage.getByText("This will be cancelled"),
    ).not.toBeVisible();
  });
});
