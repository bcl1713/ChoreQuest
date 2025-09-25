import { test, expect } from '@playwright/test';
import { setupUserWithCharacter, commonBeforeEach } from './helpers/setup-helpers';

test.describe('Quest Pickup and Management', () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test('Guild Master can pick up available quests', async ({ page }) => {
    await setupUserWithCharacter(page, 'PickupGM');

    // Create unassigned quest
    await page.click('button:text("⚡ Create Quest")');
    await expect(page.locator("text=Create New Quest")).toBeVisible();
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    await page.fill('input[placeholder="Enter quest title..."]', 'Clean the Kitchen');
    await page.fill('textarea[placeholder="Describe the quest..."]', 'Deep clean kitchen counters and dishes');
    await page.locator("select").nth(1).selectOption("MEDIUM");
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', "25");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "50");

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify quest appears in Available Quests
    await expect(page.getByText('📋 Available Quests')).toBeVisible();
    await expect(page.getByText('Clean the Kitchen')).toBeVisible();

    // Pick up the quest
    const questCard = page.locator('.fantasy-card:has-text("Clean the Kitchen")');
    const pickupButton = questCard.locator('button:has-text("Pick Up Quest")');
    await expect(pickupButton).toBeVisible();
    await pickupButton.click();
    await page.waitForTimeout(2000);

    // Verify quest moved to My Quests
    await expect(page.getByText('🗡️ My Quests')).toBeVisible();
    const myQuestsSection = page.locator('text=🗡️ My Quests').locator('..');
    await expect(myQuestsSection.getByText('Clean the Kitchen')).toBeVisible();
  });

  test('quest permissions and state management', async ({ page }) => {
    await setupUserWithCharacter(page, 'PermissionTester');

    // Create and pick up a quest
    await page.click('button:text("⚡ Create Quest")');
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    await page.fill('input[placeholder="Enter quest title..."]', 'Test Permission Quest');
    await page.fill('textarea[placeholder="Describe the quest..."]', 'Testing quest permissions');
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "30");

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Pick up quest
    await page.locator('button:has-text("Pick Up Quest")').first().click();
    await page.waitForTimeout(2000);

    // Start the quest
    await page.locator('button:has-text("Start Quest")').first().click();
    await page.waitForTimeout(1000);

    // Complete the quest
    await page.locator('button:has-text("Complete")').first().click();
    await page.waitForTimeout(1000);

    // Verify quest shows as completed
    await expect(page.getByText('COMPLETED')).toBeVisible();

    // Approve as Guild Master
    await page.locator('button:has-text("Approve")').first().click();
    await page.waitForTimeout(2000);

    // Verify quest shows as approved
    await expect(page.getByText('APPROVED')).toBeVisible();
  });

  test('quest workflow state transitions', async ({ page }) => {
    await setupUserWithCharacter(page, 'WorkflowTester');

    // Create quest
    await page.click('button:text("⚡ Create Quest")');
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    await page.fill('input[placeholder="Enter quest title..."]', 'Workflow Test Quest');
    await page.fill('textarea[placeholder="Describe the quest..."]', 'Testing quest state transitions');
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "40");

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Quest starts in PENDING state
    const questCard = page.locator('.fantasy-card:has-text("Workflow Test Quest")');
    await expect(questCard.getByText('PENDING')).toBeVisible();

    // Pick up quest -> should become ASSIGNED
    await questCard.locator('button:has-text("Pick Up Quest")').click();
    await page.waitForTimeout(1000);

    // Start quest -> should become IN_PROGRESS
    await page.locator('button:has-text("Start Quest")').first().click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('IN_PROGRESS')).toBeVisible();

    // Complete quest -> should become COMPLETED
    await page.locator('button:has-text("Complete")').first().click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('COMPLETED')).toBeVisible();

    // Approve quest -> should become APPROVED
    await page.locator('button:has-text("Approve")').first().click();
    await page.waitForTimeout(2000);
    await expect(page.getByText('APPROVED')).toBeVisible();
  });
});