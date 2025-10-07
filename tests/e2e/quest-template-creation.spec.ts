import { test, expect } from "./helpers/family-fixture";
import type { Page } from "@playwright/test";
import { openQuestCreationModal, navigateToDashboard } from "./helpers/navigation-helpers";
import { expectOnDashboard } from "./helpers/assertions";

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

async function cancelQuestModal(page: Page) {
  const cancelButton = page.locator('[data-testid="cancel-quest-button"]');
  if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await cancelButton.click();
  }
  await expect(page.locator("text=Create New Quest")).not.toBeVisible();
}

async function selectTemplateByValue(page: Page, value: string) {
  await expect(async () => {
    await page.selectOption('[data-testid="template-select"]', value);
    const selectedValue = await page.locator('[data-testid="template-select"]').inputValue();
    if (selectedValue !== value) {
      throw new Error("Template select did not retain value");
    }
  }).toPass({ timeout: 15000 });
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
    await gmPage.click('[data-testid="template-mode-button"]');

    // Select a template (should have default templates from database migration)
    const templateSelect = gmPage.locator('[data-testid="template-select"]');
    await expect(templateSelect).toBeVisible();

    const templateOptions = await loadTemplateOptions(gmPage);
    expect(templateOptions.length).toBeGreaterThan(0);
    const firstTemplateOption = templateOptions[0];

    await selectTemplateByValue(gmPage, firstTemplateOption.value);

    // Verify template preview appears
    await expect(gmPage.locator('[data-testid="template-preview"]')).toBeVisible();

    // Submit the quest
    await gmPage.click('[data-testid="submit-quest-button"]');

    // Verify modal closes
    await expect(gmPage.locator('text=Create New Quest')).not.toBeVisible();

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
    await gmPage.click('[data-testid="template-mode-button"]');

    // Select a template
    const templateSelect = gmPage.locator('[data-testid="template-select"]');
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
    await expect(gmPage.locator('text=Create New Quest')).not.toBeVisible();

    // Verify quest was created (it should appear in the quest list)
    await expect(gmPage.locator('.fantasy-card').first()).toBeVisible();
  });

  test("should create quest from template with due date", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    // Open quest creation modal
    await openQuestCreationModal(gmPage);

    // Switch to template mode
    await gmPage.click('[data-testid="template-mode-button"]');

    // Select a template
    const templateSelect = gmPage.locator('[data-testid="template-select"]');
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
    await expect(gmPage.locator('text=Create New Quest')).not.toBeVisible();

    // Verify quest was created
    await expect(gmPage.locator('.fantasy-card').first()).toBeVisible();
  });

  test("should show template preview when selected", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    // Open quest creation modal
    await openQuestCreationModal(gmPage);

    // Switch to template mode
    await gmPage.click('[data-testid="template-mode-button"]');

    // Initially, no preview should be visible
    await expect(gmPage.locator('[data-testid="template-preview"]')).not.toBeVisible();

    // Select a template
    const templateSelect = gmPage.locator('[data-testid="template-select"]');
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

    await cancelQuestModal(gmPage);
  });

  test("should preserve template fields in created quest", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    // Open quest creation modal
    await openQuestCreationModal(gmPage);

    // Switch to template mode
    await gmPage.click('[data-testid="template-mode-button"]');

    // Select a template and capture its details
    const templateSelect = gmPage.locator('[data-testid="template-select"]');
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
    await expect(gmPage.locator('text=Create New Quest')).not.toBeVisible();

    // Verify the created quest has the template title
    await expect(gmPage.locator(`text=${templateTitle}`).first()).toBeVisible();
  });

  test("should handle multiple template selections", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    // Open quest creation modal
    await openQuestCreationModal(gmPage);

    // Switch to template mode
    await gmPage.click('[data-testid="template-mode-button"]');

    const templateSelect = gmPage.locator('[data-testid="template-select"]');
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
    await cancelQuestModal(gmPage);
  });
});
