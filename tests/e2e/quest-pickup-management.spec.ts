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

  test('Hero can pick up available quests', async ({ page }) => {
    console.log('✅ [Setup] Starting hero quest pickup test');
    const gmEmail = `gm-pickup-${Date.now()}@example.com`;
    const heroEmail = `hero-pickup-${Date.now()}@example.com`;
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
    await page.getByText('⚡ Create Quest').click();
    await page.waitForTimeout(1000);
    await page.getByText('Custom Quest').click();
    await page.fill('input[name="title"]', 'Clean the Kitchen');
    await page.fill('textarea[name="description"]', 'Deep clean kitchen counters and dishes');
    await page.selectOption('select[name="difficulty"]', 'MEDIUM');
    await page.fill('input[name="xpReward"]', '50');
    await page.fill('input[name="goldReward"]', '25');
    // Don't assign to anyone - leave unassigned
    await page.getByText('Create Quest').click();
    await page.waitForTimeout(2000);

    // Logout GM
    console.log('✅ [Action] Logging out GM');
    await page.getByText('Logout').click();
    await page.waitForURL(/.*\/auth\/login/, { timeout: 10000 });

    // Create hero character and join family
    console.log('✅ [Action] Creating hero character');
    await page.getByText('⚔️ Join Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/join-family/);

    await page.fill('input[name="familyName"]', 'Pickup Test Family');
    await page.fill('input[name="email"]', heroEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Hero Player');
    await page.click('button[type="submit"]');

    // Complete hero character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir Pickup');
    await page.click('[data-testid="class-ranger"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Verify Available Quests section is visible
    console.log('✅ [Verification] Checking Available Quests section');
    await expect(page.getByText('📋 Available Quests')).toBeVisible();
    await expect(page.getByText('Clean the Kitchen')).toBeVisible();

    // THIS IS THE FAILING TEST: Hero should be able to pick up the quest
    console.log('✅ [Action] Attempting to pick up available quest');
    const questCard = page.locator('.fantasy-card:has-text("Clean the Kitchen")');
    await expect(questCard).toBeVisible();

    // Look for Pick Up Quest button - THIS WILL FAIL because it doesn't exist yet
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

    await page.screenshot({ path: 'test-quest-pickup-hero-verification.png' });
    console.log('✅ [Verification] Hero quest pickup test completed successfully');
  });

  test('Guild Master can assign and cancel available quests', async ({ page }) => {
    console.log('✅ [Setup] Starting GM quest management test');
    const gmEmail = `gm-manage-${Date.now()}@example.com`;
    const heroEmail = `hero-manage-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    // Create GM and family
    await page.goto('/');
    await page.screenshot({ path: 'test-quest-management-gm-setup.png' });
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Management Test Family');
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

    // Create a hero in the family first
    console.log('✅ [Action] Creating hero character in family');
    await page.getByText('Logout').click();
    await page.waitForURL(/.*\/auth\/login/, { timeout: 10000 });

    await page.getByText('⚔️ Join Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/join-family/);

    await page.fill('input[name="familyName"]', 'Management Test Family');
    await page.fill('input[name="email"]', heroEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Hero Player');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir Target');
    await page.click('[data-testid="class-mage"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Logout hero and log back in as GM
    await page.getByText('Logout').click();
    await page.waitForURL(/.*\/auth\/login/, { timeout: 10000 });
    await page.fill('input[name="email"]', gmEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Create an unassigned quest
    console.log('✅ [Action] Creating unassigned quest for management');
    await page.getByText('⚡ Create Quest').click();
    await page.waitForTimeout(1000);
    await page.getByText('Custom Quest').click();
    await page.fill('input[name="title"]', 'Organize Garage');
    await page.fill('textarea[name="description"]', 'Sort and organize garage storage');
    await page.selectOption('select[name="difficulty"]', 'HARD');
    await page.fill('input[name="xpReward"]', '75');
    await page.fill('input[name="goldReward"]', '35');
    // Leave unassigned
    await page.getByText('Create Quest').click();
    await page.waitForTimeout(2000);

    // Verify Available Quests section shows the quest
    console.log('✅ [Verification] Checking Available Quests section as GM');
    await expect(page.getByText('📋 Available Quests')).toBeVisible();
    await expect(page.getByText('Organize Garage')).toBeVisible();

    // THIS IS THE FAILING TEST: GM should see management buttons
    console.log('✅ [Action] Testing GM quest management controls');
    const questCard = page.locator('.fantasy-card:has-text("Organize Garage")');
    await expect(questCard).toBeVisible();

    // Look for Assign To dropdown - THIS WILL FAIL because it doesn't exist yet
    const assignDropdown = questCard.locator('select[data-testid="assign-quest-dropdown"]');
    await expect(assignDropdown).toBeVisible();

    // Look for Cancel Quest button - THIS WILL FAIL because it doesn't exist yet
    const cancelButton = questCard.locator('button:has-text("Cancel Quest")');
    await expect(cancelButton).toBeVisible();

    // Test assignment functionality
    console.log('✅ [Action] Testing quest assignment');
    await assignDropdown.selectOption('Sir Target');
    const assignButton = questCard.locator('button:has-text("Assign")');
    await expect(assignButton).toBeVisible();
    await assignButton.click();
    await page.waitForTimeout(2000);

    // Verify quest moved to Family Quests section
    console.log('✅ [Verification] Verifying quest assignment success');
    await expect(page.getByText('👥 Family Quests')).toBeVisible();
    const familyQuestsSection = page.locator('section:has-text("👥 Family Quests")');
    await expect(familyQuestsSection.locator('text=Organize Garage')).toBeVisible();

    // Verify quest is no longer in Available Quests
    const availableQuestsSection = page.locator('section:has-text("📋 Available Quests")');
    await expect(availableQuestsSection.locator('text=Organize Garage')).not.toBeVisible();

    // Create another quest to test cancellation
    console.log('✅ [Action] Creating quest for cancellation test');
    await page.getByText('⚡ Create Quest').click();
    await page.waitForTimeout(1000);
    await page.getByText('Custom Quest').click();
    await page.fill('input[name="title"]', 'Test Cancellation');
    await page.fill('textarea[name="description"]', 'This quest will be cancelled');
    await page.selectOption('select[name="difficulty"]', 'EASY');
    await page.fill('input[name="xpReward"]', '25');
    await page.fill('input[name="goldReward"]', '10');
    await page.getByText('Create Quest').click();
    await page.waitForTimeout(2000);

    // Test cancellation functionality
    console.log('✅ [Action] Testing quest cancellation');
    const cancelQuestCard = page.locator('.fantasy-card:has-text("Test Cancellation")');
    await expect(cancelQuestCard).toBeVisible();

    const cancelQuestButton = cancelQuestCard.locator('button:has-text("Cancel Quest")');
    await cancelQuestButton.click();

    // Confirm cancellation in dialog/modal
    await page.getByText('Confirm').click(); // Assuming confirmation dialog
    await page.waitForTimeout(2000);

    // Verify quest is completely removed
    console.log('✅ [Verification] Verifying quest cancellation success');
    await expect(page.locator('text=Test Cancellation')).not.toBeVisible();

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
    await page.getByText('⚡ Create Quest').click();
    await page.waitForTimeout(1000);
    await page.getByText('Custom Quest').click();
    await page.fill('input[name="title"]', 'Permission Test Quest');
    await page.fill('textarea[name="description"]', 'Test role-based permissions');
    await page.selectOption('select[name="difficulty"]', 'MEDIUM');
    await page.fill('input[name="xpReward"]', '40');
    await page.fill('input[name="goldReward"]', '20');
    await page.getByText('Create Quest').click();
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