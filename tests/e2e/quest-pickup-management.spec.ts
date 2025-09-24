import { test, expect } from '@playwright/test';

test.describe('Quest Pickup and Management System', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear all browser storage and cookies before each test
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Guild Master can pick up their own available quests', async ({ page }) => {
    console.log('✅ [Setup] Starting GM quest pickup test');
    const gmEmail = `gm-pickup-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create GM and family first
    await page.goto('/');
    await page.screenshot({ path: 'test-quest-pickup-hero-setup.png' });
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Pickup Test Family');
    await page.fill('input[name="email"]', gmEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Guild Master');
    await page.click('button[type="submit"]');

    // Complete GM character creation
    console.log('✅ [Action] Completing GM character creation');
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Master Creator');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Create an unassigned quest
    console.log('✅ [Action] Creating unassigned quest');
    await page.click('button:text("⚡ Create Quest")');
    await expect(page.locator("text=Create New Quest")).toBeVisible();

    // Switch to custom quest tab and create a quest
    await page.locator('.fixed button:has-text("Custom Quest")').click();
    await page.waitForTimeout(1000);

    await page.fill('input[placeholder="Enter quest title..."]', 'Clean the Kitchen');
    await page.fill('textarea[placeholder="Describe the quest..."]', 'Deep clean kitchen counters and dishes');
    await page.locator("select").nth(1).selectOption("MEDIUM"); // Select the difficulty dropdown (2nd select)
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', "25");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "50");

    // Don't assign to anyone - leave unassigned
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // As a Guild Master, we can pick up our own unassigned quests
    // No need to logout and create a second user - GM can pick up quests too

    // Verify Available Quests section is visible
    console.log('✅ [Verification] Checking Available Quests section');
    await expect(page.getByText('📋 Available Quests')).toBeVisible();
    await expect(page.getByText('Clean the Kitchen')).toBeVisible();

    // Guild Master should be able to pick up their own unassigned quests
    console.log('✅ [Action] Attempting to pick up available quest as GM');
    const questCard = page.locator('.fantasy-card:has-text("Clean the Kitchen")');
    await expect(questCard).toBeVisible();

    // Look for Pick Up Quest button (GM should see this)
    const pickupButton = questCard.locator('button:has-text("Pick Up Quest")');
    await expect(pickupButton).toBeVisible();

    await pickupButton.click();
    await page.waitForTimeout(2000);

    // Verify quest moved to "My Quests" section
    console.log('✅ [Verification] Verifying quest pickup success');
    await expect(page.getByText('🗡️ My Quests')).toBeVisible();
    const myQuestsSection = page.locator('section:has-text("🗡️ My Quests")');
    await expect(myQuestsSection.locator('text=Clean the Kitchen')).toBeVisible();

    // Verify quest is no longer in Available Quests
    const availableQuestsSection = page.locator('section:has-text("📋 Available Quests")');
    await expect(availableQuestsSection.locator('text=Clean the Kitchen')).not.toBeVisible();

    await page.screenshot({ path: 'test-quest-pickup-gm-verification.png' });
    console.log('✅ [Verification] GM quest pickup test completed successfully');
  });

  test('Guild Master can cancel available quests', async ({ page }) => {
    console.log('✅ [Setup] Starting GM quest cancellation test');
    const gmEmail = `gm-cancel-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create GM and family
    await page.goto('/');
    await page.screenshot({ path: 'test-quest-management-gm-setup.png' });
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Cancellation Test Family');
    await page.fill('input[name="email"]', gmEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Guild Master');
    await page.click('button[type="submit"]');

    // Complete GM character creation
    console.log('✅ [Action] Completing GM character creation');
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Master Manager');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Stay logged in as GM to test quest cancellation

    // Create an unassigned quest
    console.log('✅ [Action] Creating unassigned quest for management');
    await page.click('button:text("⚡ Create Quest")');
    await expect(page.locator("text=Create New Quest")).toBeVisible();

    // Switch to custom quest tab and create a quest
    await page.locator('.fixed button:has-text("Custom Quest")').click();
    await page.waitForTimeout(1000);

    await page.fill('input[placeholder="Enter quest title..."]', 'Organize Garage');
    await page.fill('textarea[placeholder="Describe the quest..."]', 'Sort and organize garage storage');
    await page.locator("select").nth(1).selectOption("HARD"); // Select the difficulty dropdown (2nd select)
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', "35");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "75");

    // Leave unassigned
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify Available Quests section shows the quest
    console.log('✅ [Verification] Checking Available Quests section as GM');
    await expect(page.getByText('📋 Available Quests')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Organize Garage' })).toBeVisible();

    // GM should see management buttons for their quests
    console.log('✅ [Action] Testing GM quest cancellation');
    const questCard = page.locator('.fantasy-card:has-text("Organize Garage")');
    await expect(questCard).toBeVisible();

    // Look for Cancel Quest button
    const cancelButton = questCard.locator('button:has-text("Cancel Quest")');
    await expect(cancelButton).toBeVisible();

    // Set up dialog handler to accept the confirmation dialog
    page.on('dialog', dialog => dialog.accept());

    // Test cancellation functionality
    await cancelButton.click();
    await page.waitForTimeout(2000);

    // Verify quest is completely removed
    console.log('✅ [Verification] Verifying quest cancellation success');
    await expect(page.locator('text=Organize Garage')).not.toBeVisible();

    await page.screenshot({ path: 'test-quest-management-gm-verification.png' });
    console.log('✅ [Verification] GM quest management test completed successfully');
  });

  test('Quest pickup respects role permissions', async ({ page }) => {
    console.log('✅ [Setup] Starting quest pickup permissions test');
    const gmEmail = `gm-perms-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create GM and family
    await page.goto('/');
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Permissions Test Family');
    await page.fill('input[name="email"]', gmEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Guild Master');
    await page.click('button[type="submit"]');

    // Complete GM character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Master Perms');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Create an unassigned quest
    await page.click('button:text("⚡ Create Quest")');
    await expect(page.locator("text=Create New Quest")).toBeVisible();

    // Switch to custom quest tab and create a quest
    await page.locator('.fixed button:has-text("Custom Quest")').click();
    await page.waitForTimeout(1000);

    await page.fill('input[placeholder="Enter quest title..."]', 'Permission Test Quest');
    await page.fill('textarea[placeholder="Describe the quest..."]', 'Test role-based permissions');
    await page.locator("select").nth(1).selectOption("MEDIUM"); // Select the difficulty dropdown (2nd select)
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', "20");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "40");

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify GM sees both pickup AND management options
    console.log('✅ [Verification] Testing GM permissions on available quests');
    const questCard = page.locator('.fantasy-card:has-text("Permission Test Quest")');
    await expect(questCard).toBeVisible();

    // GM should see pickup button AND management options
    await expect(questCard.locator('button:has-text("Pick Up Quest")')).toBeVisible();
    await expect(questCard.locator('select[data-testid="assign-quest-dropdown"]')).toBeVisible();
    await expect(questCard.locator('button:has-text("Cancel Quest")')).toBeVisible();

    await page.screenshot({ path: 'test-quest-pickup-permissions-verification.png' });
    console.log('✅ [Verification] Quest pickup permissions test completed successfully');
  });
});