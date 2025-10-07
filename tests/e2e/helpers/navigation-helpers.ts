import { Page, expect } from "@playwright/test";

/**
 * Navigation Helper Functions for E2E Tests
 *
 * This module provides reusable navigation and modal operation helpers
 * to reduce code duplication across E2E tests.
 */

export type AdminTab =
  | "Overview"
  | "Quest Templates"
  | "Rewards"
  | "Guild Masters"
  | "Family Settings";

export type HeroTab =
  | "Quests & Adventures"
  | "Reward Store"
  | "Reward Management";

export type QuestCreationMode = "template" | "adhoc";

/**
 * Navigates to the Admin Dashboard from any page
 *
 * Clicks the admin dashboard button and waits for the admin page to load.
 * Verifies the URL changed to /admin and the dashboard is visible.
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * await navigateToAdmin(page);
 * // Now on admin dashboard Overview tab
 * ```
 */
export async function navigateToAdmin(page: Page): Promise<void> {
  await page.click('[data-testid="admin-dashboard-button"]');
  await expect(page).toHaveURL(/.*\/admin/);
  await expect(page.getByTestId("admin-dashboard")).toBeVisible();
}

/**
 * Navigates to a specific tab within the Admin Dashboard
 *
 * Uses role-based selectors to click the tab and verifies it becomes active.
 * Also checks that the expected content panel is visible.
 *
 * @param page - Playwright page object
 * @param tabName - The name of the admin tab to navigate to
 *
 * @example
 * ```typescript
 * await navigateToAdmin(page);
 * await navigateToAdminTab(page, "Rewards");
 * // Now on Rewards tab with reward manager visible
 * ```
 */
export async function navigateToAdminTab(
  page: Page,
  tabName: AdminTab,
): Promise<void> {
  await page.getByRole("tab", { name: new RegExp(tabName, "i") }).click();
  await expect(
    page.getByRole("tab", { name: new RegExp(tabName, "i") }),
  ).toHaveAttribute("aria-selected", "true");

  // Verify the corresponding content panel is visible
  const contentPanelMap: Record<AdminTab, string> = {
    Overview: "statistics-panel",
    "Quest Templates": "quest-template-manager",
    Rewards: "reward-manager",
    "Guild Masters": "guild-master-manager",
    "Family Settings": "family-settings",
  };

  const contentPanel = contentPanelMap[tabName];
  await expect(page.getByTestId(contentPanel)).toBeVisible();
}

/**
 * Navigates to a specific tab on the Hero Dashboard
 *
 * Clicks the button for the specified tab and waits for content to load.
 *
 * @param page - Playwright page object
 * @param tabName - The name of the hero tab to navigate to
 *
 * @example
 * ```typescript
 * await navigateToHeroTab(page, "Reward Store");
 * // Now on Reward Store tab
 * ```
 */
export async function navigateToHeroTab(
  page: Page,
  tabName: HeroTab,
): Promise<void> {
  const buttonPatterns: Record<HeroTab, string> = {
    "Quests & Adventures": "⚔️ Quests & Adventures",
    "Reward Store": "🏪 Reward Store",
    "Reward Management": "⚙️ Reward Management",
  };

  const buttonText = buttonPatterns[tabName];
  await page.click(`button:has-text("${buttonText}")`);

  // Wait for navigation to complete
  await page.waitForLoadState("networkidle");
}

/**
 * Navigates back to the main dashboard from admin or other pages
 *
 * Clicks the "Back to Dashboard" button and waits for the dashboard to load.
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * await navigateToAdmin(page);
 * // Do some admin work
 * await navigateToDashboard(page);
 * // Back on main dashboard
 * ```
 */
export async function navigateToDashboard(page: Page): Promise<void> {
  const welcomeMessage = page.locator('[data-testid="welcome-message"]');
  if (await welcomeMessage.isVisible()) {
    return;
  }

  await page.goto("/");
  const enterRealmButton = page.locator('text="🏰 Enter Your Realm"');
  if (await enterRealmButton.isVisible()) {
    await enterRealmButton.click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByTestId("welcome-message")).toBeVisible({
      timeout: 15000,
    });
    return;
  }

  const backButton = page.locator("text=Back to Dashboard");
  if (await backButton.isVisible()) {
    await backButton.click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByTestId("welcome-message")).toBeVisible({
      timeout: 15000,
    });
    return;
  }

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/.*\/dashboard/);
  await expect(page.getByTestId("welcome-message")).toBeVisible({
    timeout: 15000,
  });
}

/**
 * Opens a modal by clicking a button with specific text or test ID
 *
 * This is a generic helper for opening modals. Verifies the modal becomes visible.
 *
 * @param page - Playwright page object
 * @param buttonSelector - The button selector (text or data-testid)
 * @param modalTestId - The test ID of the modal to verify
 *
 * @example
 * ```typescript
 * await openModal(page, '[data-testid="create-quest-button"]', 'create-quest-modal');
 * // Modal is now open
 * ```
 */
export async function openModal(
  page: Page,
  buttonSelector: string,
  modalTestId: string,
): Promise<void> {
  await page.click(buttonSelector);
  await expect(page.getByTestId(modalTestId)).toBeVisible();
}

/**
 * Closes a modal by clicking a close/cancel button
 *
 * Tries common close button patterns and verifies the modal is no longer visible.
 *
 * @param page - Playwright page object
 * @param modalTestId - The test ID of the modal to close
 * @param closeMethod - The method to close ('cancel', 'x', 'escape')
 *
 * @example
 * ```typescript
 * await closeModal(page, 'create-quest-modal');
 * // Modal is now closed
 * ```
 */
export async function closeModal(
  page: Page,
  modalTestId: string,
  closeMethod: "cancel" | "x" | "escape" = "cancel",
): Promise<void> {
  if (closeMethod === "cancel") {
    // Look for Cancel button within the modal
    const modal = page.getByTestId(modalTestId);
    const cancelButton = modal.locator('button:has-text("Cancel")');
    if (await cancelButton.isVisible({ timeout: 1000 })) {
      await cancelButton.click();
    }
  } else if (closeMethod === "x") {
    // Look for close X button
    const modal = page.getByTestId(modalTestId);
    const closeButton = modal.locator('button[aria-label="Close"]');
    if (await closeButton.isVisible({ timeout: 1000 })) {
      await closeButton.click();
    }
  } else if (closeMethod === "escape") {
    await page.keyboard.press("Escape");
  }

  // Verify modal is closed
  await expect(page.getByTestId(modalTestId)).not.toBeVisible();
}

/**
 * Sets the quest creation modal mode (template vs custom) and waits for the
 * corresponding content to appear.
 */
export async function setQuestCreationMode(
  page: Page,
  mode: QuestCreationMode,
): Promise<void> {
  const templateButton = page.getByTestId("template-mode-button");
  const adhocButton = page.getByTestId("adhoc-mode-button");
  const targetButton = mode === "template" ? templateButton : adhocButton;
  const expectedActiveClass = "bg-gold-600";
  const modeIndicator =
    mode === "template"
      ? page.locator('[data-testid="template-select"]')
      : page.locator('input[placeholder="Enter quest title..."]');

  await expect(targetButton).toBeVisible({ timeout: 15000 });

  await expect(async () => {
    await targetButton.click();
    const className = (await targetButton.getAttribute("class")) ?? "";
    expect(className.includes(expectedActiveClass)).toBeTruthy();
    const isVisible = await modeIndicator.isVisible();
    expect(isVisible).toBeTruthy();
  }).toPass({ timeout: 15000 });
}

/**
 * Switches to a specific data-testid tab (legacy pattern)
 *
 * Some older tests use data-testid for tab navigation. This helper
 * supports that pattern for backward compatibility.
 *
 * @param page - Playwright page object
 * @param tabTestId - The data-testid of the tab (e.g., "tab-rewards")
 *
 * @example
 * ```typescript
 * await switchToTab(page, "tab-rewards");
 * ```
 */
export async function switchToTab(
  page: Page,
  tabTestId: string,
): Promise<void> {
  await page.click(`[data-testid="${tabTestId}"]`);
  await page.waitForLoadState("networkidle");
}

/**
 * Navigates directly to an admin tab via URL
 *
 * Uses direct URL navigation with query parameters instead of clicking tabs.
 * Useful for testing deep linking and URL persistence.
 *
 * @param page - Playwright page object
 * @param tabName - The tab to navigate to (will be converted to query param)
 *
 * @example
 * ```typescript
 * await navigateToAdminTabViaURL(page, "rewards");
 * // Navigates to /admin?tab=rewards
 * ```
 */
export async function navigateToAdminTabViaURL(
  page: Page,
  tabName: string,
): Promise<void> {
  await page.goto(`/admin?tab=${tabName.toLowerCase().replace(/\s+/g, "-")}`);
  await page.waitForLoadState("networkidle");
}

/**
 * Opens the quest creation modal
 *
 * Convenience helper for the common pattern of opening the quest creation modal.
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * await openQuestCreationModal(page);
 * // Quest creation modal is now open
 * ```
 */
export async function openQuestCreationModal(page: Page): Promise<void> {
  const questModal = page.locator("text=Create New Quest");
  if (await questModal.isVisible({ timeout: 1000 }).catch(() => false)) {
    const cancelButton = page.locator('[data-testid="cancel-quest-button"]');
    if (await cancelButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await cancelButton.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await expect(questModal).not.toBeVisible();
  }
  await page.click('[data-testid="create-quest-button"]');
  await expect(page.locator("text=Create New Quest")).toBeVisible();
}

/**
 * Opens the reward creation modal
 *
 * Convenience helper for the common pattern of opening the reward creation modal.
 * Assumes user is on Reward Management page.
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * await navigateToAdminTab(page, "Rewards");
 * await openRewardCreationModal(page);
 * // Reward creation modal is now open
 * ```
 */
export async function openRewardCreationModal(page: Page): Promise<void> {
  await page.click('[data-testid="create-reward-button"]');
  await expect(page.getByTestId("create-reward-modal")).toBeVisible();
}

/**
 * Opens the template creation modal
 *
 * Convenience helper for the common pattern of opening the template creation modal.
 * Assumes user is on Quest Templates tab.
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * await navigateToAdminTab(page, "Quest Templates");
 * await openTemplateCreationModal(page);
 * // Template creation modal is now open
 * ```
 */
export async function openTemplateCreationModal(page: Page): Promise<void> {
  await page.getByTestId("create-template-button").click();
  await expect(page.getByTestId("create-template-modal")).toBeVisible();
}
