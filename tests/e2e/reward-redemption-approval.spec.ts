import { test, expect } from '@playwright/test';
import { setupTestUser, giveCharacterGoldViaQuest } from './helpers/setup-helpers';

test.describe('Reward Redemption Approval Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('GM sees pending redemptions section in RewardManager', async ({ page }) => {
    // Setup: Create Guild Master with character
    await setupTestUser(page);

    // Create a reward
    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.click('button:has-text("Create Reward")');
    await page.fill('[data-testid="reward-name-input"]', 'Approval Test Reward');
    await page.fill('[data-testid="reward-description-input"]', 'Test redemption approval');
    await page.selectOption('[data-testid="reward-type-select"]', 'SCREEN_TIME');
    await page.fill('[data-testid="reward-cost-input"]', '50');
    await page.click('[data-testid="save-reward-button"]');
    await page.waitForTimeout(500);

    // Give hero gold and redeem reward
    await giveCharacterGoldViaQuest(page, 100);
    await page.click('button:has-text("🏪 Reward Store")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Redeem Reward")');
    await page.waitForTimeout(500);

    // Navigate to Reward Management
    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.waitForTimeout(500);

    // Verify pending redemptions section exists
    await expect(page.locator('[data-testid="pending-redemptions-section"]')).toBeVisible();
    await expect(page.locator('text=Pending Redemptions')).toBeVisible();

    // Verify redemption appears in pending list
    await expect(page.locator('[data-testid="pending-redemption-item"]')).toHaveCount(1);
  });

  test('GM can approve redemption', async ({ page }) => {
    // Setup and create redemption
    await setupTestUser(page);

    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.click('button:has-text("Create Reward")');
    await page.fill('[data-testid="reward-name-input"]', 'Approve Test');
    await page.fill('[data-testid="reward-description-input"]', 'Test approval');
    await page.selectOption('[data-testid="reward-type-select"]', 'PRIVILEGE');
    await page.fill('[data-testid="reward-cost-input"]', '75');
    await page.click('[data-testid="save-reward-button"]');
    await page.waitForTimeout(500);

    await giveCharacterGoldViaQuest(page, 150);
    await page.click('button:has-text("🏪 Reward Store")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Redeem Reward")');
    await page.waitForTimeout(500);

    // Go to Reward Management
    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.waitForTimeout(500);

    // Approve the redemption
    await page.click('[data-testid="approve-redemption-button"]');
    await page.waitForTimeout(500);

    // Verify redemption moved from pending to approved section
    await expect(page.locator('[data-testid="pending-redemption-item"]')).toHaveCount(0);

    // Verify it appears in redemption history as APPROVED
    await expect(page.locator('text=APPROVED')).toBeVisible();
  });

  test('GM can deny redemption and gold is refunded', async ({ page }) => {
    // Setup and create redemption
    await setupTestUser(page);

    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.click('button:has-text("Create Reward")');
    await page.fill('[data-testid="reward-name-input"]', 'Deny Test');
    await page.fill('[data-testid="reward-description-input"]', 'Test denial');
    await page.selectOption('[data-testid="reward-type-select"]', 'PURCHASE');
    await page.fill('[data-testid="reward-cost-input"]', '60');
    await page.click('[data-testid="save-reward-button"]');
    await page.waitForTimeout(500);

    await giveCharacterGoldViaQuest(page, 100);
    await page.click('button:has-text("🏪 Reward Store")');
    await page.waitForTimeout(500);

    // Capture gold before redemption
    const goldBeforeText = await page.locator('[data-testid="gold-balance"]').textContent();
    const goldBefore = parseInt(goldBeforeText?.match(/\d+/)?.[0] || '0');

    await page.click('button:has-text("Redeem Reward")');
    await page.waitForTimeout(500);

    // Verify gold was deducted
    const goldAfterRedeemText = await page.locator('[data-testid="gold-balance"]').textContent();
    const goldAfterRedeem = parseInt(goldAfterRedeemText?.match(/\d+/)?.[0] || '0');
    expect(goldAfterRedeem).toBe(goldBefore - 60);

    // Go to Reward Management and deny
    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.waitForTimeout(500);
    await page.click('[data-testid="deny-redemption-button"]');
    await page.waitForTimeout(500);

    // Verify redemption is removed from pending
    await expect(page.locator('[data-testid="pending-redemption-item"]')).toHaveCount(0);

    // Check gold was refunded
    await page.click('button:has-text("🏪 Reward Store")');
    await page.waitForTimeout(500);
    const goldAfterDenyText = await page.locator('[data-testid="gold-balance"]').textContent();
    const goldAfterDeny = parseInt(goldAfterDenyText?.match(/\d+/)?.[0] || '0');
    expect(goldAfterDeny).toBe(goldBefore); // Should be back to original
  });

  test('GM can fulfill approved redemption', async ({ page }) => {
    // Setup and create redemption
    await setupTestUser(page);

    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.click('button:has-text("Create Reward")');
    await page.fill('[data-testid="reward-name-input"]', 'Fulfill Test');
    await page.fill('[data-testid="reward-description-input"]', 'Test fulfillment');
    await page.selectOption('[data-testid="reward-type-select"]', 'EXPERIENCE');
    await page.fill('[data-testid="reward-cost-input"]', '80');
    await page.click('[data-testid="save-reward-button"]');
    await page.waitForTimeout(500);

    await giveCharacterGoldViaQuest(page, 150);
    await page.click('button:has-text("🏪 Reward Store")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Redeem Reward")');
    await page.waitForTimeout(500);

    // Go to Reward Management and approve
    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.waitForTimeout(500);
    await page.click('[data-testid="approve-redemption-button"]');
    await page.waitForTimeout(500);

    // Now fulfill the approved redemption
    await page.click('[data-testid="fulfill-redemption-button"]');
    await page.waitForTimeout(500);

    // Verify status is FULFILLED
    await expect(page.locator('text=FULFILLED')).toBeVisible();
  });

  test('Realtime updates when redemption status changes', async ({ page, context }) => {
    // Setup: Create Guild Master
    await setupTestUser(page);

    // Create reward
    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.click('button:has-text("Create Reward")');
    await page.fill('[data-testid="reward-name-input"]', 'Realtime Test');
    await page.fill('[data-testid="reward-description-input"]', 'Test realtime');
    await page.selectOption('[data-testid="reward-type-select"]', 'SCREEN_TIME');
    await page.fill('[data-testid="reward-cost-input"]', '50');
    await page.click('[data-testid="save-reward-button"]');
    await page.waitForTimeout(500);

    // Give gold and redeem
    await giveCharacterGoldViaQuest(page, 100);
    await page.click('button:has-text("🏪 Reward Store")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Redeem Reward")');
    await page.waitForTimeout(500);

    // Open second tab for same user
    const page2 = await context.newPage();
    await page2.goto('/dashboard');
    await page2.waitForTimeout(1000);
    await page2.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page2.waitForTimeout(500);

    // Verify redemption appears in second tab
    await expect(page2.locator('[data-testid="pending-redemption-item"]')).toHaveCount(1);

    // Approve in first tab
    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.waitForTimeout(500);
    await page.click('[data-testid="approve-redemption-button"]');
    await page.waitForTimeout(1000);

    // Verify realtime update in second tab - pending count goes to 0
    await expect(page2.locator('[data-testid="pending-redemption-item"]')).toHaveCount(0, { timeout: 5000 });

    await page2.close();
  });

  test('Hero sees status change in redemption history', async ({ page }) => {
    // Setup and create redemption
    await setupTestUser(page);

    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.click('button:has-text("Create Reward")');
    await page.fill('[data-testid="reward-name-input"]', 'Hero View Test');
    await page.fill('[data-testid="reward-description-input"]', 'Test hero view');
    await page.selectOption('[data-testid="reward-type-select"]', 'PRIVILEGE');
    await page.fill('[data-testid="reward-cost-input"]', '50');
    await page.click('[data-testid="save-reward-button"]');
    await page.waitForTimeout(500);

    await giveCharacterGoldViaQuest(page, 100);

    // Hero redeems
    await page.click('button:has-text("🏪 Reward Store")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Redeem Reward")');
    await page.waitForTimeout(500);

    // Verify hero sees PENDING status
    await expect(page.locator('text=PENDING')).toBeVisible();

    // GM approves
    await page.click('button:has-text("⚙️ Reward Management"), button:has-text("⚙️ Manage")');
    await page.waitForTimeout(500);
    await page.click('[data-testid="approve-redemption-button"]');
    await page.waitForTimeout(500);

    // Hero checks reward store
    await page.click('button:has-text("🏪 Reward Store")');
    await page.waitForTimeout(1000);

    // Verify hero sees APPROVED status via realtime update
    await expect(page.locator('text=APPROVED')).toBeVisible({ timeout: 5000 });
  });
});
