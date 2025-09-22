import { test, expect } from '@playwright/test';

test.describe('Quest System', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear all browser storage and cookies before each test
    await context.clearCookies();
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Guild Master can create custom quests', async ({ page }) => {
    console.log('✅ [Setup] Starting Guild Master custom quest creation test');
    const testEmail = `guild-quest-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create a new family and user (Guild Master)
    await page.goto('http://localhost:3000');
    await page.screenshot({ path: 'test-quest-system-custom-creation-setup.png' });
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Quest Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Quest Guild Master');
    await page.click('button[type="submit"]');

    // Complete character creation
    console.log('✅ [Action] Completing character creation for quest master');
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir QuestMaster');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Welcome back, Sir QuestMaster!')).toBeVisible();

    // Verify Quest Dashboard is visible
    await expect(page.getByText('Quest Dashboard')).toBeVisible();
    await expect(page.getByText('🗡️ My Quests')).toBeVisible();

    // Verify Guild Master has Create Quest button
    await expect(page.getByText('⚡ Create Quest')).toBeVisible();

    // Click Create Quest button (the one in the header, not the form submit button)
    console.log('✅ [Action] Opening quest creation modal');
    await page.locator('header button:has-text("⚡ Create Quest")').click();

    // Verify modal opened
    console.log('✅ [Verification] Verifying modal opened successfully');
    await expect(page.getByText('Create New Quest')).toBeVisible();

    // Switch to Custom Quest mode
    console.log('✅ [Action] Switching to Custom Quest tab');
    await page.click('text=Custom Quest');

    // Fill in quest details
    console.log('✅ [Action] Filling quest creation form');
    await page.fill('input[placeholder="Enter quest title..."]', 'Test Custom Quest');
    await page.fill('textarea[placeholder="Describe the quest..."]', 'This is a test quest for automation');

    // Verify difficulty is set to Easy (should be default)
    await expect(page.locator('select').filter({ has: page.locator('option[value="EASY"]') })).toHaveValue('EASY');

    // Set XP and Gold rewards
    await page.fill('input[type="number"]:near(:text("XP Reward"))', '25');
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', '10');

    // Create the quest (click the submit button inside the modal)
    console.log('✅ [Action] Submitting quest creation form');
    await page.locator('.fantasy-card button:has-text("⚡ Create Quest")').click();

    // Verify quest was created and modal closed
    console.log('✅ [Verification] Verifying quest creation success');
    await expect(page.getByText('Create New Quest')).not.toBeVisible();

    // Verify quest appears in the dashboard
    await expect(page.getByText('Test Custom Quest')).toBeVisible();
    await expect(page.getByText('This is a test quest for automation')).toBeVisible();

    await page.screenshot({ path: 'test-quest-system-custom-creation-verification.png' });
    console.log('✅ [Verification] Custom quest creation test completed successfully');
  });

  test('Quest dashboard displays correctly for Guild Master', async ({ page }) => {
    console.log('✅ [Setup] Starting quest dashboard display test');
    const testEmail = `dashboard-test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create a new family and user (Guild Master)
    await page.goto('http://localhost:3000');
    await page.screenshot({ path: 'test-quest-system-dashboard-display-setup.png' });
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Dashboard Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Dashboard Test Master');
    await page.click('button[type="submit"]');

    // Complete character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir Dashboard');
    await page.click('[data-testid="class-mage"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Verify quest dashboard elements are present
    console.log('✅ [Verification] Validating quest dashboard elements');
    await expect(page.getByText('Quest Dashboard')).toBeVisible();
    await expect(page.getByText('🗡️ My Quests')).toBeVisible();

    // For new Guild Master, should see "No active quests" message
    await expect(page.getByText('No active quests. Ready for adventure?')).toBeVisible();

    // Verify Create Quest button is visible for Guild Master
    await expect(page.getByText('⚡ Create Quest')).toBeVisible();

    await page.screenshot({ path: 'test-quest-system-dashboard-display-verification.png' });
    console.log('✅ [Verification] Quest dashboard display test completed successfully');
  });

  test('Quest creation modal validation works', async ({ page }) => {
    console.log('✅ [Setup] Starting quest creation modal validation test');
    const testEmail = `validation-test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create a new family and user (Guild Master)
    await page.goto('http://localhost:3000');
    await page.screenshot({ path: 'test-quest-system-validation-setup.png' });
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Validation Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Validation Test Master');
    await page.click('button[type="submit"]');

    // Complete character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir Validator');
    await page.click('[data-testid="class-ranger"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Open create quest modal (click header button)
    await page.locator('header button:has-text("⚡ Create Quest")').click();
    await expect(page.getByText('Create New Quest')).toBeVisible();

    // Switch to Custom Quest mode
    await page.click('text=Custom Quest');

    // Try to submit empty form (should show validation error or stay open)
    await page.locator('.fantasy-card button:has-text("⚡ Create Quest")').click();

    // Modal should still be visible (validation failed)
    await expect(page.getByText('Create New Quest')).toBeVisible();

    // Fill required fields one by one
    await page.fill('input[placeholder="Enter quest title..."]', 'Valid Quest Title');

    // Try again with just title
    await page.locator('.fantasy-card button:has-text("⚡ Create Quest")').click();
    await expect(page.getByText('Create New Quest')).toBeVisible(); // Should still be open

    // Add description
    await page.fill('textarea[placeholder="Describe the quest..."]', 'Valid quest description');

    // Now it should work
    await page.locator('.fantasy-card button:has-text("⚡ Create Quest")').click();

    // Modal should close after successful creation
    await expect(page.getByText('Create New Quest')).not.toBeVisible();

    // Verify quest was created
    await expect(page.getByText('Valid Quest Title')).toBeVisible();
  });

  test('Quest creation modal can be cancelled', async ({ page }) => {
    const testEmail = `cancel-test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create a new family and user (Guild Master)
    await page.goto('http://localhost:3000');
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Cancel Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Cancel Test Master');
    await page.click('button[type="submit"]');

    // Complete character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir Cancel');
    await page.click('[data-testid="class-healer"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Open create quest modal (click header button)
    await page.locator('header button:has-text("⚡ Create Quest")').click();
    await expect(page.getByText('Create New Quest')).toBeVisible();

    // Switch to Custom Quest mode
    await page.click('text=Custom Quest');

    // Fill in some data
    await page.fill('input[placeholder="Enter quest title..."]', 'This will be cancelled');

    // Cancel the modal - use a more specific selector to target the modal's cancel button
    await page.locator('.fixed button:has-text("Cancel")').click();

    // Modal should be closed
    await expect(page.getByText('Create New Quest')).not.toBeVisible();

    // Quest should not have been created
    await expect(page.getByText('This will be cancelled')).not.toBeVisible();
  });

  test('Non-existent family member creation still shows quest UI', async ({ page }) => {
    const testEmail = `basic-ui-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create a new family with just one member (hero, not guild master)
    // Note: In the current system, the first user is always the Guild Master
    // This test verifies the UI loads correctly for any user
    await page.goto('http://localhost:3000');
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Basic UI Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Basic UI User');
    await page.click('button[type="submit"]');

    // Complete character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir Basic');
    await page.click('[data-testid="class-rogue"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Verify basic quest dashboard elements are present
    await expect(page.getByText('Quest Dashboard')).toBeVisible();
    await expect(page.getByText('🗡️ My Quests')).toBeVisible();

    // Since this is the Guild Master (first user), they should see Create Quest button
    await expect(page.getByText('⚡ Create Quest')).toBeVisible();
  });
});