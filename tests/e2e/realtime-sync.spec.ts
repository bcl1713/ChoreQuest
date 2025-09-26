import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { setupTestUser } from './helpers/setup-helpers';

test.describe('Real-Time Multi-Tab Synchronization', () => {
  let browser: Browser;
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser: testBrowser }) => {
    browser = testBrowser;

    // Create two separate browser contexts to simulate different clients
    context1 = await browser.newContext();
    context2 = await browser.newContext();

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // Setup user and family for both pages
    await page1.goto('/');
    const { token } = await setupTestUser(page1);

    // Share the same authentication token between both pages
    await page2.goto('/');
    await page2.evaluate((authToken) => {
      localStorage.setItem('chorequest-auth', JSON.stringify({
        token: authToken,
        user: JSON.parse(localStorage.getItem('chorequest-auth') || '{}').user
      }));
    }, token);
    await page2.reload();

    // Both pages should be on dashboard
    await expect(page1).toHaveURL(/\/dashboard/);
    await expect(page2).toHaveURL(/\/dashboard/);
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
  });

  test('should sync quest status updates across tabs', async () => {
    // Wait for real-time connection indicators on both pages
    await expect(page1.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });
    await expect(page2.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });

    // Create a test quest on page1
    await page1.click('text=Create New Quest');
    await page1.fill('input[placeholder*="quest title"]', 'Test Real-time Quest');
    await page1.selectOption('select', 'DAILY');
    await page1.click('[data-testid="create-quest-btn"]');

    // Wait for quest to appear on both pages
    const questSelector = '[data-testid*="quest-"]';
    await expect(page1.locator(questSelector)).toBeVisible();
    await expect(page2.locator(questSelector)).toBeVisible();

    // Start quest on page1
    const questStartButton = page1.locator('[data-testid*="quest-start-btn-"]').first();
    await questStartButton.click();

    // Verify quest status updates in real-time on both pages
    await expect(page1.locator('[data-testid*="quest-status-"]').first()).toHaveText('STARTED');
    await expect(page2.locator('[data-testid*="quest-status-"]').first()).toHaveText('STARTED', { timeout: 5000 });

    // Complete quest on page2
    const questCompleteButton = page2.locator('button:has-text("Mark Complete")').first();
    await questCompleteButton.click();

    // Verify completion status syncs to page1
    await expect(page2.locator('[data-testid*="quest-status-"]').first()).toHaveText('COMPLETED');
    await expect(page1.locator('[data-testid*="quest-status-"]').first()).toHaveText('COMPLETED', { timeout: 5000 });

    // As Guild Master, approve quest on page1
    const approveButton = page1.locator('button:has-text("Approve")').first();
    await approveButton.click();

    // Verify approval status syncs to page2
    await expect(page1.locator('[data-testid*="quest-status-"]').first()).toHaveText('APPROVED');
    await expect(page2.locator('[data-testid*="quest-status-"]').first()).toHaveText('APPROVED', { timeout: 5000 });
  });

  test('should sync character stats updates across tabs', async () => {
    // Wait for real-time connections
    await expect(page1.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });
    await expect(page2.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });

    // Get initial character stats from page1
    const { user } = await setupTestUser(page1);

    const initialGold = await page1.locator('[data-testid*="character-gold-"]').first().textContent();
    const initialXP = await page1.locator('[data-testid*="character-xp-"]').first().textContent();

    // Verify same stats on page2
    await expect(page2.locator('[data-testid*="character-gold-"]').first()).toHaveText(initialGold || '');
    await expect(page2.locator('[data-testid*="character-xp-"]').first()).toHaveText(initialXP || '');

    // Update character stats via API (simulating quest completion)
    await page1.evaluate(async ({ userId }) => {
      const response = await fetch('/api/test/character/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: {
            gold: 150,
            xp: 1200,
            level: 5
          }
        })
      });
      if (!response.ok) throw new Error('Failed to update character stats');
    }, { userId: user.id });

    // Verify stats update in real-time on both pages
    await expect(page1.locator('[data-testid*="character-gold-"]').first()).toHaveText(/150/, { timeout: 5000 });
    await expect(page1.locator('[data-testid*="character-level-"]').first()).toHaveText(/5/, { timeout: 5000 });

    await expect(page2.locator('[data-testid*="character-gold-"]').first()).toHaveText(/150/, { timeout: 5000 });
    await expect(page2.locator('[data-testid*="character-level-"]').first()).toHaveText(/5/, { timeout: 5000 });
  });

  test('should sync reward redemption updates across tabs', async () => {
    // Wait for real-time connections
    await expect(page1.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });
    await expect(page2.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });

    // Give user some gold first
    const { user } = await setupTestUser(page1);
    await page1.evaluate(async ({ userId }) => {
      const response = await fetch('/api/test/character/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: { gold: 200 }
        })
      });
      if (!response.ok) throw new Error('Failed to update character stats');
    }, { userId: user.id });

    // Navigate to reward store on both pages
    await page1.click('button:has-text("🏪 Reward Store")');
    await page2.click('button:has-text("🏪 Reward Store")');

    // Wait for reward store to load
    await expect(page1.locator('h2:has-text("⭐ Reward Store")')).toBeVisible();
    await expect(page2.locator('h2:has-text("⭐ Reward Store")')).toBeVisible();

    // Check if there are rewards available (depends on seed data)
    const rewardsExist = await page1.locator('[data-testid*="reward-"]').count() > 0;

    if (rewardsExist) {
      // Request reward on page1
      const redeemButton = page1.locator('button:has-text("Redeem")').first();
      await redeemButton.click();

      // Wait for redemption to appear in Recent Redemptions on both pages
      await expect(page1.locator('[data-testid*="redemption-"]').first()).toBeVisible({ timeout: 5000 });
      await expect(page2.locator('[data-testid*="redemption-"]').first()).toBeVisible({ timeout: 5000 });

      // Verify status is PENDING on both pages
      await expect(page1.locator('[data-testid*="redemption-status-"]').first()).toHaveText('PENDING');
      await expect(page2.locator('[data-testid*="redemption-status-"]').first()).toHaveText('PENDING');

      // As Guild Master, approve redemption on page2
      const approveRedemptionButton = page2.locator('button:has-text("Approve")').first();
      if (await approveRedemptionButton.isVisible()) {
        await approveRedemptionButton.click();

        // Verify status updates to APPROVED on both pages in real-time
        await expect(page2.locator('[data-testid*="redemption-status-"]').first()).toHaveText('APPROVED');
        await expect(page1.locator('[data-testid*="redemption-status-"]').first()).toHaveText('APPROVED', { timeout: 5000 });

        // Mark as fulfilled on page1
        const fulfillButton = page1.locator('button:has-text("Mark as Fulfilled")').first();
        if (await fulfillButton.isVisible()) {
          await fulfillButton.click();

          // Verify status updates to FULFILLED on both pages
          await expect(page1.locator('[data-testid*="redemption-status-"]').first()).toHaveText('FULFILLED');
          await expect(page2.locator('[data-testid*="redemption-status-"]').first()).toHaveText('FULFILLED', { timeout: 5000 });
        }
      }
    } else {
      // Skip this test if no rewards exist
      test.skip(true, 'No rewards available in test environment');
    }
  });

  test('should sync family activity feed across tabs', async () => {
    // Wait for real-time connections
    await expect(page1.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });
    await expect(page2.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });

    // Check if activity feed exists
    const activityFeedExists = await page1.locator('[data-testid="family-activity-feed"]').isVisible();

    if (activityFeedExists) {
      // Get initial activity count
      const initialActivityCount = await page1.locator('[data-testid="family-activity-feed"] > div').count();

      // Create activity by starting and completing a quest
      await page1.click('text=Create New Quest');
      await page1.fill('input[placeholder*="quest title"]', 'Activity Test Quest');
      await page1.click('[data-testid="create-quest-btn"]');

      // Start the quest
      await page1.locator('[data-testid*="quest-start-btn-"]').first().click();

      // Complete the quest
      await page1.locator('button:has-text("Mark Complete")').first().click();

      // Verify activity appears in feed on both pages
      const newActivityCount = initialActivityCount + 2; // Quest started + completed
      await expect(page1.locator('[data-testid="family-activity-feed"] > div')).toHaveCount(newActivityCount, { timeout: 5000 });
      await expect(page2.locator('[data-testid="family-activity-feed"] > div')).toHaveCount(newActivityCount, { timeout: 5000 });
    } else {
      // Skip if activity feed is not implemented yet
      test.skip(true, 'Activity feed not implemented in current version');
    }
  });

  test('should handle connection interruption and reconnection', async () => {
    // Wait for initial connections
    await expect(page1.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });
    await expect(page2.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });

    // Simulate network interruption on page1 by navigating away and back
    await page1.goto('about:blank');

    // Verify page2 remains connected
    await expect(page2.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected');

    // Navigate back and verify reconnection
    await page1.goto('/dashboard');
    await expect(page1.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });

    // Verify both pages can still sync after reconnection
    const { user } = await setupTestUser(page1);
    await page1.evaluate(async ({ userId }) => {
      const response = await fetch('/api/test/character/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: { gold: 999 }
        })
      });
      if (!response.ok) throw new Error('Failed to update character stats');
    }, { userId: user.id });

    // Verify sync works on both pages
    await expect(page1.locator('[data-testid*="character-gold-"]').first()).toHaveText(/999/, { timeout: 5000 });
    await expect(page2.locator('[data-testid*="character-gold-"]').first()).toHaveText(/999/, { timeout: 5000 });
  });

  test('should sync user role changes across tabs', async () => {
    // Wait for real-time connections
    await expect(page1.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });
    await expect(page2.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });

    // This test assumes Guild Master promotion/demotion functionality exists
    const guildMasterActionsExist = await page1.locator('[data-testid="guild-master-actions"]').isVisible();

    if (guildMasterActionsExist) {
      // Get user info
      const { user } = await setupTestUser(page1);

      // Create a second family member to promote
      await page1.evaluate(async ({ familyId }) => {
        const response = await fetch('/api/test/user/create-family-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            familyId,
            name: 'Test Family Member',
            email: 'member@test.com',
            role: 'HERO'
          })
        });
        if (!response.ok) throw new Error('Failed to create family member');
      }, { familyId: user.familyId });

      // Verify role change controls are visible
      const promoteButton = page1.locator('[data-testid*="promote-user-"]').first();
      if (await promoteButton.isVisible()) {
        await promoteButton.click();

        // Verify role change notification appears on both pages
        await expect(page1.locator('text*="promoted to Guild Master"')).toBeVisible({ timeout: 5000 });
        await expect(page2.locator('text*="promoted to Guild Master"')).toBeVisible({ timeout: 5000 });

        // Verify family member list updates on both pages
        await expect(page1.locator('[data-testid*="user-role-"]').first()).toHaveText('GUILD_MASTER');
        await expect(page2.locator('[data-testid*="user-role-"]').first()).toHaveText('GUILD_MASTER', { timeout: 5000 });
      } else {
        test.skip(true, 'User role management not implemented in current version');
      }
    } else {
      test.skip(true, 'Guild Master actions not implemented in current version');
    }
  });

  test('should handle simultaneous actions from multiple tabs gracefully', async () => {
    // Wait for real-time connections
    await expect(page1.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });
    await expect(page2.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });

    // Create multiple quests simultaneously from both tabs
    const promises = [];

    // Create quest from page1
    promises.push(
      (async () => {
        await page1.click('text=Create New Quest');
        await page1.fill('input[placeholder*="quest title"]', 'Simultaneous Quest 1');
        await page1.selectOption('select', 'DAILY');
        await page1.click('[data-testid="create-quest-btn"]');
      })()
    );

    // Create quest from page2
    promises.push(
      (async () => {
        await page2.click('text=Create New Quest');
        await page2.fill('input[placeholder*="quest title"]', 'Simultaneous Quest 2');
        await page2.selectOption('select', 'DAILY');
        await page2.click('[data-testid="create-quest-btn"]');
      })()
    );

    // Wait for both operations to complete
    await Promise.all(promises);

    // Verify both quests appear on both pages
    await expect(page1.locator('text=Simultaneous Quest 1')).toBeVisible({ timeout: 5000 });
    await expect(page1.locator('text=Simultaneous Quest 2')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=Simultaneous Quest 1')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=Simultaneous Quest 2')).toBeVisible({ timeout: 5000 });
  });

  test('should maintain connection across page refreshes', async () => {
    // Wait for initial connection
    await expect(page1.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });

    // Refresh page
    await page1.reload();

    // Verify connection is re-established
    await expect(page1.locator('[data-testid="realtime-connection-status"]')).toHaveText('connected', { timeout: 10000 });

    // Verify sync still works after refresh
    const { user } = await setupTestUser(page1);
    await page2.evaluate(async ({ userId }) => {
      const response = await fetch('/api/test/character/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: { gold: 777 }
        })
      });
      if (!response.ok) throw new Error('Failed to update character stats');
    }, { userId: user.id });

    // Verify update appears on refreshed page
    await expect(page1.locator('[data-testid*="character-gold-"]').first()).toHaveText(/777/, { timeout: 5000 });
  });
});