import { test, expect } from '@playwright/test';

test.describe('Quest Interaction Buttons - Core MVP Feature', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear all browser storage and cookies before each test
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Available Quests section displays Pick Up Quest button for Heroes', async ({ page }) => {
    console.log('✅ [Setup] Testing Pick Up Quest button visibility for Heroes');

    // This is a simplified test that assumes we can get to a dashboard with unassigned quests
    // In a real scenario, we would set up the full user flow, but for focused TDD we're
    // testing just the button existence and interaction

    // For now, let's create a minimal test user setup
    const heroEmail = `hero-buttons-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create a family (we need this for the test environment)
    await page.goto('/');
    await page.getByText('🏰 Create Family Guild').click();
    await page.fill('input[name="name"]', 'Button Test Family');
    await page.fill('input[name="email"]', `gm-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'GM');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/character\/create/);
    await page.fill('input#characterName', 'GM Character');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/);

    // Create a simple unassigned quest using the quest creation system
    await page.getByText('⚡ Create Quest').click();
    await page.waitForTimeout(2000);

    // Check if we can see the quest creation modal - if this fails, the test infrastructure needs work
    await expect(page.locator('text=Create New Quest')).toBeVisible();

    // Create from template (simpler than custom quest)
    await page.getByText('Quest Template').click();
    await page.waitForTimeout(1000);

    // Select the first available template
    const firstTemplate = page.locator('.fantasy-card').first();
    await firstTemplate.click();
    await page.waitForTimeout(1000);

    // Submit without assignment (this should create an unassigned quest)
    await page.getByText('Create Quest').click();
    await page.waitForTimeout(2000);

    console.log('✅ [Action] Quest created, now testing Available Quests section');

    // The core test: Check if Available Quests section exists and shows unassigned quest
    await expect(page.getByText('📋 Available Quests')).toBeVisible();

    // Find an unassigned quest card
    const availableQuestsSection = page.locator('section:has-text("📋 Available Quests")');
    const questCard = availableQuestsSection.locator('.fantasy-card').first();

    // This is the CRITICAL FAILING TEST: The Pick Up Quest button should exist but doesn't
    console.log('✅ [Verification] Looking for Pick Up Quest button - THIS SHOULD FAIL');
    const pickUpButton = questCard.locator('button:has-text("Pick Up Quest")');
    await expect(pickUpButton).toBeVisible(); // THIS WILL FAIL - button doesn't exist

    console.log('✅ [Action] Testing Pick Up Quest button functionality');
    await pickUpButton.click();
    await page.waitForTimeout(1000);

    // Verify quest moved to My Quests section
    console.log('✅ [Verification] Quest should move to My Quests section');
    const myQuestsSection = page.locator('section:has-text("🗡️ My Quests")');
    const questInMySection = myQuestsSection.locator('.fantasy-card');
    await expect(questInMySection).toBeVisible();

    await page.screenshot({ path: 'test-pick-up-quest-button.png' });
    console.log('✅ [Verification] Pick Up Quest button test completed');
  });

  test('Available Quests section displays GM management controls', async ({ page }) => {
    console.log('✅ [Setup] Testing GM quest management controls');

    const gmEmail = `gm-controls-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create GM user
    await page.goto('/');
    await page.getByText('🏰 Create Family Guild').click();
    await page.fill('input[name="name"]', 'GM Controls Family');
    await page.fill('input[name="email"]', gmEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Guild Master');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/character\/create/);
    await page.fill('input#characterName', 'Master Control');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/);

    // Create an unassigned quest
    await page.getByText('⚡ Create Quest').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Create New Quest')).toBeVisible();

    await page.getByText('Quest Template').click();
    await page.waitForTimeout(1000);

    const firstTemplate = page.locator('.fantasy-card').first();
    await firstTemplate.click();
    await page.waitForTimeout(1000);

    await page.getByText('Create Quest').click();
    await page.waitForTimeout(2000);

    console.log('✅ [Verification] Testing GM controls in Available Quests section');

    await expect(page.getByText('📋 Available Quests')).toBeVisible();
    const availableQuestsSection = page.locator('section:has-text("📋 Available Quests")');
    const questCard = availableQuestsSection.locator('.fantasy-card').first();

    // CRITICAL FAILING TESTS: These GM controls should exist but don't
    console.log('✅ [Verification] Looking for Assign To dropdown - THIS SHOULD FAIL');
    const assignDropdown = questCard.locator('select[data-testid="assign-quest-dropdown"]');
    await expect(assignDropdown).toBeVisible(); // THIS WILL FAIL

    console.log('✅ [Verification] Looking for Cancel Quest button - THIS SHOULD FAIL');
    const cancelButton = questCard.locator('button:has-text("Cancel Quest")');
    await expect(cancelButton).toBeVisible(); // THIS WILL FAIL

    // Test assignment functionality (this will also fail)
    console.log('✅ [Action] Testing assignment dropdown functionality');
    // Note: This test assumes there are family members to assign to
    // In a complete test, we would create a hero first
    await assignDropdown.selectOption({ index: 0 }); // Select first option

    const assignButton = questCard.locator('button:has-text("Assign")');
    await expect(assignButton).toBeVisible();
    await assignButton.click();
    await page.waitForTimeout(1000);

    console.log('✅ [Action] Testing quest cancellation');
    await cancelButton.click();

    // Expect confirmation dialog
    await expect(page.locator('text=Are you sure')).toBeVisible();
    await page.getByText('Confirm').click();
    await page.waitForTimeout(1000);

    // Quest should be removed completely
    await expect(questCard).not.toBeVisible();

    await page.screenshot({ path: 'test-gm-quest-controls.png' });
    console.log('✅ [Verification] GM quest management controls test completed');
  });

  test('Quest interaction buttons respect user roles', async ({ page }) => {
    console.log('✅ [Setup] Testing role-based quest interaction permissions');

    // This test verifies that:
    // 1. Heroes see "Pick Up Quest" button only
    // 2. GMs see both "Pick Up Quest" AND management controls
    // 3. Young Heroes see appropriate restricted interactions

    // For simplicity, this focused test just checks the GM case
    const gmEmail = `gm-roles-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    await page.goto('/');
    await page.getByText('🏰 Create Family Guild').click();
    await page.fill('input[name="name"]', 'Role Test Family');
    await page.fill('input[name="email"]', gmEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Guild Master');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/character\/create/);
    await page.fill('input#characterName', 'Role Master');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/);

    // Create unassigned quest
    await page.getByText('⚡ Create Quest').click();
    await page.waitForTimeout(2000);
    await page.getByText('Quest Template').click();
    await page.waitForTimeout(1000);
    await page.locator('.fantasy-card').first().click();
    await page.waitForTimeout(1000);
    await page.getByText('Create Quest').click();
    await page.waitForTimeout(2000);

    console.log('✅ [Verification] GM should see ALL quest interaction options');

    const availableQuestsSection = page.locator('section:has-text("📋 Available Quests")');
    const questCard = availableQuestsSection.locator('.fantasy-card').first();

    // GM should see BOTH pickup and management options
    await expect(questCard.locator('button:has-text("Pick Up Quest")')).toBeVisible(); // WILL FAIL
    await expect(questCard.locator('select[data-testid="assign-quest-dropdown"]')).toBeVisible(); // WILL FAIL
    await expect(questCard.locator('button:has-text("Cancel Quest")')).toBeVisible(); // WILL FAIL

    await page.screenshot({ path: 'test-role-permissions.png' });
    console.log('✅ [Verification] Role-based permissions test completed');
  });
});