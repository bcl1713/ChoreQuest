import { test, expect } from "@playwright/test";
import { setupUserWithCharacter, commonBeforeEach } from './helpers/setup-helpers';

test.describe("Quest Template Due Date", () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test("create quest from template with due date", async ({ page }) => {
    // Calculate due date for tomorrow at 3:00 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);
    const dueDateTimeString = tomorrow.toISOString().slice(0, 16);

    // Login to demo family with existing templates
    await page.goto("/");
    await page.getByText("Already have an account? Login here").click();
    await expect(page).toHaveURL(/.*\/auth\/login/);

    await page.fill('input[name="email"]', "parent@demo.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText("Welcome back, Lady Sarah!")).toBeVisible();

    // Open quest creation modal
    await page.getByText("⚡ Create Quest").click();
    await expect(page.locator("text=Create New Quest")).toBeVisible();

    // Select a quest template if available
    const templateSelector = page.locator('select:has-text("Choose a quest template..")').first();
    await page.waitForTimeout(1000);

    const templateOptions = await templateSelector.locator('option:not([value=""])').count();
    if (templateOptions > 0) {
      await templateSelector.selectOption({ index: 1 });
    }

    // Set due date and time
    const dueDateInput = page.locator('input[type="datetime-local"]');
    await expect(dueDateInput).toBeVisible();
    await dueDateInput.fill(dueDateTimeString);
    expect(await dueDateInput.inputValue()).toBe(dueDateTimeString);

    // Assign to family member if options available
    const assigneeSelect = page.locator('select:has-text("Assign to (optional)")').first();
    const hasAssigneeOptions = await assigneeSelect.locator('option:not([value=""])').count();
    if (hasAssigneeOptions > 0) {
      await assigneeSelect.selectOption({ index: 1 });
    }

    // Submit quest
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify quest creation success
    const modalClosed = !await page.locator("text=Create New Quest").isVisible().catch(() => false);
    expect(modalClosed).toBe(true);
  });

  test("due date validation prevents past dates", async ({ page }) => {
    await setupUserWithCharacter(page, 'DueDateValidation', { characterClass: 'RANGER' });

    // Open quest creation modal
    await page.getByText("⚡ Create Quest").click();
    await page.click("text=Custom Quest");

    // Fill required fields
    await page.fill('input[placeholder="Enter quest title..."]', "Due Date Test Quest");
    await page.fill('textarea[placeholder="Describe the quest..."]', "Testing due date validation");

    // Try setting past date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    const pastDateString = yesterday.toISOString().slice(0, 16);

    await page.locator('input[type="datetime-local"]').fill(pastDateString);
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(1000);

    // Modal should remain visible (validation failed)
    expect(await page.locator("text=Create New Quest").isVisible()).toBe(true);

    // Set valid future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(14, 30, 0, 0);
    const futureDateString = futureDate.toISOString().slice(0, 16);

    await page.locator('input[type="datetime-local"]').fill(futureDateString);
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(2000);

    // Modal should close with valid date
    expect(await page.locator("text=Create New Quest").isVisible().catch(() => false)).toBe(false);
  });

  test("due date displays in quest list", async ({ page }) => {
    await setupUserWithCharacter(page, 'DueDateDisplay', { characterClass: 'ROGUE' });

    // Create quest with specific due date
    await page.getByText("⚡ Create Quest").click();
    await page.click("text=Custom Quest");

    await page.fill('input[placeholder="Enter quest title..."]', "Display Test Quest");
    await page.fill('textarea[placeholder="Describe the quest..."]', "Testing due date display");

    // Set due date to 2 days from now at 4:30 PM
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    targetDate.setHours(16, 30, 0, 0);
    const targetDateString = targetDate.toISOString().slice(0, 16);

    await page.locator('input[type="datetime-local"]').fill(targetDateString);
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify due date appears in quest card
    const foundDisplayFormat = await page
      .locator(".fantasy-card")
      .filter({ hasText: "Due" })
      .first()
      .isVisible()
      .catch(() => false);

    expect(foundDisplayFormat).toBe(true);
  });
});