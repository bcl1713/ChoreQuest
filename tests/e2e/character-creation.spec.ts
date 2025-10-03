import { test, expect } from '@playwright/test';
import { setupUserAtCharacterCreation, setupUserWithCharacter, commonBeforeEach } from './helpers/setup-helpers';

test.describe('Character Creation', () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test('complete character creation flow', async ({ page }) => {
    const user = await setupUserWithCharacter(page, 'CharCreation');

    // Verify dashboard elements
    await expect(page.getByText(`Welcome back, ${user.characterName}!`)).toBeVisible();
    await expect(page.getByText('🛡️ Knight')).toBeVisible();
    await expect(page.getByText('Level 1')).toBeVisible();
    await expect(page.getByText('💰 0')).toBeVisible();
    await expect(page.getByText('⚡ 0')).toBeVisible();
    await expect(page.getByText('💎 0')).toBeVisible();
    await expect(page.getByText('🏅 0')).toBeVisible();
  });

  test('existing user redirects to dashboard', async ({ page }) => {
    // Create user with character
    const user = await setupUserWithCharacter(page, 'ExistingUser');

    // Navigate back to home - should show "Enter Your Realm"
    await page.goto('/');
    await expect(page.getByText('🏰 Enter Your Realm')).toBeVisible();

    // Clicking should redirect to dashboard
    await page.getByText('🏰 Enter Your Realm').click();
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(`Welcome back, ${user.characterName}!`)).toBeVisible();
  });

  test('character creation form validation', async ({ page }) => {
    const user = await setupUserAtCharacterCreation(page, 'Validation');

    const submitButton = page.locator('button:text("Begin Your Quest")');
    const nameInput = page.locator('input#characterName');

    // Verify character name is pre-filled from family creation
    await expect(nameInput).toHaveValue(user.userName);

    // With pre-filled name but no class - still disabled
    await expect(submitButton).toBeDisabled();

    // Clear name, select class - still disabled (name required)
    await page.fill('input#characterName', '');
    await page.click('[data-testid="class-knight"]');
    await expect(submitButton).toBeDisabled();

    // Restore name and verify button is enabled
    await page.fill('input#characterName', 'Valid Hero');
    await expect(submitButton).toBeEnabled();
  });

  test('character name pre-fills from family creation and is editable', async ({ page }) => {
    const user = await setupUserAtCharacterCreation(page, 'PreFillTest');

    const nameInput = page.locator('input#characterName');

    // Verify character name is pre-filled with userName from family creation
    await expect(nameInput).toHaveValue(user.userName);

    // Verify the name is editable
    const editedName = 'Edited Hero Name';
    await nameInput.fill(editedName);
    await expect(nameInput).toHaveValue(editedName);

    // Select class and complete character creation with edited name
    await page.click('[data-testid="class-mage"]');
    await page.click('button:text("Begin Your Quest")');

    // Verify character was created with edited name
    await page.waitForURL(/.*\/dashboard/, { timeout: 20000 });
    await expect(page.getByText(`Welcome back, ${editedName}!`)).toBeVisible();
  });

  test('class bonus information displays correctly', async ({ page }) => {
    await setupUserAtCharacterCreation(page, 'BonusDisplay');

    // Verify Mage bonuses
    const mageCard = page.locator('[data-testid="class-mage"]');
    await expect(mageCard).toContainText('Mage');
    await expect(mageCard).toContainText('Bonuses on ALL quests:');
    await expect(mageCard).toContainText('+20% XP');

    // Verify Rogue bonuses
    const rogueCard = page.locator('[data-testid="class-rogue"]');
    await expect(rogueCard).toContainText('Rogue');
    await expect(rogueCard).toContainText('+15% Gold');

    // Verify Knight bonuses
    const knightCard = page.locator('[data-testid="class-knight"]');
    await expect(knightCard).toContainText('Knight');
    await expect(knightCard).toContainText('+5% XP');
    await expect(knightCard).toContainText('+5% Gold');

    // Verify Healer bonuses
    const healerCard = page.locator('[data-testid="class-healer"]');
    await expect(healerCard).toContainText('Healer');
    await expect(healerCard).toContainText('+10% XP');
    await expect(healerCard).toContainText('+25% Honor');

    // Verify Ranger bonuses
    const rangerCard = page.locator('[data-testid="class-ranger"]');
    await expect(rangerCard).toContainText('Ranger');
    await expect(rangerCard).toContainText('+30% Gems');
  });

  test('class selection is scrollable on mobile viewport', async ({ page }) => {
    // Set mobile viewport size
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

    await setupUserAtCharacterCreation(page, 'MobileScroll');

    // Verify first class card (Knight) is visible initially
    const knightCard = page.locator('[data-testid="class-knight"]');
    await expect(knightCard).toBeVisible();

    // Verify last class card (Ranger) might not be fully visible initially on mobile
    const rangerCard = page.locator('[data-testid="class-ranger"]');

    // Get the scrollable container - it's the parent div with overflow-x-auto
    const classContainer = page.locator('div.overflow-x-auto');
    await expect(classContainer).toBeVisible();

    // Scroll to the right to see the last card
    await classContainer.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });

    // Wait a moment for scroll to complete
    await page.waitForTimeout(500);

    // Verify Ranger card is now visible after scrolling
    await expect(rangerCard).toBeVisible();

    // Verify we can select a class on mobile
    await rangerCard.click();
    await expect(rangerCard).toHaveClass(/ring-2 ring-gold-500/);
  });
});