import { test, expect, Page } from "@playwright/test";
import { setupUserWithCharacter, commonBeforeEach } from './helpers/setup-helpers';

test.describe("Quest Completion Rewards", () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test("quest creation with rewards", async ({ page }) => {
    await setupUserWithCharacter(page, 'RewardTester');

    // Verify initial character stats are zero
    await expect(page.getByText("💰 0")).toBeVisible();
    await expect(page.getByText("⚡ 0")).toBeVisible();
    await expect(page.getByText("💎 0")).toBeVisible();
    await expect(page.getByText("🏅 0")).toBeVisible();

    // Create quest with rewards
    await page.click('[data-testid="create-quest-button"]');
    await expect(page.locator("text=Create New Quest")).toBeVisible();
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    await page.fill('input[placeholder="Enter quest title..."]', "Clean Room Quest");
    await page.fill('textarea[placeholder="Describe the quest..."]', "Clean your room thoroughly");
    await page.locator("select").nth(1).selectOption("MEDIUM");
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', "50");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "100");

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify quest appears
    await expect(page.getByText("Clean Room Quest").first()).toBeVisible();
  });

  test("different difficulty multipliers", async ({ page }) => {
    await setupUserWithCharacter(page, 'DifficultyTester');
    const timestamp = Date.now();

    // Test EASY quest (base XP with knight bonus: 100 * 1.05 = 105)
    await createAndCompleteQuest(page, `Easy Task ${timestamp}`, "EASY", 100);
    await expect(page.getByText("⚡ 105")).toBeVisible();

    // Test MEDIUM quest (1.5x multiplier: 100 * 1.5 * 1.05 = 157.5 = 157)
    await createAndCompleteQuest(page, `Medium Task ${timestamp}`, "MEDIUM", 100);
    await expect(page.getByText("⚡ 262")).toBeVisible(); // 105 + 157

    // Test HARD quest (2x multiplier: 100 * 2.0 * 1.05 = 210)
    await createAndCompleteQuest(page, `Hard Task ${timestamp}`, "HARD", 100);
    await expect(page.getByText("⚡ 472")).toBeVisible({ timeout: 10000 }); // 262 + 210
  });

  test("character levels up with sufficient XP", async ({ page }) => {
    await setupUserWithCharacter(page, 'LevelUpTester');

    await expect(page.getByText("Level 1")).toBeVisible();

    // Create high XP quest to trigger level up
    const timestamp = Date.now();
    await createAndCompleteQuest(page, `Epic Level Up Quest ${timestamp}`, "HARD", 500);

    // 500 * 2.0 * 1.05 = 1050 XP should reach level 5
    await expect(page.getByText("⚡ 1050")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Level 5")).toBeVisible({ timeout: 10000 });
  });

  test("class-specific bonuses apply", async ({ page }) => {
    // MAGE has XP bonus
    await setupUserWithCharacter(page, 'ClassTester', { characterClass: 'MAGE' });

    const timestamp = Date.now();
    await createAndCompleteQuest(page, `Class Bonus Quest ${timestamp}`, "EASY", 100);

    // MAGE should get 100 * 1.0 (EASY) * 1.2 (MAGE bonus) = 120 XP
    await expect(page.getByText("⚡ 120")).toBeVisible({ timeout: 10000 });
  });

  test("multi-reward quest updates all stats", async ({ page }) => {
    await setupUserWithCharacter(page, 'MultiReward');

    // Create quest with both gold and XP rewards
    await page.click('[data-testid="create-quest-button"]');
    await page.locator('.fixed button:has-text("Custom Quest")').click();

    const timestamp = Date.now();
    await page.fill('input[placeholder="Enter quest title..."]', `Multi-Reward Quest ${timestamp}`);
    await page.fill('textarea[placeholder="Describe the quest..."]', "Quest with multiple rewards");
    await page.locator("select").nth(1).selectOption("MEDIUM");
    await page.fill('input[type="number"]:near(:text("Gold Reward"))', "75");
    await page.fill('input[type="number"]:near(:text("XP Reward"))', "150");

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Complete the quest
    await page.locator('[data-testid="pick-up-quest-button"]').first().click();
    await page.waitForTimeout(1000);

    // Quest should now be PENDING and show Start Quest button
    await expect(page.locator('[data-testid="start-quest-button"]').first()).toBeVisible();
    await page.locator('[data-testid="start-quest-button"]').first().click();
    await page.waitForTimeout(1000);

    // After starting, quest should be IN_PROGRESS and show Complete button
    await expect(page.locator('[data-testid="complete-quest-button"]').first()).toBeVisible();
    await page.locator('[data-testid="complete-quest-button"]').first().click();
    await page.waitForTimeout(1000);

    // Quest should now be COMPLETED and show Approve button
    await expect(page.locator('[data-testid="approve-quest-button"]').first()).toBeVisible();
    await page.locator('[data-testid="approve-quest-button"]').first().click();
    await page.waitForTimeout(3000);

    // Gold: 75 * 1.5 * 1.05 = 118, XP: 150 * 1.5 * 1.05 = 236
    await expect(page.getByText("💰 118")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("⚡ 236")).toBeVisible({ timeout: 10000 });
  });
});

async function createAndCompleteQuest(page: Page, title: string, difficulty: string, xp: number) {
  await page.click('[data-testid="create-quest-button"]');
  await page.locator('.fixed button:has-text("Custom Quest")').click();
  await page.waitForTimeout(500);

  await page.fill('input[placeholder="Enter quest title..."]', title);
  await page.fill('textarea[placeholder="Describe the quest..."]', `${difficulty} difficulty task`);
  await page.locator("select").nth(1).selectOption(difficulty);
  await page.fill('input[type="number"]:near(:text("XP Reward"))', xp.toString());

  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Wait for quest to appear, then complete workflow
  await expect(page.getByText(title).first()).toBeVisible();

  // Always try to pick up quest first (quests are created as unassigned)
  await page.locator('[data-testid="pick-up-quest-button"]').first().click();
  await page.waitForTimeout(1000);

  // Quest should now be PENDING and show Start Quest button
  await expect(page.locator('[data-testid="start-quest-button"]').first()).toBeVisible();
  await page.locator('[data-testid="start-quest-button"]').first().click();
  await page.waitForTimeout(1000);

  // After starting, quest should be IN_PROGRESS and show Complete button
  await expect(page.locator('[data-testid="complete-quest-button"]').first()).toBeVisible();

  // Complete quest workflow with shorter waits
  await page.locator('[data-testid="complete-quest-button"]').first().click();
  await page.waitForTimeout(1000);

  // Workaround for realtime issues - refresh to see COMPLETED status
  await page.reload();
  await page.waitForTimeout(1000);

  await page.locator('[data-testid="approve-quest-button"]').first().click();
  await page.waitForTimeout(1000);
}