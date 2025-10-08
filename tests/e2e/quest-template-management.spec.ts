import { test, expect } from "./helpers/family-fixture";
import type { Page } from "@playwright/test";
import {
  navigateToDashboard,
  openQuestCreationModal,
} from "./helpers/navigation-helpers";

function uniqueName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix} ${timestamp}-${random}`;
}

async function ensureTemplatesTab(page: Page): Promise<void> {
  await navigateToDashboard(page);
  const questModal = page.locator("text=Create New Quest");
  if (await questModal.isVisible({ timeout: 1000 }).catch(() => false)) {
    const cancelButton = page.locator('[data-testid="cancel-quest-button"]');
    if (await cancelButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await cancelButton.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await expect(questModal).not.toBeVisible({ timeout: 5000 });
  }
  await page.getByTestId("tab-templates").click();
  await expect(page.getByTestId("quest-template-manager")).toBeVisible();
  await expect(page.getByTestId("template-list")).toBeVisible();
}

async function cancelQuestModal(page: Page): Promise<void> {
  const cancelButton = page.locator('[data-testid="cancel-quest-button"]');
  if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await cancelButton.click();
  }
  await expect(page.locator("text=Create New Quest")).not.toBeVisible();
}

async function loadTemplateOptions(page: Page) {
  await page.waitForFunction(() => {
    const select = document.querySelector(
      '[data-testid="template-select"]',
    ) as HTMLSelectElement | null;
    if (!select) return false;
    return Array.from(select.options).some((option) => !!option.value);
  }, { timeout: 15000 });

  return page.evaluate(() => {
    const select = document.querySelector(
      '[data-testid="template-select"]',
    ) as HTMLSelectElement | null;
    if (!select) return [];

    return Array.from(select.options)
      .filter((option) => !!option.value)
      .map((option) => ({
        value: option.value,
        text: option.textContent ?? "",
      }));
  });
}

async function selectTemplateByValue(page: Page, value: string) {
  await expect(async () => {
    await page.selectOption('[data-testid="template-select"]', value);
    const selectedValue = await page.locator(
      '[data-testid="template-select"]',
    ).inputValue();
    if (selectedValue !== value) {
      throw new Error("Template select did not retain value");
    }
  }).toPass({ timeout: 15000 });
}

test.describe("Quest Template Management", () => {
  test("Guild Master creates a new quest template", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await ensureTemplatesTab(gmPage);

    // Click Create Template button
    await gmPage.click('[data-testid="create-template-button"]');
    await expect(gmPage.getByTestId("create-template-modal")).toBeVisible();

    // Fill in template details
    const templateName = uniqueName("Custom Cleaning Quest");
    await gmPage.fill(
      '[data-testid="template-title-input"]',
      templateName,
    );
    await gmPage.fill(
      '[data-testid="template-description-input"]',
      "A custom quest for cleaning tasks",
    );
    await gmPage.selectOption(
      '[data-testid="template-category-select"]',
      "WEEKLY",
    );
    await gmPage.selectOption(
      '[data-testid="template-difficulty-select"]',
      "MEDIUM",
    );
    await gmPage.fill('[data-testid="template-xp-input"]', "100");
    await gmPage.fill('[data-testid="template-gold-input"]', "25");

    // Save the template
    await gmPage.click('[data-testid="save-template-button"]');

    // Wait for modal to close and template to appear in list
    await expect(gmPage.getByTestId("create-template-modal")).not.toBeVisible();

    // Find the newly created template card
    const newTemplateCard = gmPage
      .locator('[data-testid^="template-card-"]')
      .filter({
        hasText: templateName,
      });

    // Verify the new template appears with correct details
    await expect(newTemplateCard).toBeVisible();
    await expect(
      newTemplateCard.getByText("A custom quest for cleaning tasks"),
    ).toBeVisible();
    await expect(newTemplateCard.getByText("WEEKLY")).toBeVisible();
    await expect(newTemplateCard.getByText("MEDIUM")).toBeVisible();
    await expect(newTemplateCard.getByText("100 XP")).toBeVisible();
    await expect(newTemplateCard.getByText("25 gold")).toBeVisible();
  });

  test("Guild Master edits an existing quest template", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await ensureTemplatesTab(gmPage);

    // Find the first template and click edit
    const firstTemplate = gmPage
      .locator('[data-testid^="template-card-"]')
      .first();
    await expect(firstTemplate).toBeVisible({ timeout: 10000 });
    const templateId = (
      await firstTemplate.getAttribute("data-testid")
    )?.replace("template-card-", "");
    expect(templateId).toBeTruthy();
    await firstTemplate
      .locator(`[data-testid="template-edit-${templateId}"]`)
      .click();

    // Verify edit modal opens with preview
    await expect(gmPage.getByTestId("edit-template-modal")).toBeVisible();
    await expect(gmPage.getByTestId("template-preview")).toBeVisible();

    // Modify the template
    await gmPage.fill(
      '[data-testid="template-title-input"]',
      "Modified Template Title",
    );
    await gmPage.fill(
      '[data-testid="template-description-input"]',
      "Updated description",
    );
    await gmPage.fill('[data-testid="template-xp-input"]', "150");

    // Verify preview updates
    await expect(gmPage.getByTestId("template-preview")).toContainText(
      "Modified Template Title",
    );
    await expect(gmPage.getByTestId("template-preview")).toContainText(
      "Updated description",
    );
    await expect(gmPage.getByTestId("template-preview")).toContainText("150 XP");

    // Save the changes
    await gmPage.click('[data-testid="update-template-button"]');

    // Verify modal closes and changes are reflected
    await expect(gmPage.getByTestId("edit-template-modal")).not.toBeVisible();

    // Find the edited template card
    const editedTemplateCard = gmPage
      .locator('[data-testid^="template-card-"]')
      .filter({
        hasText: "Modified Template Title",
      });

    await expect(editedTemplateCard).toBeVisible();
    await expect(
      editedTemplateCard.getByText("Updated description"),
    ).toBeVisible();
    await expect(editedTemplateCard.getByText("150 XP")).toBeVisible();
  });

  test("Guild Master deactivates and reactivates a quest template", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await ensureTemplatesTab(gmPage);

    // Find the first active template
    const firstTemplate = gmPage
      .locator('[data-testid^="template-card-"]')
      .first();
    await expect(firstTemplate).toBeVisible({ timeout: 10000 });
    const templateId = (
      await firstTemplate.getAttribute("data-testid")
    )?.replace("template-card-", "");
    expect(templateId).toBeTruthy();

    // Verify template is active
    const statusButton = firstTemplate.locator(
      `[data-testid="template-status-${templateId}"]`,
    );
    await expect(statusButton).toHaveText("Active");

    // Click deactivate
    const toggleButton = firstTemplate.locator(
      `[data-testid="template-toggle-${templateId}"]`,
    );
    await expect(toggleButton).toHaveText("Deactivate");
    await toggleButton.click();

    // Wait for list to reload and re-query for the status button

    const updatedTemplate = gmPage.locator(
      `[data-testid="template-card-${templateId}"]`,
    );
    const updatedStatusButton = updatedTemplate.locator(
      `[data-testid="template-status-${templateId}"]`,
    );
    await expect(updatedStatusButton).toHaveText("Inactive", { timeout: 3000 });
    const updatedToggleButtonCheck = updatedTemplate.locator(
      `[data-testid="template-toggle-${templateId}"]`,
    );
    await expect(updatedToggleButtonCheck).toHaveText("Activate");

    // Reactivate the template
    const updatedToggleButton = updatedTemplate.locator(
      `[data-testid="template-toggle-${templateId}"]`,
    );
    await updatedToggleButton.click();

    // Wait for list to reload again and verify it's active

    const reactivatedTemplate = gmPage.locator(
      `[data-testid="template-card-${templateId}"]`,
    );
    const reactivatedStatusButton = reactivatedTemplate.locator(
      `[data-testid="template-status-${templateId}"]`,
    );
    const reactivatedToggleButton = reactivatedTemplate.locator(
      `[data-testid="template-toggle-${templateId}"]`,
    );
    await expect(reactivatedStatusButton).toHaveText("Active", {
      timeout: 3000,
    });
    await expect(reactivatedToggleButton).toHaveText("Deactivate");
  });

  test("Guild Master deletes a quest template", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await ensureTemplatesTab(gmPage);

    // Create a new template to delete
    const templateName = uniqueName("Template to Delete");
    await gmPage.click('[data-testid="create-template-button"]');
    await gmPage.fill('[data-testid="template-title-input"]', templateName);
    await gmPage.fill(
      '[data-testid="template-description-input"]',
      "This will be deleted",
    );
    await gmPage.click('[data-testid="save-template-button"]');

    // Wait for template to appear
    await expect(gmPage.getByText(templateName)).toBeVisible();

    // Find the template we just created
    const templateToDelete = gmPage
      .locator('[data-testid^="template-card-"]')
      .filter({
        hasText: templateName,
      });
    const templateId = (
      await templateToDelete.getAttribute("data-testid")
    )?.replace("template-card-", "");
    expect(templateId).toBeTruthy();

    // Click delete button
    await templateToDelete
      .locator(`[data-testid="template-delete-${templateId}"]`)
      .click();

    // Verify confirmation modal appears
    await expect(gmPage.getByTestId("delete-confirm-modal")).toBeVisible();
    await expect(gmPage.getByText("Confirm Delete")).toBeVisible();
    await expect(gmPage.getByTestId("delete-confirm-modal")).toContainText(
      `Are you sure you want to delete ${templateName}?`,
    );

    // Confirm deletion
    await gmPage.click('[data-testid="confirm-delete-button"]');

    // Verify modal closes and template is removed
    await expect(gmPage.getByTestId("delete-confirm-modal")).not.toBeVisible();
    await expect(gmPage.getByText(templateName)).not.toBeVisible();
  });

  test("Active templates appear in quest creation modal", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await ensureTemplatesTab(gmPage);

    const templateName = uniqueName("Unique Test Template");

    await gmPage.click('[data-testid="create-template-button"]');
    await gmPage.fill('[data-testid="template-title-input"]', templateName);
    await gmPage.fill(
      '[data-testid="template-description-input"]',
      "For testing quest creation",
    );
    await gmPage.click('[data-testid="save-template-button"]');

    // Verify template was created
    await expect(gmPage.getByText(templateName)).toBeVisible();

    // Navigate back to Quests & Adventures
    await gmPage.getByTestId("tab-quests").click();

    // Click create quest button
    await openQuestCreationModal(gmPage);

    // Switch to "From Template" tab
    await gmPage.click("text=From Template");

    // Verify our custom template appears in the dropdown
    const templateSelect = gmPage.locator('[data-testid="template-select"]');
    await expect(templateSelect).toBeVisible();

    // Check if our template is in the options
    const options = await templateSelect.locator("option").allTextContents();
    expect(
      options.some((opt) => opt.includes(templateName)),
    ).toBeTruthy();

    // Find the option value for our template
    const templateOption = await templateSelect
      .locator("option", { hasText: templateName })
      .getAttribute("value");

    // Select our template by value
    await selectTemplateByValue(gmPage, templateOption!);

    // Verify template details are displayed
    await expect(gmPage.getByText("For testing quest creation")).toBeVisible();
    await cancelQuestModal(gmPage);
  });

  test("Hero users cannot access Quest Templates tab", async ({ workerFamily }) => {
    const { gmPage, createFamilyMember } = workerFamily;

    await navigateToDashboard(gmPage);
    await expect(gmPage.getByTestId("welcome-message")).toBeVisible({
      timeout: 10000,
    });

    // Verify Guild Master can see Quest Templates tab
    await expect(gmPage.getByTestId("tab-templates")).toBeVisible();

    // Create a hero user within the same family
    const heroUser = await createFamilyMember({
      displayName: "Hero User",
      characterName: "Hero Character",
      characterClass: "MAGE",
    });

    await heroUser.page.waitForURL(/.*dashboard/, { timeout: 20000 });
    await expect(heroUser.page.getByTestId("welcome-message")).toBeVisible({
      timeout: 10000,
    });
    await expect(heroUser.page.getByTestId("tab-templates")).not.toBeVisible({
      timeout: 10000,
    });
    await expect(heroUser.page.getByTestId("tab-quests")).toBeVisible();
    await expect(heroUser.page.getByTestId("tab-rewards")).toBeVisible();
    await heroUser.context.close();
  });
});
