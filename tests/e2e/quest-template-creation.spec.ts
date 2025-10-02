import { test, expect } from "@playwright/test";
import { setupUserWithCharacter } from "./helpers/setup-helpers";

test.describe("Quest Template Creation E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Setup test family with Guild Master (creates family + character)
    await setupUserWithCharacter(page, "template-test");

    // Should now be on dashboard - verify
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test("should create quest from template with default options", async ({ page }) => {
    // Open quest creation modal
    await page.click('[data-testid="create-quest-button"]');

    // Wait for modal to appear
    await expect(page.locator('text=Create New Quest')).toBeVisible();

    // Switch to template mode
    await page.click('[data-testid="template-mode-button"]');

    // Select a template (should have default templates from database migration)
    const templateSelect = page.locator('[data-testid="template-select"]');
    await expect(templateSelect).toBeVisible();

    // Get first template option (not the placeholder)
    const firstTemplate = await templateSelect.locator('option').nth(1);
    const templateValue = await firstTemplate.getAttribute('value');
    const templateText = await firstTemplate.textContent();

    expect(templateValue).toBeTruthy();
    expect(templateText).toBeTruthy();

    // Select the template
    await templateSelect.selectOption(templateValue!);

    // Verify template preview appears
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();

    // Submit the quest
    await page.click('[data-testid="submit-quest-button"]');

    // Verify modal closes
    await expect(page.locator('text=Create New Quest')).not.toBeVisible();

    // Verify quest appears in the quest list
    // The quest title should match the template title
    const questTitle = templateText!.split(' - ')[0];
    await expect(page.locator(`text=${questTitle}`).first()).toBeVisible();
  });

  test("should create quest from template with assignment", async ({ page }) => {
    // Open quest creation modal
    await page.click('[data-testid="create-quest-button"]');
    await expect(page.locator('text=Create New Quest')).toBeVisible();

    // Switch to template mode
    await page.click('[data-testid="template-mode-button"]');

    // Select a template
    const templateSelect = page.locator('[data-testid="template-select"]');
    const firstTemplateValue = await templateSelect.locator('option').nth(1).getAttribute('value');
    await templateSelect.selectOption(firstTemplateValue!);

    // Assign to a family member (should be current user at minimum)
    const assignSelect = page.locator('select#assign-to');
    const firstMember = await assignSelect.locator('option').nth(1);
    const memberValue = await firstMember.getAttribute('value');

    if (memberValue) {
      await assignSelect.selectOption(memberValue);
    }

    // Submit the quest
    await page.click('[data-testid="submit-quest-button"]');

    // Verify modal closes
    await expect(page.locator('text=Create New Quest')).not.toBeVisible();

    // Verify quest was created (it should appear in the quest list)
    await expect(page.locator('.fantasy-card').first()).toBeVisible();
  });

  test("should create quest from template with due date", async ({ page }) => {
    // Open quest creation modal
    await page.click('[data-testid="create-quest-button"]');
    await expect(page.locator('text=Create New Quest')).toBeVisible();

    // Switch to template mode
    await page.click('[data-testid="template-mode-button"]');

    // Select a template
    const templateSelect = page.locator('[data-testid="template-select"]');
    const firstTemplateValue = await templateSelect.locator('option').nth(1).getAttribute('value');
    await templateSelect.selectOption(firstTemplateValue!);

    // Set a future due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateString = tomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM

    await page.locator('input#due-date').fill(dueDateString);

    // Submit the quest
    await page.click('[data-testid="submit-quest-button"]');

    // Verify modal closes
    await expect(page.locator('text=Create New Quest')).not.toBeVisible();

    // Verify quest was created
    await expect(page.locator('.fantasy-card').first()).toBeVisible();
  });

  test("should show template preview when selected", async ({ page }) => {
    // Open quest creation modal
    await page.click('[data-testid="create-quest-button"]');
    await expect(page.locator('text=Create New Quest')).toBeVisible();

    // Switch to template mode
    await page.click('[data-testid="template-mode-button"]');

    // Initially, no preview should be visible
    await expect(page.locator('[data-testid="template-preview"]')).not.toBeVisible();

    // Select a template
    const templateSelect = page.locator('[data-testid="template-select"]');
    const firstTemplateValue = await templateSelect.locator('option').nth(1).getAttribute('value');
    await templateSelect.selectOption(firstTemplateValue!);

    // Preview should now be visible
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();

    // Preview should contain XP and Gold information within the preview
    const preview = page.locator('[data-testid="template-preview"]');
    await expect(preview.locator('text=/.*XP/')).toBeVisible();
    await expect(preview.locator('text=/💰.*/')).toBeVisible();
  });

  test("should preserve template fields in created quest", async ({ page }) => {
    // Open quest creation modal
    await page.click('[data-testid="create-quest-button"]');
    await expect(page.locator('text=Create New Quest')).toBeVisible();

    // Switch to template mode
    await page.click('[data-testid="template-mode-button"]');

    // Select a template and capture its details
    const templateSelect = page.locator('[data-testid="template-select"]');
    const firstTemplate = await templateSelect.locator('option').nth(1);
    const templateValue = await firstTemplate.getAttribute('value');
    const templateFullText = await firstTemplate.textContent();

    await templateSelect.selectOption(templateValue!);

    // Wait for preview to load
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();

    // Extract template title from the option text (format: "Title - DIFFICULTY (XP XP, Gold Gold)")
    const templateTitle = templateFullText!.split(' - ')[0];

    // Extract XP and Gold from preview
    const previewText = await page.locator('[data-testid="template-preview"]').textContent();
    expect(previewText).toContain('XP');

    // Submit the quest
    await page.click('[data-testid="submit-quest-button"]');

    // Verify modal closes
    await expect(page.locator('text=Create New Quest')).not.toBeVisible();

    // Verify the created quest has the template title
    await expect(page.locator(`text=${templateTitle}`).first()).toBeVisible();
  });

  test("should handle multiple template selections", async ({ page }) => {
    // Open quest creation modal
    await page.click('[data-testid="create-quest-button"]');
    await expect(page.locator('text=Create New Quest')).toBeVisible();

    // Switch to template mode
    await page.click('[data-testid="template-mode-button"]');

    const templateSelect = page.locator('[data-testid="template-select"]');

    // Select first template
    const firstTemplateValue = await templateSelect.locator('option').nth(1).getAttribute('value');
    await templateSelect.selectOption(firstTemplateValue!);
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();

    // Check if there's a second template option
    const secondTemplate = templateSelect.locator('option').nth(2);
    const secondTemplateValue = await secondTemplate.getAttribute('value');

    if (secondTemplateValue) {
      // Select second template
      await templateSelect.selectOption(secondTemplateValue);

      // Preview should still be visible but with different content
      await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();
    }

    // Cancel the modal
    await page.click('[data-testid="cancel-quest-button"]');
    await expect(page.locator('text=Create New Quest')).not.toBeVisible();
  });
});
