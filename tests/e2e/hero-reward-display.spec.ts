import { test, expect } from "@playwright/test";
import { commonBeforeEach } from './helpers/setup-helpers';

test.describe("Hero Reward Display After GM Approval", () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test("Hero receives XP and gold rewards when GM approves quest (separate users)", async ({ browser }) => {
    // This test specifically tests the RLS issue where GM approves Hero's quest
    // and Hero should see updated stats, but RLS policy blocks the character update

    // Create two separate browser contexts for GM and Hero
    const gmContext = await browser.newContext();
    const heroContext = await browser.newContext();

    const gmPage = await gmContext.newPage();
    const heroPage = await heroContext.newPage();

    // Setup Guild Master (creates family)
    await commonBeforeEach(gmPage);
    const timestamp = Date.now();
    await gmPage.goto('/auth/create-family');
    await gmPage.fill('input[placeholder="The Brave Knights"]', `Test Family ${timestamp}`);
    await gmPage.fill('input[placeholder="Sir Galahad"]', `Guild Master ${timestamp}`);
    await gmPage.fill('input[placeholder="hero@example.com"]', `gm-${timestamp}@example.com`);
    await gmPage.fill('input[placeholder="••••••••"]', 'password123');
    await gmPage.click('button[type="submit"]');

    // Wait for navigation after family creation
    await gmPage.waitForURL(/.*\/(dashboard|character\/create)/, { timeout: 30000 });
    await gmPage.waitForTimeout(2000);

    // Handle character creation if redirected there
    if (gmPage.url().includes('/character/create')) {
      await gmPage.waitForTimeout(1000);
      await gmPage.fill('input#characterName', 'Guild Master GM');
      await gmPage.waitForTimeout(500);
      await gmPage.click('[data-testid="class-knight"]');
      await gmPage.waitForTimeout(500);
      const submitButton = gmPage.locator('button:text("Begin Your Quest")');
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      await submitButton.click();
      await gmPage.waitForURL(/.*\/dashboard/, { timeout: 20000 });
    }

    // Wait for dashboard to load
    await expect(gmPage.getByText('Quest Dashboard')).toBeVisible({ timeout: 10000 });

    // Extract family code from dashboard
    const familyCodeElement = await gmPage.locator('text=/Guild:.*\\([A-Z0-9]{6}\\)/')
      .or(gmPage.locator('text=/\\([A-Z0-9]{6}\\)/'))
      .first();
    const familyCodeText = await familyCodeElement.textContent();
    const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
    const code = codeMatch?.[1] || '';

    expect(code).toBeTruthy();

    // Setup Hero (joins existing family)
    await commonBeforeEach(heroPage);
    await heroPage.goto('/auth/register');
    await heroPage.fill('input[placeholder="Sir Galahad"]', `Hero Player ${timestamp}`);
    await heroPage.fill('input[placeholder="hero@example.com"]', `hero-${timestamp}@example.com`);
    await heroPage.fill('input[placeholder="••••••••"]', 'password123');
    await heroPage.fill('input[placeholder="BraveKnights123"]', code);
    await heroPage.click('button[type="submit"]');

    // Complete character creation - wait for navigation to character/create
    await heroPage.waitForURL(/.*\/character\/create/, { timeout: 15000 });
    await heroPage.fill('input#characterName', 'Hero Player');
    await heroPage.click('[data-testid="class-mage"]'); // Different class for bonus testing
    await heroPage.waitForTimeout(500); // Small delay to ensure state is ready
    await heroPage.click('button:text("Begin Your Quest")');

    // Wait for redirect to dashboard
    await heroPage.waitForURL(/.*\/dashboard/, { timeout: 15000 });

    // Verify Hero starts with 0 stats
    await expect(heroPage.locator('[data-testid="character-gold"]')).toHaveText('💰 0');
    await expect(heroPage.locator('[data-testid="character-xp"]')).toHaveText('⚡ 0');
    await expect(heroPage.locator('[data-testid="character-level"]')).toContainText('Level 1');

    // GM creates a quest
    await gmPage.goto('/dashboard');
    await gmPage.click('[data-testid="create-quest-button"]');
    await gmPage.locator('button:has-text("Custom Quest")').click();

    await gmPage.fill('input[placeholder="Enter quest title..."]', `Hero Test Quest ${timestamp}`);
    await gmPage.fill('textarea[placeholder="Describe the quest..."]', "A quest for the hero to complete");
    await gmPage.selectOption('[data-testid="quest-difficulty-select"]', "MEDIUM"); // 1.5x multiplier
    await gmPage.fill('input[type="number"]:near(:text("Gold Reward"))', "100");
    await gmPage.fill('input[type="number"]:near(:text("XP Reward"))', "200");
    await gmPage.click('button[type="submit"]');
    await gmPage.waitForTimeout(2000);

    // Hero picks up and completes the quest
    await heroPage.reload(); // Refresh to see new quest
    await heroPage.waitForTimeout(1000);

    await heroPage.locator('[data-testid="pick-up-quest-button"]').first().click();
    await heroPage.waitForTimeout(1000);

    await heroPage.locator('[data-testid="start-quest-button"]').first().click();
    await heroPage.waitForTimeout(1000);

    await heroPage.locator('[data-testid="complete-quest-button"]').first().click();
    await heroPage.waitForTimeout(2000);

    // GM approves the quest
    await gmPage.reload(); // Refresh to see quest status changes
    await gmPage.waitForTimeout(1000);

    await expect(gmPage.locator('[data-testid="approve-quest-button"]').first()).toBeVisible();
    await gmPage.locator('[data-testid="approve-quest-button"]').first().click();
    await gmPage.waitForTimeout(3000);

    // **CRITICAL TEST**: Hero should see updated rewards after GM approval
    // Expected rewards:
    // - Gold: 100 * 1.5 (MEDIUM) = 150
    // - XP: 200 * 1.5 (MEDIUM) * 1.2 (MAGE class bonus) = 360

    // First test with manual refresh (should work if database update succeeded)
    await heroPage.reload();
    await heroPage.waitForTimeout(2000);

    // These assertions should FAIL initially due to RLS policy blocking character updates
    await expect(heroPage.locator('[data-testid="character-gold"]')).toHaveText('💰 150', { timeout: 5000 });
    await expect(heroPage.locator('[data-testid="character-xp"]')).toHaveText('⚡ 360', { timeout: 5000 });

    // Test automatic realtime updates (without manual refresh)
    // This will be implemented after fixing the character context realtime subscription

    await gmContext.close();
    await heroContext.close();
  });

  test("multiple Heroes receive correct individual rewards", async ({ browser }) => {
    // Test that each Hero gets their own rewards and can see them updated
    // This ensures the fix works for multiple family members
    test.setTimeout(90000); // Increase timeout for complex multi-user test

    const gmContext = await browser.newContext();
    const hero1Context = await browser.newContext();
    const hero2Context = await browser.newContext();

    const gmPage = await gmContext.newPage();
    const hero1Page = await hero1Context.newPage();
    const hero2Page = await hero2Context.newPage();

    // Create GM and family
    await commonBeforeEach(gmPage);
    const timestamp = Date.now();
    await gmPage.goto('/auth/create-family');
    await gmPage.fill('input[placeholder="The Brave Knights"]', `Multi Hero Family ${timestamp}`);
    await gmPage.fill('input[placeholder="Sir Galahad"]', `Multi GM ${timestamp}`);
    await gmPage.fill('input[placeholder="hero@example.com"]', `gm2-${timestamp}@example.com`);
    await gmPage.fill('input[placeholder="••••••••"]', 'password123');
    await gmPage.click('button[type="submit"]');

    // Wait for navigation after family creation
    await gmPage.waitForURL(/.*\/(dashboard|character\/create)/, { timeout: 30000 });
    await gmPage.waitForTimeout(2000);

    // Handle character creation if redirected there
    if (gmPage.url().includes('/character/create')) {
      await gmPage.waitForTimeout(1000);
      await gmPage.fill('input#characterName', 'Multi GM');
      await gmPage.waitForTimeout(500);
      await gmPage.click('[data-testid="class-knight"]');
      await gmPage.waitForTimeout(500);
      const submitButton = gmPage.locator('button:text("Begin Your Quest")');
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      await submitButton.click();
      await gmPage.waitForURL(/.*\/dashboard/, { timeout: 20000 });
    }

    // Wait for dashboard to load
    await expect(gmPage.getByText('Quest Dashboard')).toBeVisible({ timeout: 10000 });

    // Extract family code from dashboard
    const familyCodeElement = await gmPage.locator('text=/Guild:.*\\([A-Z0-9]{6}\\)/')
      .or(gmPage.locator('text=/\\([A-Z0-9]{6}\\)/'))
      .first();
    const familyCodeText = await familyCodeElement.textContent();
    const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
    const code = codeMatch?.[1] || '';

    expect(code).toBeTruthy();

    // Setup Hero 1 (RANGER class)
    await commonBeforeEach(hero1Page);
    await hero1Page.goto('/auth/register');
    await hero1Page.fill('input[placeholder="Sir Galahad"]', `Hero One ${timestamp}`);
    await hero1Page.fill('input[placeholder="hero@example.com"]', `hero1-${timestamp}@example.com`);
    await hero1Page.fill('input[placeholder="••••••••"]', 'password123');
    await hero1Page.fill('input[placeholder="BraveKnights123"]', code);
    await hero1Page.click('button[type="submit"]');

    // Complete character creation
    await hero1Page.waitForURL(/.*\/character\/create/, { timeout: 15000 });
    await hero1Page.fill('input#characterName', 'Hero One');
    await hero1Page.click('[data-testid="class-ranger"]');
    await hero1Page.waitForTimeout(500);
    await hero1Page.click('button:text("Begin Your Quest")');
    await hero1Page.waitForURL(/.*\/dashboard/, { timeout: 15000 });

    // Setup Hero 2 (HEALER class)
    await commonBeforeEach(hero2Page);
    await hero2Page.goto('/auth/register');
    await hero2Page.fill('input[placeholder="Sir Galahad"]', `Hero Two ${timestamp}`);
    await hero2Page.fill('input[placeholder="hero@example.com"]', `hero2-${timestamp}@example.com`);
    await hero2Page.fill('input[placeholder="••••••••"]', 'password123');
    await hero2Page.fill('input[placeholder="BraveKnights123"]', code);
    await hero2Page.click('button[type="submit"]');

    // Complete character creation
    await hero2Page.waitForURL(/.*\/character\/create/, { timeout: 15000 });
    await hero2Page.fill('input#characterName', 'Hero Two');
    await hero2Page.click('[data-testid="class-healer"]');
    await hero2Page.waitForTimeout(500);
    await hero2Page.click('button:text("Begin Your Quest")');
    await hero2Page.waitForURL(/.*\/dashboard/, { timeout: 15000 });

    // GM creates two different quests
    // Quest 1 for Hero 1 - EASY difficulty
    await gmPage.goto('/dashboard');
    await gmPage.click('[data-testid="create-quest-button"]');
    await gmPage.locator('button:has-text("Custom Quest")').click();
    await gmPage.fill('input[placeholder="Enter quest title..."]', `Hero1 Quest ${timestamp}`);
    await gmPage.fill('textarea[placeholder="Describe the quest..."]', "Quest for hero 1");
    await gmPage.selectOption('[data-testid="quest-difficulty-select"]', "EASY");
    await gmPage.fill('input[type="number"]:near(:text("Gold Reward"))', "50");
    await gmPage.fill('input[type="number"]:near(:text("XP Reward"))', "100");
    await gmPage.click('button[type="submit"]');
    await gmPage.waitForTimeout(1000);

    // Quest 2 for Hero 2 - HARD difficulty
    await gmPage.click('[data-testid="create-quest-button"]');
    await gmPage.locator('button:has-text("Custom Quest")').click();
    await gmPage.fill('input[placeholder="Enter quest title..."]', `Hero2 Quest ${timestamp}`);
    await gmPage.fill('textarea[placeholder="Describe the quest..."]', "Quest for hero 2");
    await gmPage.selectOption('[data-testid="quest-difficulty-select"]', "HARD");
    await gmPage.fill('input[type="number"]:near(:text("Gold Reward"))', "80");
    await gmPage.fill('input[type="number"]:near(:text("XP Reward"))', "150");
    await gmPage.click('button[type="submit"]');
    await gmPage.waitForTimeout(2000);

    // Both heroes complete their respective quests
    // Hero 1 completes first quest (picks up the first available quest)
    await hero1Page.reload();
    await hero1Page.waitForTimeout(1000);
    await hero1Page.locator('[data-testid="pick-up-quest-button"]').first().click();
    await hero1Page.waitForTimeout(1000);
    await hero1Page.locator('[data-testid="start-quest-button"]').first().click();
    await hero1Page.waitForTimeout(1000);
    await hero1Page.locator('[data-testid="complete-quest-button"]').first().click();
    await hero1Page.waitForTimeout(1000);

    // Hero 2 completes second quest (picks up the first available quest)
    await hero2Page.reload();
    await hero2Page.waitForTimeout(1000);
    await hero2Page.locator('[data-testid="pick-up-quest-button"]').first().click();
    await hero2Page.waitForTimeout(1000);
    await hero2Page.locator('[data-testid="start-quest-button"]').first().click();
    await hero2Page.waitForTimeout(1000);
    await hero2Page.locator('[data-testid="complete-quest-button"]').first().click();
    await hero2Page.waitForTimeout(1000);

    // GM approves both quests
    await gmPage.reload();
    await gmPage.waitForTimeout(2000);

    // Wait for approve buttons to be visible
    await expect(gmPage.locator('[data-testid="approve-quest-button"]').first()).toBeVisible({ timeout: 10000 });

    // Approve first quest
    await gmPage.locator('[data-testid="approve-quest-button"]').first().click();
    await gmPage.waitForTimeout(1500);

    // Approve second quest
    await gmPage.locator('[data-testid="approve-quest-button"]').first().click();
    await gmPage.waitForTimeout(2000);

    // Verify each Hero sees their correct individual rewards
    // Note: Heroes pick up the first available quest, so Hero1 gets HARD quest and Hero2 gets EASY quest
    // Hero 1 (RANGER): HARD (2.0x) + RANGER bonus (1.0x for XP, no bonus) = 150 * 2.0 * 1.0 = 300 XP, 80 * 2.0 = 160 gold
    await hero1Page.reload();
    await hero1Page.waitForTimeout(2000);
    await expect(hero1Page.locator('[data-testid="character-gold"]')).toHaveText('💰 160');
    await expect(hero1Page.locator('[data-testid="character-xp"]')).toHaveText('⚡ 300');

    // Hero 2 (HEALER): EASY (1.0x) + HEALER bonus (1.1x for XP) = 100 * 1.0 * 1.1 = 110 XP, 50 * 1.0 = 50 gold
    await hero2Page.reload();
    await hero2Page.waitForTimeout(2000);
    await expect(hero2Page.locator('[data-testid="character-gold"]')).toHaveText('💰 50');
    await expect(hero2Page.locator('[data-testid="character-xp"]')).toHaveText('⚡ 110');

    await gmContext.close();
    await hero1Context.close();
    await hero2Context.close();
  });
});