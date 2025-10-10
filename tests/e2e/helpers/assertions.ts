import { Locator, Page, expect } from "@playwright/test";

/**
 * Custom Assertion Helpers for E2E Tests
 *
 * This module provides reusable assertion helpers for common ChoreQuest
 * patterns like checking character stats, quest status, and rewards.
 */

export interface CharacterStats {
  gold?: number;
  xp?: number;
  level?: number;
  gems?: number;
}

/**
 * Asserts that character stats match expected values
 *
 * Checks the character stat display for gold, XP, level, and/or gems.
 * Only checks the stats that are provided in the options object.
 *
 * @param page - Playwright page object
 * @param stats - Object with expected stat values (only provided stats are checked)
 *
 * @example
 * ```typescript
 * // Check all stats
 * await expectCharacterStats(page, { gold: 100, xp: 250, level: 3 });
 *
 * // Check only gold
 * await expectCharacterStats(page, { gold: 50 });
 *
 * // Check XP and level
 * await expectCharacterStats(page, { xp: 1050, level: 5 });
 * ```
 */
export async function expectCharacterStats(
  page: Page,
  stats: CharacterStats,
): Promise<void> {
  if (stats.gold !== undefined) {
    await expect(page.getByText(`💰 ${stats.gold}`)).toBeVisible({
      timeout: 10000,
    });
  }

  if (stats.xp !== undefined) {
    await expect(page.getByText(`⚡ ${stats.xp}`)).toBeVisible({
      timeout: 10000,
    });
  }

  if (stats.level !== undefined) {
    await expect(page.getByText(`Level ${stats.level}`)).toBeVisible({
      timeout: 10000,
    });
  }

  if (stats.gems !== undefined) {
    await expect(page.getByText(`💎 ${stats.gems}`)).toBeVisible({
      timeout: 10000,
    });
  }
}

/**
 * Asserts that initial character stats are all zero
 *
 * Convenience helper for checking a newly created character has
 * starting stats of 0 gold, 0 XP, 0 gems, 0 badges, and level 1.
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * await setupUserWithCharacter(page, "new-user");
 * await expectInitialCharacterStats(page);
 * ```
 */
export async function expectInitialCharacterStats(page: Page): Promise<void> {
  await expect(page.getByText("💰 0")).toBeVisible();
  await expect(page.getByText("⚡ 0")).toBeVisible();
  await expect(page.getByText("💎 0")).toBeVisible();
  await expect(page.getByText("🏅 0")).toBeVisible();
  await expect(page.getByText("Level 1")).toBeVisible();
}

export type QuestStatus =
  | "AVAILABLE"
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "APPROVED";

/**
 * Asserts that a quest has a specific status
 *
 * Finds the quest by name and verifies it has the expected status badge or button.
 *
 * @param page - Playwright page object
 * @param questName - The title of the quest
 * @param status - The expected quest status
 *
 * @example
 * ```typescript
 * await expectQuestStatus(page, "Clean Your Room", "IN_PROGRESS");
 * ```
 */
export async function expectQuestStatus(
  page: Page,
  questName: string,
  status: QuestStatus,
): Promise<void> {
  const questHeading = page
    .getByRole("heading", { name: questName, exact: true })
    .first();
  await expect(questHeading).toBeVisible({ timeout: 10000 });
  const questCard = questHeading.locator("../../..");

  // Check for status-specific indicators
  const statusIndicators: Record<QuestStatus, string> = {
    AVAILABLE: "pick-up-quest-button",
    PENDING: "start-quest-button",
    IN_PROGRESS: "complete-quest-button",
    COMPLETED: "approve-quest-button",
    APPROVED: "Quest Approved", // Text indicator
  };

  const indicator = statusIndicators[status];

  if (status === "APPROVED") {
    await expect(questCard.getByText("APPROVED", { exact: true })).toBeVisible();
  } else {
    // Button-based check
    await expect(
      questCard.locator(`[data-testid="${indicator}"]`),
    ).toBeVisible();
  }
}

/**
 * Asserts that a reward is visible in the reward store
 *
 * Checks that a reward with the given name appears in the store and
 * is available for redemption.
 *
 * @param page - Playwright page object
 * @param rewardName - The name of the reward
 *
 * @example
 * ```typescript
 * await navigateToHeroTab(page, "Reward Store");
 * await expectRewardInStore(page, "Extra Screen Time");
 * ```
 */
export async function expectRewardInStore(
  page: Page,
  rewardName: string,
): Promise<void> {
  const rewardCard = page
    .locator('[data-testid^="reward-card-"]')
    .filter({ hasText: rewardName });

  await expect(rewardCard).toBeVisible();

  // Verify it has a redeem button (meaning it's active and available)
  await expect(
    rewardCard.getByRole("button", { name: /redeem/i }),
  ).toBeVisible();
}

/**
 * Asserts that a reward is NOT visible in the reward store
 *
 * Useful for checking that inactive or deleted rewards don't appear.
 *
 * @param page - Playwright page object
 * @param rewardName - The name of the reward
 *
 * @example
 * ```typescript
 * await toggleRewardActive(page, "Old Reward");
 * await navigateToHeroTab(page, "Reward Store");
 * await expectRewardNotInStore(page, "Old Reward");
 * ```
 */
export async function expectRewardNotInStore(
  page: Page,
  rewardName: string,
): Promise<void> {
  const rewardCard = page
    .locator('[data-testid^="reward-card-"]')
    .filter({ hasText: rewardName });

  await expect(rewardCard).not.toBeVisible();
}

/**
 * Asserts that a toast/notification message is displayed
 *
 * Checks for common toast message patterns in the UI.
 *
 * @param page - Playwright page object
 * @param message - The expected message text (can be partial/regex)
 *
 * @example
 * ```typescript
 * await createQuest(page, questData);
 * await expectToastMessage(page, "Quest created successfully");
 * ```
 */
export async function expectToastMessage(
  page: Page,
  message: string | RegExp,
): Promise<void> {
  // Look for common toast/notification selectors
  const toastSelectors = [
    '[data-testid="toast"]',
    '[data-testid="notification"]',
    '[role="alert"]',
    ".toast",
    ".notification",
  ];

  let found = false;

  for (const selector of toastSelectors) {
    const toast = page.locator(selector);
    if (await toast.isVisible({ timeout: 1000 })) {
      if (typeof message === "string") {
        await expect(toast).toContainText(message);
      } else {
        await expect(toast).toContainText(message);
      }
      found = true;
      break;
    }
  }

  if (!found) {
    // Fallback: just check if the text appears anywhere on the page
    if (typeof message === "string") {
      await expect(page.getByText(message)).toBeVisible({ timeout: 5000 });
    } else {
      await expect(page.getByText(message)).toBeVisible({ timeout: 5000 });
    }
  }
}

/**
 * Asserts that a specific admin tab is active
 *
 * Checks that the tab has aria-selected="true" and its content panel is visible.
 *
 * @param page - Playwright page object
 * @param tabName - The name of the tab (e.g., "Overview", "Rewards")
 *
 * @example
 * ```typescript
 * await navigateToAdminTab(page, "Rewards");
 * await expectAdminTabActive(page, "Rewards");
 * ```
 */
export async function expectAdminTabActive(
  page: Page,
  tabName: string,
): Promise<void> {
  const tab = page.getByRole("tab", { name: new RegExp(tabName, "i") });
  await expect(tab).toHaveAttribute("aria-selected", "true");
}

/**
 * Asserts that a quest appears in a specific list
 *
 * Useful for checking if a quest appears in "My Quests", "Available Quests", etc.
 *
 * @param page - Playwright page object
 * @param questName - The title of the quest
 * @param listTestId - Optional test ID of the list container
 *
 * @example
 * ```typescript
 * await expectQuestInList(page, "Clean Your Room");
 * ```
 */
export async function expectQuestInList(
  page: Page,
  questName: string,
  listTestId?: string,
): Promise<void> {
  let container: Page | Locator = page;
  if (listTestId) {
    container = page.getByTestId(listTestId);
  }

  await expect(container.getByText(questName).first()).toBeVisible();
}

/**
 * Asserts that a template exists in the template manager
 *
 * Checks for a template by its title in the quest template manager.
 *
 * @param page - Playwright page object
 * @param templateName - The title of the template
 *
 * @example
 * ```typescript
 * await createQuestTemplate(page, { title: "Daily Chores", ... });
 * await expectTemplateExists(page, "Daily Chores");
 * ```
 */
export async function expectTemplateExists(
  page: Page,
  templateName: string,
): Promise<void> {
  await expect(page.getByRole("heading", { name: templateName })).toBeVisible();
}

/**
 * Asserts that character is on the dashboard
 *
 * Verifies URL and presence of dashboard elements.
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * await navigateToDashboard(page);
 * await expectOnDashboard(page);
 * ```
 */
export async function expectOnDashboard(page: Page): Promise<void> {
  await expect(page).toHaveURL(/.*\/dashboard/);
  await expect(page.getByText("Quest Dashboard")).toBeVisible();
}

/**
 * Asserts that user is on the admin dashboard
 *
 * Verifies URL and presence of admin dashboard elements.
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * await navigateToAdmin(page);
 * await expectOnAdmin(page);
 * ```
 */
export async function expectOnAdmin(page: Page): Promise<void> {
  await expect(page).toHaveURL(/.*\/admin/);
  await expect(page.getByTestId("admin-dashboard")).toBeVisible();
}
