import { Page, expect } from "@playwright/test";
import {
  openQuestCreationModal,
  setQuestCreationMode,
  navigateToDashboard,
} from "./navigation-helpers";

/**
 * Quest Helper Functions for E2E Tests
 *
 * This module provides reusable quest creation, management, and workflow helpers
 * to reduce code duplication across E2E tests.
 */

export interface QuestData {
  title: string;
  description: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  xpReward?: number;
  goldReward?: number;
  skipVisibilityCheck?: boolean; // Skip the final visibility check
}

export interface QuestTemplateData {
  title: string;
  description: string;
  category?: "DAILY" | "WEEKLY" | "EPIC" | "CUSTOM";
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  xpReward?: number;
  goldReward?: number;
}

export interface QuestFromTemplateOptions {
  assignTo?: string; // Character ID or name
  dueDate?: string; // ISO date string or date input value
}

async function waitForQuestModalToClose(page: Page): Promise<void> {
  // Wait for any background operations to complete before checking modal state
  await page.waitForLoadState("networkidle");

  const modalLocator = page.locator('[data-testid="create-quest-modal"]');
  // Increased timeout for high-concurrency scenarios (parallel test runs)
  await expect(modalLocator).not.toBeVisible({ timeout: 60000 });
  await expect(page.locator("text=Create New Quest")).not.toBeVisible({
    timeout: 10000,
  });
}

/**
 * Creates a custom quest with the specified data
 *
 * Opens the quest creation modal, fills in the form, and submits it.
 * Waits for the modal to close and verifies the quest appears.
 *
 * @param page - Playwright page object
 * @param questData - Quest details (title, description, difficulty, rewards)
 *
 * @example
 * ```typescript
 * await createCustomQuest(page, {
 *   title: "Clean Your Room",
 *   description: "Thoroughly clean and organize your bedroom",
 *   difficulty: "MEDIUM",
 *   xpReward: 100,
 *   goldReward: 50
 * });
 * ```
 */
export async function createCustomQuest(
  page: Page,
  questData: QuestData,
): Promise<void> {
  const {
    title,
    description,
    difficulty = "EASY",
    xpReward = 10,
    goldReward = 5,
    skipVisibilityCheck = false,
  } = questData;

  // Open quest creation modal (handles any existing modal state)
  await openQuestCreationModal(page);

  // Switch to Custom Quest mode
  const customQuestButton = page.getByTestId("adhoc-mode-button");
  await customQuestButton.waitFor({ state: "visible" });
  await customQuestButton.click();

  // Fill quest details
  await page.fill('input[placeholder="Enter quest title..."]', title);
  await page.fill('textarea[placeholder="Describe the quest..."]', description);

  // Set difficulty using explicit test id selector
  await page.getByTestId("quest-difficulty-select").selectOption(difficulty);

  // Set rewards
  const numberInputs = page.locator('input[type="number"]');
  await numberInputs.first().fill(xpReward.toString());
  await numberInputs.nth(1).fill(goldReward.toString());

  // Submit quest
  await page.click('button[type="submit"]');

  // Verify modal closes (allow extra time for repeated runs)
  await waitForQuestModalToClose(page);

  // Wait for navigation/updates to complete after quest creation
  await page.waitForLoadState("networkidle");

  // Verify quest appears in the list (with generous timeout for parallel runs)
  // Skip this check if the caller will verify visibility in a different context
  if (!skipVisibilityCheck) {
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 20000 });
  }
}

/**
 * Creates a quest template with the specified data
 *
 * Navigates to the templates tab (if not already there), opens the template creation
 * modal, fills in the form, and submits it.
 *
 * @param page - Playwright page object
 * @param templateData - Template details (title, description, category, difficulty, rewards)
 *
 * @example
 * ```typescript
 * await createQuestTemplate(page, {
 *   title: "Daily Chores",
 *   description: "Complete daily household chores",
 *   category: "DAILY",
 *   difficulty: "EASY",
 *   xpReward: 50,
 *   goldReward: 25
 * });
 * ```
 */
export async function createQuestTemplate(
  page: Page,
  templateData: QuestTemplateData,
): Promise<void> {
  const {
    title,
    description,
    category = "CUSTOM",
    difficulty = "EASY",
    xpReward = 10,
    goldReward = 5,
  } = templateData;

  // Open template creation modal
  await page.getByTestId("create-template-button").click();

  // Fill template details
  await page.getByTestId("template-title-input").fill(title);
  await page.getByTestId("template-description-input").fill(description);
  await page.getByTestId("template-category-select").selectOption(category);
  await page.getByTestId("template-difficulty-select").selectOption(difficulty);
  await page.getByTestId("template-xp-input").fill(xpReward.toString());
  await page.getByTestId("template-gold-input").fill(goldReward.toString());

  // Submit template
  await page.getByTestId("save-template-button").click();

  // Wait for modal to close
  await expect(page.getByTestId("create-template-modal")).not.toBeVisible();

  // Verify template appears
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

/**
 * Creates a quest from an existing template
 *
 * Opens the quest creation modal, switches to template mode, selects the specified
 * template, optionally assigns it and sets a due date, then submits.
 *
 * @param page - Playwright page object
 * @param templateName - The title of the template to use (or index if using first/nth)
 * @param options - Optional assignment and due date settings
 *
 * @example
 * ```typescript
 * // Create quest from first available template
 * await createQuestFromTemplate(page, "first");
 *
 * // Create quest from specific template
 * await createQuestFromTemplate(page, "Daily Chores", {
 *   assignTo: "Sir Knight",
 *   dueDate: "2025-12-31"
 * });
 * ```
 */
export async function createQuestFromTemplate(
  page: Page,
  templateName: string,
  options?: QuestFromTemplateOptions,
): Promise<void> {
  // Open quest creation modal
  await openQuestCreationModal(page);
  await setQuestCreationMode(page, "template");

  // Select template
  const templateSelect = page.locator('[data-testid="template-select"]');
  await expect(templateSelect).toBeVisible();

  if (templateName === "first") {
    // Select first available template (skip placeholder option)
    const firstTemplateValue = await templateSelect
      .locator("option")
      .nth(1)
      .getAttribute("value");
    await templateSelect.selectOption(firstTemplateValue!);
  } else {
    // Find template by name
    await templateSelect.selectOption({ label: new RegExp(templateName, "i") });
  }

  // Verify template preview appears
  await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();

  // Optionally assign to a character
  if (options?.assignTo) {
    const assignSelect = page.locator("select#assign-to");
    await assignSelect.selectOption({ label: new RegExp(options.assignTo, "i") });
  }

  // Optionally set due date
  if (options?.dueDate) {
    await page.fill('input[type="date"]', options.dueDate);
  }

  // Submit the quest
  await page.click('[data-testid="submit-quest-button"]');

  // Verify modal closes
  await waitForQuestModalToClose(page);
}

/**
 * Picks up a quest (transitions from AVAILABLE to PENDING)
 *
 * @param page - Playwright page object
 * @param questName - Optional quest title to target specific quest (defaults to first quest)
 *
 * @example
 * ```typescript
 * await pickupQuest(page); // Pick up first quest
 * await pickupQuest(page, "Clean Your Room"); // Pick up specific quest
 * ```
 */
export async function pickupQuest(
  page: Page,
  questName?: string,
): Promise<void> {
  await navigateToDashboard(page);
  if (questName) {
    const availableSection = page
      .locator('text=📋 Available Quests')
      .locator("..");
    const questHeading = availableSection.getByRole("heading", {
      name: questName,
      exact: true,
    });
    const questContainer = questHeading.locator("../../..");
    await questContainer.getByTestId("pick-up-quest-button").click();
  } else {
    await page.getByTestId("pick-up-quest-button").first().click();
  }

  if (questName) {
    const questHeading = page.getByRole("heading", {
      name: questName,
      exact: true,
    });
    await expect(questHeading).toBeVisible({ timeout: 15000 });
    const questContainer = questHeading.locator("../../..");
    await expect(async () => {
      const startButtons = questContainer.getByTestId("start-quest-button");
      const count = await startButtons.count();
      expect(count).toBeGreaterThan(0);
      const firstButton = startButtons.first();
      const visible = await firstButton.isVisible();
      expect(visible).toBe(true);
    }).toPass({ timeout: 15000 });
  } else {
    await expect(async () => {
      const startButtons = page.getByTestId("start-quest-button");
      const count = await startButtons.count();
      expect(count).toBeGreaterThan(0);
      const visible = await startButtons.first().isVisible();
      expect(visible).toBe(true);
    }).toPass({ timeout: 15000 });
  }
}

/**
 * Starts a quest (transitions from PENDING to IN_PROGRESS)
 *
 * @param page - Playwright page object
 * @param questName - Optional quest title to target specific quest (defaults to first quest)
 *
 * @example
 * ```typescript
 * await startQuest(page);
 * ```
 */
export async function startQuest(
  page: Page,
  questName?: string,
): Promise<void> {
  if (questName) {
    const myQuestsSection = page.locator("text=🗡️ My Quests").locator("..");
    const questHeading = myQuestsSection.getByRole("heading", {
      name: questName,
      exact: true,
    });
    const questContainer = questHeading.locator("../../..");
    await questContainer.getByTestId("start-quest-button").click();
  } else {
    await page.getByTestId("start-quest-button").first().click();
  }

  if (questName) {
    const questHeading = page.getByRole("heading", {
      name: questName,
      exact: true,
    });
    const questContainer = questHeading.locator("../../..");
    await expect(
      questContainer.getByTestId("complete-quest-button"),
    ).toBeVisible({ timeout: 15000 });
  } else {
    await expect(
      page.getByTestId("complete-quest-button").first(),
    ).toBeVisible({ timeout: 15000 });
  }
}

/**
 * Completes a quest (transitions from IN_PROGRESS to COMPLETED, awaiting approval)
 *
 * @param page - Playwright page object
 * @param questName - Optional quest title to target specific quest (defaults to first quest)
 *
 * @example
 * ```typescript
 * await completeQuest(page);
 * ```
 */
export async function completeQuest(
  page: Page,
  questName?: string,
): Promise<void> {
  if (questName) {
    const myQuestsSection = page.locator("text=🗡️ My Quests").locator("..");
    const questHeading = myQuestsSection.getByRole("heading", {
      name: questName,
      exact: true,
    });
    const questContainer = questHeading.locator("../../..");
    await questContainer.getByTestId("complete-quest-button").click();
  } else {
    await page.getByTestId("complete-quest-button").first().click();
  }

  await page.waitForLoadState("networkidle");
}

/**
 * Approves a completed quest (Guild Master action, awards rewards)
 *
 * @param page - Playwright page object
 * @param questName - Optional quest title to target specific quest (defaults to first quest)
 *
 * @example
 * ```typescript
 * await approveQuest(page);
 * ```
 */
export async function approveQuest(
  page: Page,
  questName?: string,
): Promise<void> {
  if (questName) {
    // Wait for both the quest heading AND the approve button to be visible
    // This ensures the quest has moved to the correct section (Family Quests for GM)
    // and is in the COMPLETED state with the approve button rendered
    const questHeading = page
      .getByRole("heading", { name: questName, exact: true })
      .first();
    await expect(questHeading).toBeVisible({ timeout: 15000 });

    const questContainer = questHeading.locator("../../..");
    const approveButton = questContainer.getByTestId("approve-quest-button");

    // Wait for approve button to be visible (ensures quest is in COMPLETED state)
    await expect(approveButton).toBeVisible({ timeout: 15000 });
    await approveButton.click();
  } else {
    const approveButton = page.getByTestId("approve-quest-button").first();
    await expect(approveButton).toBeVisible({ timeout: 15000 });
    await approveButton.click();
  }

  // Wait for the approval to process
  await page.waitForLoadState("networkidle");
}

/**
 * Denies a completed quest (Guild Master action, does not award rewards)
 *
 * @param page - Playwright page object
 * @param questName - Optional quest title to target specific quest (defaults to first quest)
 *
 * @example
 * ```typescript
 * await denyQuest(page, "Incomplete Chore");
 * ```
 */
export async function denyQuest(
  page: Page,
  questName?: string,
): Promise<void> {
  if (questName) {
    // Find quest by heading in My Quests section
    const myQuestsSection = page.locator('text=🗡️ My Quests').locator('..');
    const questHeading = myQuestsSection.getByRole('heading', { name: questName, exact: true });
    const questContainer = questHeading.locator('../../..');
    await questContainer.locator('button:has-text("Deny")').click();
  } else {
    await page.locator('button:has-text("Deny")').first().click();
  }

  // Wait for the denial to process
  await page.waitForLoadState("networkidle");
}

/**
 * Completes the full quest workflow from creation to approval
 *
 * This is a convenience helper that combines creating a custom quest and
 * completing the entire workflow: pickup → start → complete → approve.
 *
 * @param page - Playwright page object
 * @param questData - Quest creation data
 *
 * @example
 * ```typescript
 * await createAndCompleteQuest(page, {
 *   title: "Test Quest",
 *   description: "Test description",
 *   difficulty: "EASY",
 *   xpReward: 100,
 *   goldReward: 50
 * });
 * ```
 */
export async function createAndCompleteQuest(
  page: Page,
  questData: QuestData,
): Promise<void> {
  await createCustomQuest(page, questData);
  await pickupQuest(page, questData.title);
  await startQuest(page, questData.title);
  await completeQuest(page, questData.title);
  await approveQuest(page, questData.title);
}
