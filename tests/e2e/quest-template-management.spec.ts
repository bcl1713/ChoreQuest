import { test, expect, Page } from '@playwright/test';
import { setupUserWithCharacter, clearBrowserState } from './helpers/setup-helpers';

/**
 * Helper to get family code from the dashboard page
 * The family code is displayed as "Guild: Family Name (CODE)"
 */
async function getFamilyCode(page: Page): Promise<string> {
  // Navigate to dashboard if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes('/dashboard')) {
    await page.goto('/dashboard');
    await page.waitForURL(/.*dashboard/);
  }

  // Get the family code from the dashboard - it's displayed as "Guild: Family Name (CODE)"
  const familyCodeElement = await page.locator('text=/Guild:.*\\([A-Z0-9]{6}\\)/').first();

  if (!(await familyCodeElement.isVisible())) {
    throw new Error('Family code not found on dashboard');
  }

  const familyCodeText = await familyCodeElement.textContent();
  if (!familyCodeText) {
    throw new Error('Could not read family code text');
  }

  const codeMatch = familyCodeText.match(/\(([A-Z0-9]{6})\)/);
  if (!codeMatch) {
    throw new Error(`Could not extract family code from: ${familyCodeText}`);
  }

  return codeMatch[1];
}

test.describe('Quest Template Management', () => {
  test('Guild Master creates a new quest template', async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, 'template-test', { characterClass: 'KNIGHT' });

    // Should already be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Quest Templates tab
    await page.click('text=Quest Templates');
    await expect(page.getByTestId('quest-template-manager')).toBeVisible();

    // Verify default templates are loaded (from migration)
    const templateList = page.getByTestId('template-list');
    await expect(templateList).toBeVisible();

    // Click Create Template button
    await page.click('[data-testid="create-template-button"]');
    await expect(page.getByTestId('create-template-modal')).toBeVisible();

    // Fill in template details
    await page.fill('[data-testid="template-title-input"]', 'Custom Cleaning Quest');
    await page.fill(
      '[data-testid="template-description-input"]',
      'A custom quest for cleaning tasks'
    );
    await page.selectOption('[data-testid="template-category-select"]', 'WEEKLY');
    await page.selectOption('[data-testid="template-difficulty-select"]', 'MEDIUM');
    await page.fill('[data-testid="template-xp-input"]', '100');
    await page.fill('[data-testid="template-gold-input"]', '25');

    // Save the template
    await page.click('[data-testid="save-template-button"]');

    // Wait for modal to close and template to appear in list
    await expect(page.getByTestId('create-template-modal')).not.toBeVisible();

    // Find the newly created template card
    const newTemplateCard = page.locator('[data-testid^="template-card-"]').filter({
      hasText: 'Custom Cleaning Quest',
    });

    // Verify the new template appears with correct details
    await expect(newTemplateCard).toBeVisible();
    await expect(newTemplateCard.getByText('A custom quest for cleaning tasks')).toBeVisible();
    await expect(newTemplateCard.getByText('WEEKLY')).toBeVisible();
    await expect(newTemplateCard.getByText('MEDIUM')).toBeVisible();
    await expect(newTemplateCard.getByText('100 XP')).toBeVisible();
    await expect(newTemplateCard.getByText('25 gold')).toBeVisible();
  });

  test('Guild Master edits an existing quest template', async ({ page }) => {
    // Create family and character
    await setupUserWithCharacter(page, 'template-edit', { characterClass: 'MAGE' });

    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Quest Templates
    await page.click('text=Quest Templates');
    await expect(page.getByTestId('quest-template-manager')).toBeVisible();

    // Wait for templates to load
    const templateList = page.getByTestId('template-list');
    await expect(templateList).toBeVisible();

    // Find the first template and click edit
    const firstTemplate = page.locator('[data-testid^="template-card-"]').first();
    const templateId = (await firstTemplate.getAttribute('data-testid'))?.replace(
      'template-card-',
      ''
    );
    await firstTemplate.locator(`[data-testid="template-edit-${templateId}"]`).click();

    // Verify edit modal opens with preview
    await expect(page.getByTestId('edit-template-modal')).toBeVisible();
    await expect(page.getByTestId('template-preview')).toBeVisible();

    // Modify the template
    await page.fill('[data-testid="template-title-input"]', 'Modified Template Title');
    await page.fill('[data-testid="template-description-input"]', 'Updated description');
    await page.fill('[data-testid="template-xp-input"]', '150');

    // Verify preview updates
    await expect(page.getByTestId('template-preview')).toContainText(
      'Modified Template Title'
    );
    await expect(page.getByTestId('template-preview')).toContainText('Updated description');
    await expect(page.getByTestId('template-preview')).toContainText('150 XP');

    // Save the changes
    await page.click('[data-testid="update-template-button"]');

    // Verify modal closes and changes are reflected
    await expect(page.getByTestId('edit-template-modal')).not.toBeVisible();

    // Find the edited template card
    const editedTemplateCard = page.locator('[data-testid^="template-card-"]').filter({
      hasText: 'Modified Template Title',
    });

    await expect(editedTemplateCard).toBeVisible();
    await expect(editedTemplateCard.getByText('Updated description')).toBeVisible();
    await expect(editedTemplateCard.getByText('150 XP')).toBeVisible();
  });

  test('Guild Master deactivates and reactivates a quest template', async ({ page }) => {
    // Create family and character
    await setupUserWithCharacter(page, 'template-toggle', { characterClass: 'RANGER' });

    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Quest Templates
    await page.click('text=Quest Templates');
    await expect(page.getByTestId('quest-template-manager')).toBeVisible();

    // Wait for templates
    const templateList = page.getByTestId('template-list');
    await expect(templateList).toBeVisible();

    // Find the first active template
    const firstTemplate = page.locator('[data-testid^="template-card-"]').first();
    const templateId = (await firstTemplate.getAttribute('data-testid'))?.replace(
      'template-card-',
      ''
    );

    // Verify template is active
    const statusButton = firstTemplate.locator(
      `[data-testid="template-status-${templateId}"]`
    );
    await expect(statusButton).toHaveText('Active');

    // Click deactivate
    const toggleButton = firstTemplate.locator(
      `[data-testid="template-toggle-${templateId}"]`
    );
    await expect(toggleButton).toHaveText('Deactivate');
    await toggleButton.click();

    // Wait for status to update
    await expect(statusButton).toHaveText('Inactive', { timeout: 3000 });
    await expect(toggleButton).toHaveText('Activate');

    // Reactivate the template
    await toggleButton.click();

    // Verify it's active again
    await expect(statusButton).toHaveText('Active', { timeout: 3000 });
    await expect(toggleButton).toHaveText('Deactivate');
  });

  test('Guild Master deletes a quest template', async ({ page }) => {
    // Create family and character
    await setupUserWithCharacter(page, 'template-delete', { characterClass: 'ROGUE' });

    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Quest Templates
    await page.click('text=Quest Templates');
    await expect(page.getByTestId('quest-template-manager')).toBeVisible();

    // Create a new template to delete
    await page.click('[data-testid="create-template-button"]');
    await page.fill('[data-testid="template-title-input"]', 'Template to Delete');
    await page.fill('[data-testid="template-description-input"]', 'This will be deleted');
    await page.click('[data-testid="save-template-button"]');

    // Wait for template to appear
    await expect(page.getByText('Template to Delete')).toBeVisible();

    // Find the template we just created
    const templateToDelete = page.locator('[data-testid^="template-card-"]').filter({
      hasText: 'Template to Delete',
    });
    const templateId = (await templateToDelete.getAttribute('data-testid'))?.replace(
      'template-card-',
      ''
    );

    // Click delete button
    await templateToDelete.locator(`[data-testid="template-delete-${templateId}"]`).click();

    // Verify confirmation modal appears
    await expect(page.getByTestId('delete-confirm-modal')).toBeVisible();
    await expect(page.getByText('Confirm Delete')).toBeVisible();
    await expect(
      page.getByText('Are you sure you want to delete this template?')
    ).toBeVisible();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify modal closes and template is removed
    await expect(page.getByTestId('delete-confirm-modal')).not.toBeVisible();
    await expect(page.getByText('Template to Delete')).not.toBeVisible();
  });

  test('Active templates appear in quest creation modal', async ({ page }) => {
    // Create family and character
    await setupUserWithCharacter(page, 'template-quest', { characterClass: 'HEALER' });

    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Quest Templates and create a custom template
    await page.click('text=Quest Templates');
    await page.click('[data-testid="create-template-button"]');
    await page.fill('[data-testid="template-title-input"]', 'Unique Test Template');
    await page.fill('[data-testid="template-description-input"]', 'For testing quest creation');
    await page.click('[data-testid="save-template-button"]');

    // Verify template was created
    await expect(page.getByText('Unique Test Template')).toBeVisible();

    // Navigate back to Quests & Adventures
    await page.click('text=Quests & Adventures');

    // Click create quest button
    await page.click('[data-testid="create-quest-button"]');

    // Switch to "From Template" tab
    await page.click('text=From Template');

    // Verify our custom template appears in the dropdown
    const templateSelect = page.locator('[data-testid="template-select"]');
    await expect(templateSelect).toBeVisible();

    // Check if our template is in the options
    const options = await templateSelect.locator('option').allTextContents();
    expect(options.some((opt) => opt.includes('Unique Test Template'))).toBeTruthy();

    // Select our template
    await templateSelect.selectOption({ label: /Unique Test Template/ });

    // Verify template details are displayed
    await expect(page.getByText('For testing quest creation')).toBeVisible();
  });

  test('Hero users cannot access Quest Templates tab', async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, 'template-gm', { characterClass: 'KNIGHT' });
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify Guild Master can see Quest Templates tab
    await expect(page.getByText('Quest Templates')).toBeVisible();

    // Get the family code for joining
    const familyCode = await getFamilyCode(page);

    // Logout
    await page.click('text=Logout');
    await expect(page).toHaveURL(/.*\/$/);

    // Register as a Hero (child) user
    const timestamp = Date.now();
    await page.click('a[href="/auth/register"]');
    await page.fill('[data-testid="email-input"]', `hero-${timestamp}@test.com`);
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="display-name-input"]', 'Hero User');
    await page.fill('[data-testid="family-code-input"]', familyCode);
    await page.click('[data-testid="register-button"]');

    // Create character for Hero
    await expect(page).toHaveURL(/.*character\/create/, { timeout: 15000 });
    await page.fill('input#characterName', 'Hero Character');
    await page.click('[data-testid="class-mage"]');
    await page.click('button:text("Begin Your Quest")');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Verify Hero CANNOT see Quest Templates tab
    await expect(page.getByText('Quest Templates')).not.toBeVisible();

    // Verify Hero can see other tabs
    await expect(page.getByText('Quests & Adventures')).toBeVisible();
    await expect(page.getByText('Reward Store')).toBeVisible();
  });
});
