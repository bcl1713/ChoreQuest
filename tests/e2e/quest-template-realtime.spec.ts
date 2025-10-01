import { test, expect, Page, BrowserContext } from '@playwright/test';
import { loginAsGuildMaster, setupFamilyAndLogin } from './setup-helpers';

test.describe('Quest Template Realtime Updates', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    // Create two browser contexts to simulate two users/tabs
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // Setup family and login as Guild Master in first context
    const setup = await setupFamilyAndLogin(page1);

    // Login as the same Guild Master in second context
    await loginAsGuildMaster(page2, setup.email, setup.password);

    // Navigate both pages to the dashboard Quest Templates tab
    await page1.goto('http://localhost:3000/dashboard');
    await page1.getByRole('tab', { name: /quest templates/i }).click();
    await page1.waitForSelector('[data-testid="quest-template-manager"]');

    await page2.goto('http://localhost:3000/dashboard');
    await page2.getByRole('tab', { name: /quest templates/i }).click();
    await page2.waitForSelector('[data-testid="quest-template-manager"]');
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
  });

  test('creating a template in one tab updates the other tab', async () => {
    // Page 1: Create a new template
    await page1.getByTestId('create-template-button').click();
    await page1.getByTestId('template-title-input').fill('Realtime Test Quest');
    await page1.getByTestId('template-description-input').fill('Testing realtime updates');
    await page1.getByTestId('template-category-select').selectOption('DAILY');
    await page1.getByTestId('template-difficulty-select').selectOption('EASY');
    await page1.getByTestId('template-xp-input').fill('100');
    await page1.getByTestId('template-gold-input').fill('20');
    await page1.getByTestId('save-template-button').click();

    // Wait for modal to close on page 1
    await expect(page1.getByTestId('create-template-modal')).not.toBeVisible();

    // Page 2: Verify the new template appears automatically via realtime
    await expect(
      page2.getByRole('heading', { name: 'Realtime Test Quest' })
    ).toBeVisible({ timeout: 5000 });

    // Verify template details
    const templateCard = page2.locator('[data-testid^="template-card-"]').first();
    await expect(templateCard).toContainText('Testing realtime updates');
    await expect(templateCard).toContainText('DAILY');
    await expect(templateCard).toContainText('EASY');
    await expect(templateCard).toContainText('100 XP');
    await expect(templateCard).toContainText('20 gold');
  });

  test('updating a template in one tab updates the other tab', async () => {
    // Page 1: Create a template first
    await page1.getByTestId('create-template-button').click();
    await page1.getByTestId('template-title-input').fill('Original Title');
    await page1.getByTestId('template-description-input').fill('Original description');
    await page1.getByTestId('template-xp-input').fill('50');
    await page1.getByTestId('save-template-button').click();

    // Wait for template to appear on both pages
    await expect(page1.getByRole('heading', { name: 'Original Title' })).toBeVisible();
    await expect(page2.getByRole('heading', { name: 'Original Title' })).toBeVisible({
      timeout: 5000,
    });

    // Page 1: Edit the template
    await page1.locator('[data-testid^="template-edit-"]').first().click();
    await page1.getByTestId('template-title-input').clear();
    await page1.getByTestId('template-title-input').fill('Updated Title');
    await page1.getByTestId('template-description-input').clear();
    await page1.getByTestId('template-description-input').fill('Updated description');
    await page1.getByTestId('template-xp-input').clear();
    await page1.getByTestId('template-xp-input').fill('150');
    await page1.getByTestId('update-template-button').click();

    // Wait for modal to close on page 1
    await expect(page1.getByTestId('edit-template-modal')).not.toBeVisible();

    // Page 2: Verify the template updates automatically
    await expect(page2.getByRole('heading', { name: 'Updated Title' })).toBeVisible({
      timeout: 5000,
    });
    const updatedCard = page2.locator('[data-testid^="template-card-"]').first();
    await expect(updatedCard).toContainText('Updated description');
    await expect(updatedCard).toContainText('150 XP');
  });

  test('toggling template status in one tab updates the other tab', async () => {
    // Page 1: Create a template
    await page1.getByTestId('create-template-button').click();
    await page1.getByTestId('template-title-input').fill('Toggle Test');
    await page1.getByTestId('template-xp-input').fill('75');
    await page1.getByTestId('save-template-button').click();

    // Wait for template to appear
    await expect(page1.getByRole('heading', { name: 'Toggle Test' })).toBeVisible();
    await expect(page2.getByRole('heading', { name: 'Toggle Test' })).toBeVisible({
      timeout: 5000,
    });

    // Verify initial active status on both pages
    const statusButton1 = page1.locator('[data-testid^="template-status-"]').first();
    const statusButton2 = page2.locator('[data-testid^="template-status-"]').first();
    await expect(statusButton1).toContainText('Active');
    await expect(statusButton2).toContainText('Active');

    // Page 1: Deactivate the template
    await page1.locator('[data-testid^="template-toggle-"]').first().click();

    // Page 2: Verify status updates to Inactive
    await expect(statusButton2).toContainText('Inactive', { timeout: 5000 });

    // Page 1: Reactivate the template
    await page1.locator('[data-testid^="template-toggle-"]').first().click();

    // Page 2: Verify status updates back to Active
    await expect(statusButton2).toContainText('Active', { timeout: 5000 });
  });

  test('deleting a template in one tab removes it from the other tab', async () => {
    // Page 1: Create a template
    await page1.getByTestId('create-template-button').click();
    await page1.getByTestId('template-title-input').fill('Delete Test');
    await page1.getByTestId('template-xp-input').fill('60');
    await page1.getByTestId('save-template-button').click();

    // Wait for template to appear on both pages
    await expect(page1.getByRole('heading', { name: 'Delete Test' })).toBeVisible();
    await expect(page2.getByRole('heading', { name: 'Delete Test' })).toBeVisible({
      timeout: 5000,
    });

    // Page 1: Delete the template
    await page1.locator('[data-testid^="template-delete-"]').first().click();
    await page1.getByTestId('confirm-delete-button').click();

    // Wait for modal to close on page 1
    await expect(page1.getByTestId('delete-confirm-modal')).not.toBeVisible();

    // Page 2: Verify the template disappears automatically
    await expect(page2.getByRole('heading', { name: 'Delete Test' })).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('multiple rapid updates sync correctly across tabs', async () => {
    // Page 1: Create a template
    await page1.getByTestId('create-template-button').click();
    await page1.getByTestId('template-title-input').fill('Rapid Update Test');
    await page1.getByTestId('template-xp-input').fill('100');
    await page1.getByTestId('save-template-button').click();

    // Wait for template to appear
    await expect(page2.getByRole('heading', { name: 'Rapid Update Test' })).toBeVisible({
      timeout: 5000,
    });

    // Page 1: Perform multiple rapid updates
    for (let i = 1; i <= 3; i++) {
      await page1.locator('[data-testid^="template-edit-"]').first().click();
      await page1.getByTestId('template-xp-input').clear();
      await page1.getByTestId('template-xp-input').fill(`${100 + i * 50}`);
      await page1.getByTestId('update-template-button').click();
      await page1.waitForTimeout(500); // Small delay between updates
    }

    // Page 2: Verify final state
    const finalCard = page2.locator('[data-testid^="template-card-"]').first();
    await expect(finalCard).toContainText('250 XP', { timeout: 5000 });
  });
});
