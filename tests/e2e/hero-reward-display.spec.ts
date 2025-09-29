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
    await gmPage.goto('/auth/create-family');
    await gmPage.fill('input[name="email"]', 'gm@example.com');
    await gmPage.fill('input[name="password"]', 'password123');
    await gmPage.fill('input[name="familyName"]', 'Test Family');
    await gmPage.click('button[type="submit"]');

    // Wait for family creation and get family code
    await expect(gmPage.locator('[data-testid="welcome-message"]')).toBeVisible();
    const familyCodeElement = await gmPage.locator('text=/Guild:.*\\((.*)\\)/')
    const familyCode = await familyCodeElement.textContent();
    const code = familyCode?.match(/\(([^)]+)\)/)?.[1] || '';

    expect(code).toBeTruthy();

    // Create GM character
    await gmPage.goto('/character/create');
    await gmPage.fill('input[name="characterName"]', 'Guild Master GM');
    await gmPage.click('button[data-class="KNIGHT"]');
    await gmPage.click('button[type="submit"]');
    await gmPage.waitForLoadState('networkidle');

    // Setup Hero (joins existing family)
    await commonBeforeEach(heroPage);
    await heroPage.goto('/auth/login');
    await heroPage.click('text="Join Family"');
    await heroPage.fill('input[name="email"]', 'hero@example.com');
    await heroPage.fill('input[name="password"]', 'password123');
    await heroPage.fill('input[name="familyCode"]', code);
    await heroPage.click('button[type="submit"]');

    // Create Hero character
    await heroPage.goto('/character/create');
    await heroPage.fill('input[name="characterName"]', 'Hero Player');
    await heroPage.click('button[data-class="MAGE"]'); // Different class for bonus testing
    await heroPage.click('button[type="submit"]');
    await heroPage.waitForLoadState('networkidle');

    // Verify Hero starts with 0 stats
    await expect(heroPage.locator('[data-testid="character-gold"]')).toHaveText('💰 0');
    await expect(heroPage.locator('[data-testid="character-xp"]')).toHaveText('⚡ 0');
    await expect(heroPage.locator('[data-testid="character-level"]')).toContainText('Level 1');

    // GM creates a quest
    await gmPage.goto('/dashboard');
    await gmPage.click('[data-testid="create-quest-button"]');
    await gmPage.locator('button:has-text("Custom Quest")').click();

    const timestamp = Date.now();
    await gmPage.fill('input[placeholder="Enter quest title..."]', `Hero Test Quest ${timestamp}`);
    await gmPage.fill('textarea[placeholder="Describe the quest..."]', "A quest for the hero to complete");
    await gmPage.locator("select").nth(1).selectOption("MEDIUM"); // 1.5x multiplier
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

    const gmContext = await browser.newContext();
    const hero1Context = await browser.newContext();
    const hero2Context = await browser.newContext();

    const gmPage = await gmContext.newPage();
    const hero1Page = await hero1Context.newPage();
    const hero2Page = await hero2Context.newPage();

    // Create GM and family (abbreviated setup)
    await commonBeforeEach(gmPage);
    await gmPage.goto('/auth/create-family');
    await gmPage.fill('input[name="email"]', 'gm2@example.com');
    await gmPage.fill('input[name="password"]', 'password123');
    await gmPage.fill('input[name="familyName"]', 'Multi Hero Family');
    await gmPage.click('button[type="submit"]');

    const familyCodeElement = await gmPage.locator('text=/Guild:.*\\((.*)\\)/')
    const familyCode = await familyCodeElement.textContent();
    const code = familyCode?.match(/\(([^)]+)\)/)?.[1] || '';

    // Setup GM character
    await gmPage.goto('/character/create');
    await gmPage.fill('input[name="characterName"]', 'Multi GM');
    await gmPage.click('button[data-class="KNIGHT"]');
    await gmPage.click('button[type="submit"]');

    // Setup Hero 1 (RANGER class)
    await commonBeforeEach(hero1Page);
    await hero1Page.goto('/auth/login');
    await hero1Page.click('text="Join Family"');
    await hero1Page.fill('input[name="email"]', 'hero1@example.com');
    await hero1Page.fill('input[name="password"]', 'password123');
    await hero1Page.fill('input[name="familyCode"]', code);
    await hero1Page.click('button[type="submit"]');

    await hero1Page.goto('/character/create');
    await hero1Page.fill('input[name="characterName"]', 'Hero One');
    await hero1Page.click('button[data-class="RANGER"]');
    await hero1Page.click('button[type="submit"]');

    // Setup Hero 2 (HEALER class)
    await commonBeforeEach(hero2Page);
    await hero2Page.goto('/auth/login');
    await hero2Page.click('text="Join Family"');
    await hero2Page.fill('input[name="email"]', 'hero2@example.com');
    await hero2Page.fill('input[name="password"]', 'password123');
    await hero2Page.fill('input[name="familyCode"]', code);
    await hero2Page.click('button[type="submit"]');

    await hero2Page.goto('/character/create');
    await hero2Page.fill('input[name="characterName"]', 'Hero Two');
    await hero2Page.click('button[data-class="HEALER"]');
    await hero2Page.click('button[type="submit"]');

    // GM creates two different quests
    const timestamp = Date.now();

    // Quest 1 for Hero 1 - EASY difficulty
    await gmPage.goto('/dashboard');
    await gmPage.click('[data-testid="create-quest-button"]');
    await gmPage.locator('button:has-text("Custom Quest")').click();
    await gmPage.fill('input[placeholder="Enter quest title..."]', `Hero1 Quest ${timestamp}`);
    await gmPage.fill('textarea[placeholder="Describe the quest..."]', "Quest for hero 1");
    await gmPage.locator("select").nth(1).selectOption("EASY");
    await gmPage.fill('input[type="number"]:near(:text("Gold Reward"))', "50");
    await gmPage.fill('input[type="number"]:near(:text("XP Reward"))', "100");
    await gmPage.click('button[type="submit"]');
    await gmPage.waitForTimeout(1000);

    // Quest 2 for Hero 2 - HARD difficulty
    await gmPage.click('[data-testid="create-quest-button"]');
    await gmPage.locator('button:has-text("Custom Quest")').click();
    await gmPage.fill('input[placeholder="Enter quest title..."]', `Hero2 Quest ${timestamp}`);
    await gmPage.fill('textarea[placeholder="Describe the quest..."]', "Quest for hero 2");
    await gmPage.locator("select").nth(1).selectOption("HARD");
    await gmPage.fill('input[type="number"]:near(:text("Gold Reward"))', "80");
    await gmPage.fill('input[type="number"]:near(:text("XP Reward"))', "150");
    await gmPage.click('button[type="submit"]');
    await gmPage.waitForTimeout(2000);

    // Both heroes complete their respective quests
    // Hero 1 completes first quest
    await hero1Page.reload();
    await hero1Page.locator(`text="${'Hero1 Quest'}"`)
      .locator('xpath=../following-sibling::*//*[@data-testid="pick-up-quest-button"]').first().click();
    await hero1Page.waitForTimeout(1000);
    await hero1Page.locator('[data-testid="start-quest-button"]').first().click();
    await hero1Page.waitForTimeout(1000);
    await hero1Page.locator('[data-testid="complete-quest-button"]').first().click();
    await hero1Page.waitForTimeout(1000);

    // Hero 2 completes second quest
    await hero2Page.reload();
    await hero2Page.locator(`text="${'Hero2 Quest'}"`)
      .locator('xpath=../following-sibling::*//*[@data-testid="pick-up-quest-button"]').first().click();
    await hero2Page.waitForTimeout(1000);
    await hero2Page.locator('[data-testid="start-quest-button"]').first().click();
    await hero2Page.waitForTimeout(1000);
    await hero2Page.locator('[data-testid="complete-quest-button"]').first().click();
    await hero2Page.waitForTimeout(1000);

    // GM approves both quests
    await gmPage.reload();
    await gmPage.waitForTimeout(1000);

    const approveButtons = await gmPage.locator('[data-testid="approve-quest-button"]').all();
    for (const button of approveButtons) {
      await button.click();
      await gmPage.waitForTimeout(1000);
    }
    await gmPage.waitForTimeout(2000);

    // Verify each Hero sees their correct individual rewards
    // Hero 1: EASY (1.0x) + RANGER class bonus (1.05x) = 100 * 1.0 * 1.05 = 105 XP, 50 * 1.0 = 50 gold
    await hero1Page.reload();
    await hero1Page.waitForTimeout(2000);
    await expect(hero1Page.locator('[data-testid="character-gold"]')).toHaveText('💰 50');
    await expect(hero1Page.locator('[data-testid="character-xp"]')).toHaveText('⚡ 105');

    // Hero 2: HARD (2.0x) + HEALER class bonus (1.15x) = 150 * 2.0 * 1.15 = 345 XP, 80 * 2.0 = 160 gold
    await hero2Page.reload();
    await hero2Page.waitForTimeout(2000);
    await expect(hero2Page.locator('[data-testid="character-gold"]')).toHaveText('💰 160');
    await expect(hero2Page.locator('[data-testid="character-xp"]')).toHaveText('⚡ 345');

    await gmContext.close();
    await hero1Context.close();
    await hero2Context.close();
  });
});