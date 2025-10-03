import { test, expect } from "@playwright/test";
import {
  setupUserWithCharacter,
  commonBeforeEach,
} from "./helpers/setup-helpers";

test.describe("Quest Pickup and Management", () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test("Guild Master can pick up available quests", async ({ page }) => {
    await setupUserWithCharacter(page, "PickupGM");

    // Create unassigned quest
    await page.click('[data-testid="create-quest-button"]');
    await expect(page.locator("text=Create New Quest")).toBeVisible();
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    await page.fill(
      'input[placeholder="Enter quest title..."]',
      "Clean the Kitchen",
    );
    await page.fill(
      'textarea[placeholder="Describe the quest..."]',
      "Deep clean kitchen counters and dishes",
    );
    await page.locator("select").nth(1).selectOption("MEDIUM");
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', "25");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "50");

    await page.click('button[type="submit"]');

    // Verify quest appears in Available Quests
    await expect(page.getByText("📋 Available Quests")).toBeVisible();
    await expect(page.getByText("Clean the Kitchen").first()).toBeVisible();

    // Pick up the quest
    const questCard = page.locator(
      '.fantasy-card:has-text("Clean the Kitchen")',
    );
    const pickupButton = questCard.locator(
      '[data-testid="pick-up-quest-button"]',
    );
    await expect(pickupButton.first()).toBeVisible();
    await pickupButton.first().click();

    // Verify quest moved to My Quests
    await expect(page.getByText("🗡️ My Quests")).toBeVisible();
    const myQuestsSection = page.locator("text=🗡️ My Quests").locator("..");

    await expect(myQuestsSection.getByText("Clean the Kitchen")).toBeVisible();
  });

  test("quest permissions and state management", async ({ page }) => {
    await setupUserWithCharacter(page, "PermissionTester");

    // Create and pick up a quest
    await page.click('[data-testid="create-quest-button"]');
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    await page.fill(
      'input[placeholder="Enter quest title..."]',
      "Test Permission Quest",
    );
    await page.fill(
      'textarea[placeholder="Describe the quest..."]',
      "Testing quest permissions",
    );
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "30");

    await page.click('button[type="submit"]');

    // Pick up quest
    await page.locator('button:has-text("Pick Up Quest")').first().click();

    // Start the quest
    await page.locator('button:has-text("Start Quest")').first().click();

    // Complete the quest
    await page.locator('button:has-text("Complete")').first().click();

    // Verify quest shows as completed
    await expect(page.getByText("COMPLETED")).toBeVisible();

    // Approve as Guild Master
    await page.locator('button:has-text("Approve")').first().click();

    // Verify quest shows as approved
    await expect(page.getByText("APPROVED")).toBeVisible();
  });

  test("quest workflow state transitions", async ({ page }) => {
    await setupUserWithCharacter(page, "WorkflowTester");
    const timestamp = Date.now();

    // Create quest
    await page.click('[data-testid="create-quest-button"]');
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    const questTitle = `Workflow Test Quest ${timestamp}`;
    await page.fill('input[placeholder="Enter quest title..."]', questTitle);
    await page.fill(
      'textarea[placeholder="Describe the quest..."]',
      "Testing quest state transitions",
    );
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "40");

    await page.click('button[type="submit"]');

    // Verify quest was created and appears somewhere on the page
    await expect(page.getByText(questTitle).first()).toBeVisible();

    // Look for Available Quests section or quest card
    const availableQuestExists = await page
      .locator("text=📋 Available Quests")
      .isVisible()
      .catch(() => false);
    const questCard = page.locator(`.fantasy-card:has-text("${questTitle}")`);

    if (availableQuestExists) {
      // Pick up quest if it's in Available Quests
      await questCard
        .locator('button:has-text("Pick Up Quest")')
        .first()
        .click();
    }

    // Find the quest in My Quests and complete the workflow
    const myQuestsQuest = page
      .locator("text=🗡️ My Quests")
      .locator("..")
      .getByText(questTitle);
    await expect(myQuestsQuest).toBeVisible();

    // Complete quest workflow
    await page.locator('button:has-text("Start Quest")').first().click();

    await page.locator('button:has-text("Complete")').first().click();

    await expect(page.getByText("COMPLETED")).toBeVisible();

    await page.locator('button:has-text("Approve")').first().click();

    await expect(page.getByText("APPROVED")).toBeVisible();
  });
});

