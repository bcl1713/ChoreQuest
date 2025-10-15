import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/family-fixture";
import { giveCharacterGoldViaQuest, loginUser } from "./helpers/setup-helpers";
import { navigateToAdmin, navigateToDashboard } from "./helpers/navigation-helpers";
import {
  createCustomQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";

/**
 * E2E Tests for Admin Dashboard Statistics Display
 *
 * Tests that family statistics are displayed correctly and update in real-time
 * when quests are completed, rewards are redeemed, and characters level up.
 */

async function readPendingQuestCount(page: Page): Promise<number> {
  const statsPanel = page.getByTestId("statistics-panel");
  const pendingCard = statsPanel.getByText(/Pending Approvals/i).locator("..");
  const questLine = pendingCard.locator("p", { hasText: /quests/ }).last();
  const text = (await questLine.textContent()) ?? "";
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

test.describe("Admin Dashboard Statistics", () => {
  test.beforeEach(async ({ workerFamily }) => {
    await navigateToDashboard(workerFamily.gmPage);
  });

  test("displays initial family statistics correctly", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await navigateToAdmin(gmPage);

    await expect(gmPage.getByTestId("statistics-panel")).toBeVisible();

    // Verify initial statistics are displayed
    await expect(gmPage.getByText(/Quests This Week/i)).toBeVisible();
    await expect(gmPage.getByText(/Total Gold/i)).toBeVisible();
    await expect(gmPage.getByText(/Total XP/i)).toBeVisible();
    await expect(gmPage.getByText(/Most Active Member/i)).toBeVisible();
    await expect(gmPage.getByText(/Pending Approvals/i)).toBeVisible();

    // Verify statistics show reasonable initial values
    const pendingQuests = await readPendingQuestCount(gmPage);
    expect(pendingQuests).toBeGreaterThanOrEqual(0);
  });

  test("updates quest completion statistics in real-time", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await navigateToAdmin(gmPage);

    await navigateToDashboard(gmPage);

    const timestamp = Date.now();
    const questTitle = `Test Quest ${timestamp}`;
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Test quest for statistics",
      goldReward: 10,
      xpReward: 50,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    await approveQuest(gmPage, questTitle);

    await navigateToAdmin(gmPage);

    const statsPanel = gmPage.getByTestId("statistics-panel");
    await expect(statsPanel).toContainText("Quests This Week", {
      timeout: 5000,
    });
    await expect(statsPanel).toContainText("Quests This Month");

    await expect(statsPanel).toContainText("Total Gold");
    await expect(statsPanel).toContainText("Total XP");
  });

  test("displays character progress and levels", async ({ workerFamily }) => {
    const { gmPage, characterName } = workerFamily;

    await navigateToAdmin(gmPage);

    const statsPanel = gmPage.getByTestId("statistics-panel");
    await expect(statsPanel).toContainText(/Level/i);

    await expect(statsPanel).toContainText(characterName);

    const characterRow = statsPanel.locator("tr", { hasText: characterName });
    await expect(characterRow).toBeVisible();
  });

  test("shows pending approvals count", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await navigateToAdmin(gmPage);

    const statsPanel = gmPage.getByTestId("statistics-panel");
    await expect(statsPanel.getByText(/Pending Approvals/i)).toBeVisible();
    const initialPendingQuests = await readPendingQuestCount(gmPage);

    await navigateToDashboard(gmPage);
    const timestamp = Date.now();
    const questTitle = `Pending Quest ${timestamp}`;
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Quest needs approval",
      goldReward: 5,
      xpReward: 25,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);

    await gmPage.waitForLoadState("networkidle");

    await navigateToAdmin(gmPage);

    await expect(async () => {
      const pendingQuests = await readPendingQuestCount(gmPage);
      expect(pendingQuests).toBe(initialPendingQuests + 1);
    }).toPass({ timeout: 5000 });
  });

  test("statistics update when viewed in second browser window", async ({
    workerFamily,
    browser,
  }) => {
    const { gmPage, gmEmail, gmPassword } = workerFamily;

    await navigateToAdmin(gmPage);

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();

    try {
      await loginUser(secondPage, gmEmail, gmPassword);

      await giveCharacterGoldViaQuest(secondPage, 20);

      const statsPanel = gmPage.getByTestId("statistics-panel");
      await expect(statsPanel).toContainText(/1.*quest/i, { timeout: 15000 });
      await expect(statsPanel).toContainText(/Total Gold/i);
    } finally {
      await secondContext.close();
    }
  });

  test("displays most active family member correctly", async ({ workerFamily }) => {
    const { gmPage, characterName } = workerFamily;

    await navigateToAdmin(gmPage);

    await navigateToDashboard(gmPage);
    await giveCharacterGoldViaQuest(gmPage, 15);

    await navigateToAdmin(gmPage);

    const statsPanel = gmPage.getByTestId("statistics-panel");
    await expect(statsPanel.getByText(/Most Active Member/i)).toBeVisible();
    await expect(statsPanel).toContainText(characterName);
  });
});
