import { test, expect } from "./helpers/family-fixture";
import type { Page } from "@playwright/test";
import {
  openQuestCreationModal,
  navigateToDashboard,
  setQuestCreationMode,
  closeModal,
} from "./helpers/navigation-helpers";
import { expectOnDashboard } from "./helpers/assertions";

async function loadTemplateOptions(page: Page) {
  const templateSelect = page.locator('[data-testid="template-select"]');
  await templateSelect.waitFor({ state: "attached", timeout: 15000 });
  await expect(templateSelect).toBeVisible({ timeout: 15000 });

  let options: { value: string; text: string }[] = [];

  await expect(async () => {
    options = await templateSelect.evaluate((select) =>
      Array.from(select.options)
        .filter((option) => option.value)
        .map((option) => ({
          value: option.value,
          text: option.textContent ?? "",
        })),
    );
    expect(options.length).toBeGreaterThan(0);
  }).toPass({ timeout: 20000 });

  return options;
}

async function selectTemplateByValue(page: Page, value: string) {
  const selectLocator = page.locator('[data-testid="template-select"]');
  await expect(selectLocator).toBeVisible({ timeout: 15000 });

  await expect(async () => {
    const optionCount = await selectLocator
      .locator(`option[value="${value}"]`)
      .count();
    expect(optionCount).toBeGreaterThan(0);

    await selectLocator.selectOption(value);
    const selectedValue = await selectLocator.inputValue();
    if (selectedValue !== value) {
      throw new Error("Template select did not retain value");
    }
  }).toPass({ timeout: 25000 });
}

test.describe("Quest Template Creation E2E", () => {
  test.beforeEach(async ({ workerFamily }) => {
    await navigateToDashboard(workerFamily.gmPage);
    await expectOnDashboard(workerFamily.gmPage);
  });

  test("should create quest from template with default options", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    // Open quest creation modal
    await openQuestCreationModal(gmPage);

    // Switch to template mode
    await setQuestCreationMode(gmPage, "template");

    const templateOptions = await loadTemplateOptions(gmPage);
    expect(templateOptions.length).toBeGreaterThan(0);
    const firstTemplateOption = templateOptions[0];

    await selectTemplateByValue(gmPage, firstTemplateOption.value);

    // Verify template preview appears
    await expect(gmPage.locator('[data-testid="template-preview"]')).toBeVisible();

    // Submit the quest
    await gmPage.click('[data-testid="submit-quest-button"]');

    // Verify modal closes
    await expect(gmPage.getByTestId("create-quest-modal")).not.toBeVisible();

    // Verify quest appears in the quest list
    // The quest title should match the template title
    const questTitle = firstTemplateOption.text.split(' - ')[0];
    await expect(gmPage.locator(`text=${questTitle}`).first()).toBeVisible();
  });

  test("should create quest from template with assignment", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    // Open quest creation modal
    await openQuestCreationModal(gmPage);

    // Switch to template mode
    await setQuestCreationMode(gmPage, "template");

    const templateOptions = await loadTemplateOptions(gmPage);
    expect(templateOptions.length).toBeGreaterThan(0);
    const firstTemplateOption = templateOptions[0];

    await selectTemplateByValue(gmPage, firstTemplateOption.value);

    // Assign to a family member (should be current user at minimum)
    const assignSelect = gmPage.locator('select#assign-to');
    const firstMember = await assignSelect.locator('option').nth(1);
    const memberValue = await firstMember.getAttribute('value');

    if (memberValue) {
      await assignSelect.selectOption(memberValue);
    }

    // Submit the quest
    await gmPage.click('[data-testid="submit-quest-button"]');

    // Verify modal closes
    await expect(gmPage.getByTestId("create-quest-modal")).not.toBeVisible();

    // Verify quest was created (it should appear in the quest list)
    await expect(gmPage.locator('.fantasy-card').first()).toBeVisible();
  });

  test("should create quest from template with due date", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    // Open quest creation modal
    await openQuestCreationModal(gmPage);

    // Switch to template mode
    await setQuestCreationMode(gmPage, "template");

    const templateOptions = await loadTemplateOptions(gmPage);
    expect(templateOptions.length).toBeGreaterThan(0);
    const firstTemplateOption = templateOptions[0];

    await selectTemplateByValue(gmPage, firstTemplateOption.value);

    // Set a future due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateString = tomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM

    await gmPage.locator('input#due-date').fill(dueDateString);

    // Submit the quest
    await gmPage.click('[data-testid="submit-quest-button"]');

    // Verify modal closes
    await expect(gmPage.getByTestId("create-quest-modal")).not.toBeVisible();

    // Verify quest was created
    await expect(gmPage.locator('.fantasy-card').first()).toBeVisible();
  });

  test("should show template preview when selected", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    // Open quest creation modal
    await openQuestCreationModal(gmPage);

    // Switch to template mode
    await setQuestCreationMode(gmPage, "template");

    // Initially, no preview should be visible
    await expect(gmPage.locator('[data-testid="template-preview"]')).not.toBeVisible();

    // Select a template
    const templateOptions = await loadTemplateOptions(gmPage);
    expect(templateOptions.length).toBeGreaterThan(0);
    const firstTemplateOption = templateOptions[0];

    await selectTemplateByValue(gmPage, firstTemplateOption.value);

    // Preview should now be visible
    await expect(gmPage.locator('[data-testid="template-preview"]')).toBeVisible();

    // Preview should contain XP and Gold information within the preview
    const preview = gmPage.locator('[data-testid="template-preview"]');
    await expect(preview.locator('text=/.*XP/')).toBeVisible();
    await expect(preview.locator('text=/💰.*/')).toBeVisible();

    await closeModal(gmPage, "create-quest-modal");
  });

  test("should preserve template fields in created quest", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    // Open quest creation modal
    await openQuestCreationModal(gmPage);

    // Switch to template mode
    await setQuestCreationMode(gmPage, "template");

    const templateOptions = await loadTemplateOptions(gmPage);
    expect(templateOptions.length).toBeGreaterThan(0);
    const firstTemplateOption = templateOptions[0];
    expect(firstTemplateOption.text).toBeTruthy();

    await selectTemplateByValue(gmPage, firstTemplateOption.value);

    // Wait for preview to load
    await expect(gmPage.locator('[data-testid="template-preview"]')).toBeVisible();

    // Extract template title from the option text (format: "Title - DIFFICULTY (XP XP, Gold Gold)")
    const templateTitle = firstTemplateOption.text.split(' - ')[0];

    // Extract XP and Gold from preview
    const previewText = await gmPage.locator('[data-testid="template-preview"]').textContent();
    expect(previewText).toContain('XP');

    // Submit the quest
    await gmPage.click('[data-testid="submit-quest-button"]');

    // Verify modal closes
    await expect(gmPage.getByTestId("create-quest-modal")).not.toBeVisible();

    // Verify the created quest has the template title
    await expect(gmPage.locator(`text=${templateTitle}`).first()).toBeVisible();
  });

  test("should handle multiple template selections", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    // Open quest creation modal
    await openQuestCreationModal(gmPage);

    // Switch to template mode
    await setQuestCreationMode(gmPage, "template");

    const templateOptions = await loadTemplateOptions(gmPage);
    expect(templateOptions.length).toBeGreaterThan(0);

    await selectTemplateByValue(gmPage, templateOptions[0].value);
    await expect(gmPage.locator('[data-testid="template-preview"]')).toBeVisible();

    // Check if there's a second template option
    if (templateOptions.length > 1) {
      await selectTemplateByValue(gmPage, templateOptions[1].value);
      await expect(gmPage.locator('[data-testid="template-preview"]')).toBeVisible();
    }

    // Cancel the modal
    await closeModal(gmPage, "create-quest-modal");
  });
});
