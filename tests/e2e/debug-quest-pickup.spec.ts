import { test, expect } from "@playwright/test";
import { setupUserWithCharacter, commonBeforeEach } from './helpers/setup-helpers';

test.describe("Debug Quest Pickup", () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test("debug quest pickup flow", async ({ page }) => {
    await setupUserWithCharacter(page, 'DebugTester');

    // Create a simple quest
    await page.click('[data-testid="create-quest-button"]');
    await expect(page.locator("text=Create New Quest")).toBeVisible();
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    await page.fill('input[placeholder="Enter quest title..."]', "Debug Quest");
    await page.fill('textarea[placeholder="Describe the quest..."]', "Test quest pickup");
    await page.locator("select").nth(1).selectOption("EASY");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "50");

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify quest appears in Available Quests
    await expect(page.getByText("Debug Quest")).toBeVisible();
    await expect(page.getByText("📋 Available Quests")).toBeVisible();

    // Check console for all messages during pickup
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'log') {
        consoleLogs.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });

    // Try to pick up the quest
    await expect(page.locator('[data-testid="pick-up-quest-button"]').first()).toBeVisible();
    await page.locator('[data-testid="pick-up-quest-button"]').first().click();

    // Wait a bit for the pickup to process
    await page.waitForTimeout(3000);

    // Force refresh the page to see if the data changed in the database
    await page.reload();
    await page.waitForTimeout(2000);

    // Take a screenshot for manual inspection
    await page.screenshot({ path: 'test-results/debug-quest-pickup.png', fullPage: true });

    // Check if quest moved to My Quests section
    const myQuestsSection = page.locator('text=🗡️ My Quests').locator('..').locator('..');
    const hasActiveQuests = await myQuestsSection.locator('text=No active quests').isVisible().catch(() => false);

    console.log('Console errors during pickup:', consoleLogs);
    console.log('Still showing "No active quests":', hasActiveQuests);

    // Check if quest status changed - it should now show "Start Quest" button
    if (!hasActiveQuests) {
      await expect(page.locator('[data-testid="start-quest-button"]').first()).toBeVisible({ timeout: 5000 });
    } else {
      console.log('Quest pickup failed - quest still in available section');
      // Check if the pickup button is still there
      const pickupStillVisible = await page.locator('[data-testid="pick-up-quest-button"]').first().isVisible().catch(() => false);
      console.log('Pickup button still visible:', pickupStillVisible);
    }
  });
});