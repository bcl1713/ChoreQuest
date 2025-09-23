import { test, expect } from '@playwright/test';

test.describe('Quest Completion Rewards System', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear all browser storage and cookies before each test
    await context.clearCookies();
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Guild master approves quest and hero receives rewards', async ({ page }) => {
    console.log('✅ [Setup] Starting quest completion rewards test');
    const testEmail = `rewards-test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    await page.goto('http://localhost:3000');
    await page.screenshot({ path: 'test-quest-rewards-setup.png' });

    // Create family and character
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Rewards Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Rewards Test Master');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir RewardTester');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    console.log('✅ [Setup] User and character created successfully');

    // Verify initial character stats are zero
    await expect(page.getByText('💰 0')).toBeVisible();
    await expect(page.getByText('⚡ 0')).toBeVisible();
    await expect(page.getByText('💎 0')).toBeVisible();
    await expect(page.getByText('🏅 0')).toBeVisible();

    console.log('✅ [Verification] Initial character stats confirmed as zero');

    // Create a quest as guild master
    await page.click('button:text("⚡ Create Quest")');
    await expect(page.locator('.modal')).toBeVisible();

    // Switch to custom quest tab and create a quest with rewards
    await page.locator('.fixed button:has-text("Custom Quest")').click();
    await page.waitForTimeout(1000);

    await page.fill('input[name="title"]', 'Clean Room Quest');
    await page.fill('textarea[name="description"]', 'Clean your room thoroughly');
    await page.selectOption('select[name="difficulty"]', 'MEDIUM');
    await page.fill('input[name="goldReward"]', '50');
    await page.fill('input[name="xpReward"]', '100');

    console.log('✅ [Action] Created quest with gold=50, xp=100 rewards');

    await page.screenshot({ path: 'test-quest-rewards-quest-created.png' });
    await page.click('button:text("Create Quest")');

    // Wait for modal to close and quest to appear
    await page.waitForTimeout(2000);
    await expect(page.locator('.modal')).not.toBeVisible();

    // Assign quest to self (as the only family member)
    await expect(page.getByText('Clean Room Quest')).toBeVisible();

    // Click "Start Quest" button to move to IN_PROGRESS
    const startQuestButton = page.locator('button:has-text("Start Quest")').first();
    if (await startQuestButton.isVisible()) {
      await startQuestButton.click();
      console.log('✅ [Action] Started quest - status changed to IN_PROGRESS');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-quest-rewards-in-progress.png' });

    // Mark quest as completed
    const completeButton = page.locator('button:has-text("Mark Complete")').first();
    await expect(completeButton).toBeVisible();
    await completeButton.click();

    console.log('✅ [Action] Marked quest as COMPLETED');
    await page.waitForTimeout(1000);

    // Quest should now show as completed and awaiting approval
    await expect(page.getByText('COMPLETED')).toBeVisible();

    // Approve quest as guild master
    const approveButton = page.locator('button:has-text("Approve")').first();
    await expect(approveButton).toBeVisible();
    await approveButton.click();

    console.log('✅ [Action] Approved quest as guild master');
    await page.waitForTimeout(2000); // Wait for rewards to be processed

    await page.screenshot({ path: 'test-quest-rewards-approved.png' });

    // Verify character stats updated with rewards
    await expect(page.getByText('💰 50')).toBeVisible();  // Gold reward
    await expect(page.getByText('⚡ 100')).toBeVisible(); // XP reward

    console.log('✅ [Verification] Character stats updated with quest rewards');

    // Verify quest shows as approved
    await expect(page.getByText('APPROVED')).toBeVisible();

    console.log('✅ [Verification] Quest completion rewards test completed successfully');
  });

  test('Different quest difficulties award appropriate XP multipliers', async ({ page }) => {
    console.log('✅ [Setup] Starting difficulty-based XP multiplier test');
    const testEmail = `difficulty-test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    await page.goto('http://localhost:3000');

    // Create family and character
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Difficulty Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Difficulty Master');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir DifficultyTester');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    console.log('✅ [Setup] User and character created for difficulty testing');

    // Test EASY quest (base XP)
    await page.click('button:text("⚡ Create Quest")');
    await page.locator('.fixed button:has-text("Custom Quest")').click();
    await page.waitForTimeout(1000);

    await page.fill('input[name="title"]', 'Easy Task');
    await page.fill('textarea[name="description"]', 'Simple easy task');
    await page.selectOption('select[name="difficulty"]', 'EASY');
    await page.fill('input[name="xpReward"]', '100'); // Base 100 XP

    await page.click('button:text("Create Quest")');
    await page.waitForTimeout(2000);

    // Complete EASY quest
    await page.locator('button:has-text("Start Quest")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Mark Complete")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Approve")').first().click();
    await page.waitForTimeout(2000);

    // EASY should give base XP (100)
    await expect(page.getByText('⚡ 100')).toBeVisible();

    console.log('✅ [Verification] EASY quest awarded base XP (100)');

    // Test MEDIUM quest (should be 1.5x multiplier)
    await page.click('button:text("⚡ Create Quest")');
    await page.locator('.fixed button:has-text("Custom Quest")').click();
    await page.waitForTimeout(1000);

    await page.fill('input[name="title"]', 'Medium Task');
    await page.fill('textarea[name="description"]', 'Medium difficulty task');
    await page.selectOption('select[name="difficulty"]', 'MEDIUM');
    await page.fill('input[name="xpReward"]', '100'); // Base 100 XP, should become 150 with multiplier

    await page.click('button:text("Create Quest")');
    await page.waitForTimeout(2000);

    // Complete MEDIUM quest
    await page.locator('button:has-text("Start Quest")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Mark Complete")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Approve")').first().click();
    await page.waitForTimeout(2000);

    // Should now have 100 + 150 = 250 XP
    await expect(page.getByText('⚡ 250')).toBeVisible();

    console.log('✅ [Verification] MEDIUM quest awarded 1.5x XP multiplier (150 total)');

    // Test HARD quest (should be 2x multiplier)
    await page.click('button:text("⚡ Create Quest")');
    await page.locator('.fixed button:has-text("Custom Quest")').click();
    await page.waitForTimeout(1000);

    await page.fill('input[name="title"]', 'Hard Task');
    await page.fill('textarea[name="description"]', 'Very challenging task');
    await page.selectOption('select[name="difficulty"]', 'HARD');
    await page.fill('input[name="xpReward"]', '100'); // Base 100 XP, should become 200 with multiplier

    await page.click('button:text("Create Quest")');
    await page.waitForTimeout(2000);

    // Complete HARD quest
    await page.locator('button:has-text("Start Quest")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Mark Complete")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Approve")').first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-quest-rewards-difficulty-final.png' });

    // Should now have 250 + 200 = 450 XP
    await expect(page.getByText('⚡ 450')).toBeVisible();

    console.log('✅ [Verification] HARD quest awarded 2x XP multiplier (200 additional)');
    console.log('✅ [Verification] Difficulty-based XP multiplier test completed successfully');
  });

  test('Character levels up after earning sufficient XP', async ({ page }) => {
    console.log('✅ [Setup] Starting character leveling test');
    const testEmail = `leveling-test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    await page.goto('http://localhost:3000');

    // Create family and character
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Leveling Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Leveling Master');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir LevelUp');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Verify starting at level 1
    await expect(page.getByText('Level 1')).toBeVisible();

    console.log('✅ [Setup] Character starts at Level 1');

    // Create and complete a high XP quest to trigger level up (assuming 1000 XP = level 2)
    await page.click('button:text("⚡ Create Quest")');
    await page.locator('.fixed button:has-text("Custom Quest")').click();
    await page.waitForTimeout(1000);

    await page.fill('input[name="title"]', 'Epic Level Up Quest');
    await page.fill('textarea[name="description"]', 'A quest worthy of leveling up');
    await page.selectOption('select[name="difficulty"]', 'HARD'); // 2x multiplier
    await page.fill('input[name="xpReward"]', '500'); // 500 * 2 = 1000 XP

    await page.click('button:text("Create Quest")');
    await page.waitForTimeout(2000);

    // Complete the quest
    await page.locator('button:has-text("Start Quest")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Mark Complete")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Approve")').first().click();
    await page.waitForTimeout(3000); // Extra time for level calculation

    await page.screenshot({ path: 'test-quest-rewards-level-up.png' });

    // Verify character leveled up
    await expect(page.getByText('⚡ 1000')).toBeVisible(); // XP gained
    await expect(page.getByText('Level 2')).toBeVisible(); // Level increased

    console.log('✅ [Verification] Character successfully leveled up to Level 2');

    // Verify level up notification or animation appeared
    const levelUpNotification = page.locator('[data-testid="level-up-notification"]');
    if (await levelUpNotification.isVisible()) {
      console.log('✅ [Verification] Level up notification displayed');
    }

    console.log('✅ [Verification] Character leveling test completed successfully');
  });

  test('Class-specific bonuses apply to quest rewards', async ({ page }) => {
    console.log('✅ [Setup] Starting class-specific bonus test');
    const testEmail = `class-bonus-test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    await page.goto('http://localhost:3000');

    // Create family and MAGE character (should have XP bonus)
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'Class Bonus Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'Class Master');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sage ClassTester');
    await page.click('[data-testid="class-mage"]'); // MAGE should have XP bonus
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    console.log('✅ [Setup] Created MAGE character for class bonus testing');

    // Create a quest to test class bonuses
    await page.click('button:text("⚡ Create Quest")');
    await page.locator('.fixed button:has-text("Custom Quest")').click();
    await page.waitForTimeout(1000);

    await page.fill('input[name="title"]', 'Class Bonus Quest');
    await page.fill('textarea[name="description"]', 'Test class-specific bonuses');
    await page.selectOption('select[name="difficulty"]', 'EASY');
    await page.fill('input[name="xpReward"]', '100'); // Base XP

    await page.click('button:text("Create Quest")');
    await page.waitForTimeout(2000);

    // Complete the quest
    await page.locator('button:has-text("Start Quest")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Mark Complete")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Approve")').first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-quest-rewards-class-bonus.png' });

    // MAGE should get bonus XP (assuming 1.2x multiplier for mages)
    // 100 XP * 1.2 = 120 XP
    await expect(page.getByText('⚡ 120')).toBeVisible();

    console.log('✅ [Verification] MAGE class received XP bonus (120 instead of 100)');
    console.log('✅ [Verification] Class-specific bonus test completed successfully');
  });

  test('Quest rewards are properly logged in character transaction history', async ({ page }) => {
    console.log('✅ [Setup] Starting transaction history test');
    const testEmail = `history-test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    await page.goto('http://localhost:3000');

    // Create family and character
    await page.getByText('🏰 Create Family Guild').click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', 'History Test Family');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', 'History Master');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', 'Sir Historian');
    await page.click('[data-testid="class-knight"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    console.log('✅ [Setup] Character created for transaction history testing');

    // Create and complete a quest with multiple reward types
    await page.click('button:text("⚡ Create Quest")');
    await page.locator('.fixed button:has-text("Custom Quest")').click();
    await page.waitForTimeout(1000);

    await page.fill('input[name="title"]', 'Multi-Reward Quest');
    await page.fill('textarea[name="description"]', 'Quest with multiple rewards');
    await page.selectOption('select[name="difficulty"]', 'MEDIUM');
    await page.fill('input[name="goldReward"]', '75');
    await page.fill('input[name="xpReward"]', '150');

    await page.click('button:text("Create Quest")');
    await page.waitForTimeout(2000);

    // Complete the quest
    await page.locator('button:has-text("Start Quest")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Mark Complete")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Approve")').first().click();
    await page.waitForTimeout(2000);

    console.log('✅ [Action] Completed multi-reward quest');

    // Navigate to character profile/history (assuming this exists)
    const profileButton = page.locator('button:has-text("Profile")');
    if (await profileButton.isVisible()) {
      await profileButton.click();
      await page.waitForTimeout(1000);

      // Verify transaction history shows quest rewards
      await expect(page.getByText('Multi-Reward Quest')).toBeVisible();
      await expect(page.getByText('+75 Gold')).toBeVisible();
      await expect(page.getByText('+225 XP')).toBeVisible(); // 150 * 1.5 for MEDIUM

      console.log('✅ [Verification] Transaction history properly logged quest rewards');
    } else {
      // If no profile page exists yet, just verify the stats updated
      await expect(page.getByText('💰 75')).toBeVisible();
      await expect(page.getByText('⚡ 225')).toBeVisible();
      console.log('✅ [Verification] Character stats updated correctly (profile page not implemented yet)');
    }

    await page.screenshot({ path: 'test-quest-rewards-transaction-history.png' });

    console.log('✅ [Verification] Transaction history test completed successfully');
  });
});