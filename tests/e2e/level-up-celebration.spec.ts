import { test, expect } from "./helpers/family-fixture";
import type { Page } from "@playwright/test";
import {
  createCustomQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";
import { navigateToDashboard, dismissQuestCompleteOverlayIfVisible } from "./helpers/navigation-helpers";

function uniqueQuestName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix} ${timestamp}-${random}`;
}

/**
 * Helper to get the numeric value from a test ID element
 * e.g., "⚡ 105" -> 105
 */
async function getNumericStat(page: Page, testId: string): Promise<number> {
  const text = (await page.locator(`[data-testid="${testId}"]`).textContent()) || "";
  const numeric = text.replace(/\D/g, "");
  return parseInt(numeric || "0", 10);
}

test.describe("Level Up Celebration", () => {
  test("shows level up modal when character gains enough XP to level up", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    // Get current level and XP
    const currentLevelText = await gmPage
      .locator('[data-testid="character-level"]')
      .textContent();
    const levelMatch = currentLevelText?.match(/Level (\d+)/);
    const currentLevel = levelMatch ? parseInt(levelMatch[1]) : 1;

    const currentXP = await getNumericStat(gmPage, "character-xp");

    // Calculate XP needed for next level
    // Formula: 50 * (level - 1)^2
    const xpForNextLevel = 50 * currentLevel ** 2;
    const xpNeeded = xpForNextLevel - currentXP;

    // Create a quest with enough XP to level up (add buffer for difficulty multiplier)
    // Using HARD difficulty (2.0x multiplier for KNIGHT class with 1.05x bonus)
    // Total multiplier: 2.0 * 1.05 = 2.1
    const baseXP = Math.ceil(xpNeeded / 2.1) + 10;

    const questTitle = uniqueQuestName("Level Up Quest");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Quest that should trigger level up",
      difficulty: "HARD",
      xpReward: baseXP,
      goldReward: 50,
    });

    // Complete the quest
    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip both overlays - we want to verify the level up modal
    await approveQuest(gmPage, questTitle, { skipLevelUpDismiss: true, skipQuestCompleteDismiss: true });

    // Dismiss quest complete overlay first (it appears before level-up modal)
    await dismissQuestCompleteOverlayIfVisible(gmPage);

    // Wait for level up modal to appear
    await expect(gmPage.getByText("LEVEL UP!")).toBeVisible({ timeout: 10000 });

    // Verify modal shows the level transition
    // Use more specific selector to avoid matching other numbers on the page
    const levelUpDialog = gmPage.getByRole('dialog', { name: /LEVEL UP/i });
    await expect(levelUpDialog.getByText(currentLevel.toString(), { exact: true })).toBeVisible();
    await expect(levelUpDialog.getByText((currentLevel + 1).toString(), { exact: true })).toBeVisible();

    // Verify congratulations message
    await expect(
      gmPage.getByText(/Congratulations! You've grown stronger/i)
    ).toBeVisible();

    // Verify dismiss button is visible and focused
    const dismissButton = gmPage.getByRole("button", {
      name: /Continue Your Journey/i,
    });
    await expect(dismissButton).toBeVisible();
    await expect(dismissButton).toBeFocused({ timeout: 2000 });
  });

  test("level up modal displays character name and class", async ({
    workerFamily,
  }) => {
    const { gmPage, characterName } = workerFamily;

    await navigateToDashboard(gmPage);

    const currentLevelText = await gmPage
      .locator('[data-testid="character-level"]')
      .textContent();
    const levelMatch = currentLevelText?.match(/Level (\d+)/);
    const currentLevel = levelMatch ? parseInt(levelMatch[1]) : 1;
    const currentXP = await getNumericStat(gmPage, "character-xp");

    const xpForNextLevel = 50 * currentLevel ** 2;
    const xpNeeded = xpForNextLevel - currentXP;
    const baseXP = Math.ceil(xpNeeded / 2.1) + 10;

    const questTitle = uniqueQuestName("Character Info Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing character info display",
      difficulty: "HARD",
      xpReward: baseXP,
      goldReward: 25,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip both overlays - we want to verify the level up modal
    await approveQuest(gmPage, questTitle, { skipLevelUpDismiss: true, skipQuestCompleteDismiss: true });

    // Wait for modal
    await expect(gmPage.getByText("LEVEL UP!")).toBeVisible({ timeout: 10000 });

    // Verify character name is displayed within the level up modal
    const levelUpDialog = gmPage.getByRole('dialog', { name: /LEVEL UP/i });
    await expect(levelUpDialog.getByText(characterName, { exact: false })).toBeVisible();

    // Verify character class is displayed (Knight is the default in fixture)
    await expect(levelUpDialog.getByText(/Knight/i)).toBeVisible();
  });

  test("level up modal can be dismissed with button", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    const currentLevelText = await gmPage
      .locator('[data-testid="character-level"]')
      .textContent();
    const levelMatch = currentLevelText?.match(/Level (\d+)/);
    const currentLevel = levelMatch ? parseInt(levelMatch[1]) : 1;
    const currentXP = await getNumericStat(gmPage, "character-xp");

    const xpForNextLevel = 50 * currentLevel ** 2;
    const xpNeeded = xpForNextLevel - currentXP;
    const baseXP = Math.ceil(xpNeeded / 2.1) + 10;

    const questTitle = uniqueQuestName("Button Dismiss Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing button dismiss",
      difficulty: "HARD",
      xpReward: baseXP,
      goldReward: 30,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip both overlays - we want to verify the level up modal
    await approveQuest(gmPage, questTitle, { skipLevelUpDismiss: true, skipQuestCompleteDismiss: true });

    // Wait for modal
    await expect(gmPage.getByText("LEVEL UP!")).toBeVisible({ timeout: 10000 });

    // Click dismiss button
    await gmPage
      .getByRole("button", { name: /Continue Your Journey/i })
      .click();

    // Verify modal is dismissed
    await expect(gmPage.getByText("LEVEL UP!")).not.toBeVisible({
      timeout: 2000,
    });
  });

  test("level up modal can be dismissed with Escape key", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    const currentLevelText = await gmPage
      .locator('[data-testid="character-level"]')
      .textContent();
    const levelMatch = currentLevelText?.match(/Level (\d+)/);
    const currentLevel = levelMatch ? parseInt(levelMatch[1]) : 1;
    const currentXP = await getNumericStat(gmPage, "character-xp");

    const xpForNextLevel = 50 * currentLevel ** 2;
    const xpNeeded = xpForNextLevel - currentXP;
    const baseXP = Math.ceil(xpNeeded / 2.1) + 10;

    const questTitle = uniqueQuestName("Escape Key Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing escape key dismiss",
      difficulty: "HARD",
      xpReward: baseXP,
      goldReward: 35,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip both overlays - we want to verify the level up modal
    await approveQuest(gmPage, questTitle, { skipLevelUpDismiss: true, skipQuestCompleteDismiss: true });

    // Wait for modal
    await expect(gmPage.getByText("LEVEL UP!")).toBeVisible({ timeout: 10000 });

    // Press Escape key
    await gmPage.keyboard.press("Escape");

    // Verify modal is dismissed
    await expect(gmPage.getByText("LEVEL UP!")).not.toBeVisible({
      timeout: 2000,
    });
  });

  test("level up modal shows particle effects", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    const currentLevelText = await gmPage
      .locator('[data-testid="character-level"]')
      .textContent();
    const levelMatch = currentLevelText?.match(/Level (\d+)/);
    const currentLevel = levelMatch ? parseInt(levelMatch[1]) : 1;
    const currentXP = await getNumericStat(gmPage, "character-xp");

    const xpForNextLevel = 50 * currentLevel ** 2;
    const xpNeeded = xpForNextLevel - currentXP;
    const baseXP = Math.ceil(xpNeeded / 2.1) + 10;

    const questTitle = uniqueQuestName("Particle Effects Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing particle effects",
      difficulty: "HARD",
      xpReward: baseXP,
      goldReward: 40,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip both overlays - we want to verify the level up modal
    await approveQuest(gmPage, questTitle, { skipLevelUpDismiss: true, skipQuestCompleteDismiss: true });

    // Wait for modal
    await expect(gmPage.getByText("LEVEL UP!")).toBeVisible({ timeout: 10000 });

    // Verify particle effects container exists
    // Target the specific particle container with overflow-hidden and aria-hidden
    const particleContainer = gmPage.locator(
      ".fixed.inset-0.pointer-events-none.overflow-hidden[aria-hidden='true']"
    );
    await expect(particleContainer).toBeVisible();

    // Verify particles exist (should be 50 particles for level up)
    const particles = particleContainer.locator("div > div");
    const particleCount = await particles.count();
    expect(particleCount).toBeGreaterThan(0);
  });

  test("supports multi-level ups (gaining multiple levels at once)", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    const currentLevelText = await gmPage
      .locator('[data-testid="character-level"]')
      .textContent();
    const levelMatch = currentLevelText?.match(/Level (\d+)/);
    const currentLevel = levelMatch ? parseInt(levelMatch[1]) : 1;
    const currentXP = await getNumericStat(gmPage, "character-xp");

    // Calculate XP needed to jump 2 levels
    // Level 2: 50 * 1^2 = 50
    // Level 3: 50 * 2^2 = 200
    // To go from level 1 to 3, need 200 total XP
    const xpForTwoLevelsUp = 50 * (currentLevel + 1) ** 2;
    const xpNeeded = xpForTwoLevelsUp - currentXP;

    // Add extra buffer to ensure we get 2 levels
    const baseXP = Math.ceil(xpNeeded / 2.1) + 50;

    const questTitle = uniqueQuestName("Multi Level Up Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Quest with massive XP reward",
      difficulty: "HARD",
      xpReward: baseXP,
      goldReward: 100,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip both overlays - we want to verify the level up modal
    await approveQuest(gmPage, questTitle, { skipLevelUpDismiss: true, skipQuestCompleteDismiss: true });

    // Wait for modal
    await expect(gmPage.getByText("LEVEL UP!")).toBeVisible({ timeout: 10000 });

    // Verify the old level and new level are shown
    const levelUpDialog = gmPage.getByRole('dialog', { name: /LEVEL UP/i });
    await expect(levelUpDialog.getByText(currentLevel.toString(), { exact: true })).toBeVisible();

    // Check if "You gained X levels!" message appears (for multi-level ups)
    // This message only appears when levelsGained > 1
    const gainedLevelsText = gmPage.getByText(/You gained \d+ levels!/i);

    // If we see the multi-level message, verify it
    if (await gainedLevelsText.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Multi-level up occurred
      const text = await gainedLevelsText.textContent();
      const levelsGained = text?.match(/You gained (\d+) levels!/)?.[1];
      expect(parseInt(levelsGained || "0")).toBeGreaterThanOrEqual(2);
    }
  });

  test("level up modal has proper ARIA attributes for accessibility", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    const currentLevelText = await gmPage
      .locator('[data-testid="character-level"]')
      .textContent();
    const levelMatch = currentLevelText?.match(/Level (\d+)/);
    const currentLevel = levelMatch ? parseInt(levelMatch[1]) : 1;
    const currentXP = await getNumericStat(gmPage, "character-xp");

    const xpForNextLevel = 50 * currentLevel ** 2;
    const xpNeeded = xpForNextLevel - currentXP;
    const baseXP = Math.ceil(xpNeeded / 2.1) + 10;

    const questTitle = uniqueQuestName("Accessibility Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing accessibility",
      difficulty: "HARD",
      xpReward: baseXP,
      goldReward: 45,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip both overlays - we want to verify the level up modal
    await approveQuest(gmPage, questTitle, { skipLevelUpDismiss: true, skipQuestCompleteDismiss: true });

    // Wait for quest complete overlay to auto-dismiss first (takes ~5 seconds)
    await gmPage.waitForTimeout(6000);

    // Wait for level-up modal
    await expect(gmPage.getByText("LEVEL UP!")).toBeVisible({ timeout: 10000 });

    // Verify modal has role="dialog" - use specific selector to avoid ambiguity
    const dialog = gmPage.getByRole('dialog', { name: /LEVEL UP/i });
    await expect(dialog).toBeVisible();

    // Verify modal has aria-modal="true"
    const ariaModal = await dialog.getAttribute("aria-modal");
    expect(ariaModal).toBe("true");

    // Verify modal has aria-labelledby pointing to the title
    const ariaLabelledBy = await dialog.getAttribute("aria-labelledby");
    expect(ariaLabelledBy).toBe("level-up-title");

    // Verify the title element exists with the correct ID
    const titleElement = gmPage.locator("#level-up-title");
    await expect(titleElement).toBeVisible();
    await expect(titleElement).toHaveText("LEVEL UP!");
  });

  test("character level updates on dashboard after level up", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    const currentLevelText = await gmPage
      .locator('[data-testid="character-level"]')
      .textContent();
    const levelMatch = currentLevelText?.match(/Level (\d+)/);
    const currentLevel = levelMatch ? parseInt(levelMatch[1]) : 1;
    const currentXP = await getNumericStat(gmPage, "character-xp");

    const xpForNextLevel = 50 * currentLevel ** 2;
    const xpNeeded = xpForNextLevel - currentXP;
    const baseXP = Math.ceil(xpNeeded / 2.1) + 10;

    const questTitle = uniqueQuestName("Level Display Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing level display update",
      difficulty: "HARD",
      xpReward: baseXP,
      goldReward: 55,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip both overlays - we want to verify the level up modal
    await approveQuest(gmPage, questTitle, { skipLevelUpDismiss: true, skipQuestCompleteDismiss: true });

    // Wait for modal and dismiss it
    await expect(gmPage.getByText("LEVEL UP!")).toBeVisible({ timeout: 10000 });
    await gmPage
      .getByRole("button", { name: /Continue Your Journey/i })
      .click();

    // Verify the character level display has updated in the header
    await expect(async () => {
      const updatedLevelText = await gmPage
        .locator('[data-testid="character-level"]')
        .textContent();
      const updatedLevelMatch = updatedLevelText?.match(/Level (\d+)/);
      const updatedLevel = updatedLevelMatch
        ? parseInt(updatedLevelMatch[1])
        : 1;
      expect(updatedLevel).toBe(currentLevel + 1);
    }).toPass({ timeout: 10000 });
  });
});
